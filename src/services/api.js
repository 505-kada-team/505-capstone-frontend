/**
 * services/api.js — Modul Inventory
 *
 * ATURAN (dari CONVENTIONS.md):
 * - Semua pemanggilan API WAJIB lewat file ini. Jangan import axios langsung di komponen.
 * - Nama fungsi mengikuti pola [verb][Resource], berdasarkan resource bukan role.
 * - Satu file ini dipakai bersama oleh role admin dan kasir.
 *
 * MODE MOCK:
 * - Set USE_MOCK = true selama backend belum siap.
 * - Set USE_MOCK = false begitu backend sudah bisa dihit — tidak perlu ubah kode di komponen.
 * - Bentuk data mock di lib/mockData.js WAJIB identik dengan response API asli.
 *
 * Referensi endpoint: 505_Database Schema_inventory.md (14 endpoint, section 5)
 */

import axios from 'axios';
import {
  // Endpoint 1 — POST /api/inventory
  mockAddInventory,
  // Endpoint 2 — GET /api/inventory
  mockInventoryList,
  // Endpoint 3 — GET /api/inventory/dropdown
  mockInventoryDropdown,
  // Endpoint 4 — GET /api/inventory/:id
  mockInventoryDetail,
  // Endpoint 5 — PUT /api/inventory/:id
  mockEditInventory,
  // Endpoint 6 — DELETE /api/inventory/:id
  mockDeleteInventory,
  // Endpoint 7 — POST /api/inventory/:id/subinventory
  mockAddSubInventoryBatch,
  // Endpoint 8 — GET /api/inventory/:id/subinventory
  mockSubInventoryList,
  // Endpoint 9 — DELETE /api/subinventory/:id
  mockDeleteSubInventory,
  // Endpoint 10 — GET /api/history-sub-inventory
  mockHistorySubInventory,
  // Endpoint 11 — POST /api/subinventory/check-availability
  mockCheckAvailabilitySufficient,
  // Endpoint 12 — POST /api/subinventory/deduct
  mockDeductStock,
  // Endpoint 13 — POST /api/subinventory/deduct/reverse
  mockDeductReverse,
  // Endpoint 14 — GET /api/history-usage
  mockHistoryUsage,

} from '../lib/mockData';

/* ==========================================================================
 * AXIOS INSTANCE
 * ========================================================================== */

/**
 * VITE_API_URL berasal dari file .env.
 *
 * Contoh:
 * VITE_API_URL=https://backend-example.com
 *
 * Jangan menyimpan URL backend secara hardcode di file ini.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-platform': 'web',
  },
});

/* ==========================================================================
 * ACCESS TOKEN MANAGEMENT
 * ========================================================================== */

/**
 * Access token disimpan di memory.
 *
 * Refresh token diasumsikan disimpan oleh backend dalam cookie HTTP-only.
 */
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

/**
 * Satu sumber kebenaran untuk ekstraksi access token dari response body.
 *
 * ⚠️ Nama field `accessToken` / `token` masih tebakan (fallback ganda) —
 * begitu shape response backend dikonfirmasi, hapus salah satu cabang ini
 * supaya kesalahan shape tidak tertutup diam-diam.
 */
export const extractAccessToken = (data) =>
  data?.accessToken ?? data?.token;

/* ==========================================================================
 * AUTH CALLBACK HANDLERS
 * ========================================================================== */

/**
 * Callback ini diisi dari AuthProvider.
 *
 * onRefreshed:
 * Dipanggil ketika access token berhasil diperbarui.
 *
 * onExpired:
 * Dipanggil ketika refresh token gagal sehingga sesi berakhir.
 */
let onTokenRefreshed = null;
let onSessionExpired = null;

export const setAuthHandlers = ({
  onRefreshed,
  onExpired,
}) => {
  onTokenRefreshed = onRefreshed;
  onSessionExpired = onExpired;
};

/* ==========================================================================
 * REFRESH TOKEN SINGLE-FLIGHT
 * ========================================================================== */

/**
 * Menyimpan Promise refresh yang sedang berjalan.
 *
 * Jika refresh dipanggil beberapa kali secara bersamaan, semua pemanggil
 * akan menggunakan Promise yang sama sehingga backend hanya menerima
 * satu POST /auth/refresh.
 */
let refreshPromise = null;

