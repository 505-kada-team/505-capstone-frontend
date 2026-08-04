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
  //=====================AUTHENTIFICATION========================//
  // Endpoint 1 — POST /api/auth/register
  mockRegisterSuccess,
  // Endpoint 2 — POST /api/auth/login
  mockLoginSuccess,
  // Endpoint 3 — POST /api/auth/verify-email
  mockVerifyEmailSuccess,
  // Endpoint 4 — POST /api/auth/resend-verification
  mockResendVerificationSuccess,
  // Endpoint 5 — POST /api/auth/forgot-password
  mockForgotPasswordSuccess,
  // Endpoint 6 — POST /api/auth/verify-reset-code
  mockVerifyResetCodeSuccess,
  // Endpoint 7 — POST /api/auth/reset-password
  mockResetPasswordSuccess,
  // Endpoint 8 — POST /api/auth/logout
  mockLogoutSuccess,
  
} from '../lib/mockData';

// ---------------------------------------------------------------------------
// Setup axios instance
// baseURL dibaca dari .env — JANGAN hardcode URL di sini
// ---------------------------------------------------------------------------
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

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



//==============================================================================
//=============================AUTHENTIFICATION=================================
//==============================================================================
/**
 * services/api.js — Modul Authentication
 *
 * ATURAN (dari CONVENTIONS.md):
 * - Semua pemanggilan API WAJIB melalui file ini.
 * - Halaman dan komponen tidak boleh mengimpor Axios secara langsung.
 * - Nama fungsi mengikuti pola [verb][Resource], berdasarkan resource,
 *   bukan berdasarkan role pengguna.
 * - File ini digunakan bersama oleh Admin dan Kasir.
 *
 * MODE MOCK:
 * - Set USE_MOCK = true selama backend authentication belum tersedia.
 * - Set USE_MOCK = false setelah backend siap digunakan.
 * - Komponen tidak perlu diubah ketika berpindah dari mock ke backend.
 * - Bentuk data di lib/mockData.js WAJIB identik dengan response API asli.
 *
 * CATATAN:
 * - Pengguna tidak memilih role saat login.
 * - Role dikembalikan oleh backend melalui response login.
 * - Endpoint dan payload harus disesuaikan dengan API contract final.
 */

// ---------------------------------------------------------------------------
// Axios interceptor
// Menambahkan access token pada request yang membutuhkan authentication
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// =============================================================================
// ENDPOINT 1 — POST /api/auth/register
// Mendaftarkan pengguna baru
// Payload: { name, email, password }
// Role tidak dikirim dari frontend karena ditentukan oleh backend
// =============================================================================
export const register = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockRegisterSuccess })
    : api.post("/api/auth/register", payload)

// =============================================================================
// ENDPOINT 2 — POST /api/auth/login
// Login menggunakan email dan password
// Payload: { email, password }
// Response: access token, data user, dan role
// =============================================================================
export const login = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockLoginSuccess })
    : api.post("/api/auth/login", payload)

// =============================================================================
// ENDPOINT 3 — POST /api/auth/verify-email
// Memverifikasi email menggunakan kode verifikasi
// Payload: { email, code }
// =============================================================================
export const verifyEmail = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockVerifyEmailSuccess })
    : api.post("/api/auth/verify-email", payload)

// =============================================================================
// ENDPOINT 4 — POST /api/auth/resend-verification
// Mengirim ulang kode verifikasi email
// Payload: { email }
// =============================================================================
export const resendVerification = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockResendVerificationSuccess })
    : api.post("/api/auth/resend-verification", payload)

// =============================================================================
// ENDPOINT 5 — POST /api/auth/forgot-password
// Mengirim kode reset password
// Payload: { email }
// =============================================================================
export const forgotPassword = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockForgotPasswordSuccess })
    : api.post("/api/auth/forgot-password", payload)

// =============================================================================
// ENDPOINT 6 — POST /api/auth/verify-reset-code
// Memverifikasi kode reset password
// Payload: { email, code }
// =============================================================================
export const verifyResetCode = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockVerifyResetCodeSuccess })
    : api.post("/api/auth/verify-reset-code", payload)

// =============================================================================
// ENDPOINT 7 — POST /api/auth/reset-password
// Mengubah password setelah kode reset berhasil diverifikasi
// Payload: { resetToken, password }
// confirmPassword hanya digunakan untuk validasi form dan tidak dikirim
// =============================================================================
export const resetPassword = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockResetPasswordSuccess })
    : api.post("/api/auth/reset-password", payload)

// =============================================================================
// ENDPOINT 8 — POST /api/auth/logout
// Mengakhiri sesi pengguna
// Tidak membutuhkan payload
// =============================================================================
export const logout = () =>
  USE_MOCK
    ? Promise.resolve({ data: mockLogoutSuccess })
    : api.post("/api/auth/logout")

export default api