export const refreshAccessToken = () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = api.post('/auth/refresh').then((response) => {
      const refreshResult =
        response.data?.data ?? response.data;

      //console.log('[REFRESH RESPONSE]', refreshResult);

      const newToken =
        extractAccessToken(refreshResult);

      if (!newToken) {
        throw new Error(
          'Backend tidak mengembalikan access token saat refresh.',
        );
      }

      setAccessToken(newToken);
      onTokenRefreshed?.(newToken);

      return refreshResult;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

/* ==========================================================================
 * REQUEST INTERCEPTOR
 * ========================================================================== */

/**
 * Menambahkan access token ke setiap request yang membutuhkan autentikasi.
 */
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* ==========================================================================
 * RESPONSE INTERCEPTOR
 * ========================================================================== */

/**
 * Endpoint berikut tidak boleh memicu refresh token otomatis.
 *
 * Hal ini mencegah infinite loop ketika login, register,
 * atau refresh token sendiri mengembalikan status 401.
 */
const EXCLUDE_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

let isRefreshing = false;
let refreshQueue = [];

/**
 * Menjalankan kembali request yang sebelumnya menunggu refresh token.
 */
const resolveRefreshQueue = (newToken) => {
  refreshQueue.forEach(
    ({ resolve, originalRequest }) => {
      originalRequest.headers =
        originalRequest.headers ?? {};

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      // Tandai request yang di-queue ini juga sudah pernah di-retry,
      // supaya kalau token baru ternyata tetap gagal, tidak memicu
      // siklus refresh baru lagi.
      originalRequest._retry = true;

      resolve(api(originalRequest));
    },
  );

  refreshQueue = [];
};

/**
 * Menolak semua request yang menunggu jika refresh token gagal.
 */
const rejectRefreshQueue = (error) => {
  refreshQueue.forEach(({ reject }) => {
    reject(error);
  });

  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    /**
     * Jika error tidak mempunyai konfigurasi request,
     * request tidak dapat dicoba ulang.
     */
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isExcluded = EXCLUDE_REFRESH.some((path) =>
      originalRequest.url?.includes(path),
    );

    const shouldRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isExcluded;

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    /**
     * Jika proses refresh sedang berjalan, simpan request
     * berikutnya ke dalam antrean.
     */
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve,
          reject,
          originalRequest,
        });
      });
    }

    isRefreshing = true;

    try {
      /**
       * Refresh token berada dalam cookie HTTP-only.
       *
       * withCredentials: true pada Axios instance memastikan
       * cookie ikut terkirim ke backend.
       *
       * Request ini tetap diletakkan di service layer dan tidak
       * dipanggil dari komponen.
       */
      const refreshResult =
        await refreshAccessToken();

      const newToken =
        extractAccessToken(refreshResult);

      if (!newToken) {
        throw new Error(
          'Backend tidak mengembalikan access token saat refresh.',
        );
      }

      /**
       * Jalankan semua request yang sebelumnya menunggu.
       */
      resolveRefreshQueue(newToken);

      originalRequest.headers =
        originalRequest.headers ?? {};

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      rejectRefreshQueue(refreshError);

      clearAccessToken();

      onSessionExpired?.();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

// ---------------------------------------------------------------------------
// Flag mock global — ubah ke false saat backend sudah siap
// ---------------------------------------------------------------------------
const USE_MOCK = true;

// =============================================================================
// ENDPOINT 1 — POST /api/inventory
// Buat inventory baru
// Payload: { nameInventory, category, unit, description }
// =============================================================================
export const createInventory = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockAddInventory })
    : api.post('/api/inventory', payload);

// =============================================================================
// ENDPOINT 2 — GET /api/inventory
// List semua inventory (paginated, halaman manajemen)
// Params opsional: { category, search, page, limit, includeDeleted }
// =============================================================================
export const getInventoryList = (params) =>
  USE_MOCK
    ? Promise.resolve({ data: mockInventoryList })
    : api.get('/api/inventory', { params });

// =============================================================================
// ENDPOINT 3 — GET /api/inventory/dropdown
// List ringkas inventory aktif untuk dropdown create Menu/Plan
// Params opsional: { category, search }
// Tanpa pagination — kembalikan seluruh data aktif yang match filter
// =============================================================================
export const getInventoryDropdown = (params) =>
  USE_MOCK
    ? Promise.resolve({ data: mockInventoryDropdown })
    : api.get('/api/inventory/dropdown', { params });

// =============================================================================
// ENDPOINT 4 — GET /api/inventory/:id
// Detail inventory + list subinventory aktif
// Backend menjalankan lazy expired-check sebelum mengembalikan data
// =============================================================================
export const getInventoryDetail = (id) =>
  USE_MOCK
    ? Promise.resolve({ data: mockInventoryDetail })
    : api.get(`/api/inventory/${id}`);

// =============================================================================
// ENDPOINT 5 — PUT /api/inventory/:id
// Edit nama atau deskripsi inventory
// Payload: { nameInventory?, description? }
// CATATAN: category dan unit TERKUNCI — backend tolak 400 kalau disertakan
// =============================================================================
export const updateInventory = (id, payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockEditInventory })
    : api.put(`/api/inventory/${id}`, payload);

// =============================================================================
// ENDPOINT 6 — DELETE /api/inventory/:id
// Arsipkan inventory (soft-delete). Hard delete tidak ada di modul ini.
// Akan ditolak 409 kalau masih ada batch aktif dengan quantity > 0
// =============================================================================
export const archiveInventory = (id) =>
  USE_MOCK
    ? Promise.resolve({ data: mockDeleteInventory })
    : api.delete(`/api/inventory/${id}`);

// =============================================================================
// ENDPOINT 7 — POST /api/inventory/:id/subinventory
// Tambah batch baru ke inventory
// Payload: { quantity, costPrices, inDate, expired, nameResponsible }
// CATATAN: expired wajib untuk ingredients, paksa null untuk packaging
// =============================================================================
export const addSubInventory = (inventoryId, payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockAddSubInventoryBatch })
    : api.post(`/api/inventory/${inventoryId}/subinventory`, payload);

// =============================================================================
// ENDPOINT 8 — GET /api/inventory/:id/subinventory
// List batch milik 1 inventory
// Params opsional: { status } — default 'active'; bisa 'depleted', 'expired', 'deleted', 'all'
// =============================================================================
export const getSubInventoryList = (inventoryId, params) =>
  USE_MOCK
    ? Promise.resolve({ data: mockSubInventoryList })
    : api.get(`/api/inventory/${inventoryId}/subinventory`, { params });

// =============================================================================
// ENDPOINT 9 — DELETE /api/subinventory/:id
// Arsipkan (soft-delete) 1 batch secara manual
// Payload opsional: { deletedBy, reason }
// =============================================================================
export const archiveSubInventory = (subInventoryId, payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockDeleteSubInventory })
    : api.delete(`/api/subinventory/${subInventoryId}`, { data: payload });

// =============================================================================
// ENDPOINT 10 — GET /api/history-sub-inventory
// Log semua transaksi pembelian batch (rekaman permanen, tidak pernah dihapus)
// Params opsional: { inventoryId, nameResponsible, startDate, endDate, page, limit }
// =============================================================================
export const getHistorySubInventory = (params) =>
  USE_MOCK
    ? Promise.resolve({ data: mockHistorySubInventory })
    : api.get('/api/history-sub-inventory', { params });

// =============================================================================
// ENDPOINT 11 — POST /api/subinventory/check-availability
// Cek ketersediaan stok — DRY RUN, tidak mengubah data apapun
// Dipanggil Production Plan saat draft/simulasi sebelum approve
// Payload: { inventoryId, quantityNeeded, availableUntil }
// Response selalu 200 (sufficient: false adalah hasil valid, bukan error)
// =============================================================================
export const checkAvailability = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockCheckAvailabilitySufficient })
    : api.post('/api/subinventory/check-availability', payload);

// =============================================================================
// ENDPOINT 12 — POST /api/subinventory/deduct
// Potong stok FEFO — MUTASI NYATA (berbeda dari endpoint 11 yang dry-run)
// Logic FEFO + batchSafetyStatus wajib identik dengan endpoint 11
// Payload: { inventoryId, quantityNeeded, planId, availableUntil? }
// availableUntil opsional — wajib dikirim oleh Production Plan saat approve
// =============================================================================
export const deductStock = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockDeductStock })
    : api.post('/api/subinventory/deduct', payload);

// =============================================================================
// ENDPOINT 13 — POST /api/subinventory/deduct/reverse
// Batalkan pemotongan stok — kembalikan quantity ke SubInventory terkait
// Payload: { planId, reason? }
// =============================================================================
export const reverseDeductStock = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockDeductReverse })
    : api.post('/api/subinventory/deduct/reverse', payload);

// =============================================================================
// ENDPOINT 14 — GET /api/history-usage
// Log semua transaksi pemakaian stok (COGS, rekaman permanen)
// Params opsional: { inventoryId, planId, startDate, endDate, page, limit }
// =============================================================================
export const getHistoryUsage = (params) =>
  USE_MOCK
    ? Promise.resolve({ data: mockHistoryUsage })
    : api.get('/api/history-usage', { params });



  

