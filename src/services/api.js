/**
 * services/api.js — Modul Inventory + Menu/Resep + Production Plan
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
 * Referensi endpoint:
 *   - 505_Database Schema_inventory.md      (14 endpoint)
 *   - 505_Database Schema_resep.md          (6 endpoint)
 *   - 505_Database Schema_producitonplan.md (10 endpoint)
 */

import axios from 'axios';
import {
  // ── Inventory (Endpoint 1–14) ───────────────────────────────────────────────
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
  // ── Menu/Resep (Endpoint 1–6) ───────────────────────────────────────────────
  // Endpoint 1 — POST /api/menu
  mockMenuCreated,
  // Endpoint 2 — GET /api/menu
  mockMenuList,
  // Endpoint 3 — GET /api/menu/:id
  mockMenuDetail,
  // Endpoint 4 — PUT /api/menu/:id
  mockEditMenu,
  // Endpoint 5 — DELETE /api/menu/:id
  mockDeleteMenu,
  // Endpoint 6 — GET /api/menu/dropdown
  mockMenuDropdown,
  // ── Production Plan (Endpoint A1–A10) ───────────────────────────────────
  // Endpoint A1 — POST /api/plan
  mockCreatePlan,
  // Endpoint A2 — GET /api/plan
  mockPlanList,
  // Endpoint A3 — GET /api/plan/:id
  mockPlanDetailDraft, // bisa diganti ke mockPlanDetailActive/Stale untuk testing UI
  // Endpoint A4 — PUT /api/plan/:id
  mockUpdatePlan,
  // Endpoint A5 — POST /api/plan/:id/check-availability
  mockCheckAvailabilityPlan,
  // Endpoint A6 — POST /api/plan/:id/approve
  mockApprovePlan,
  // Endpoint A7 — POST /api/plan/:id/stop
  mockStopPlan,
  // Endpoint A8 — DELETE /api/plan/:id
  mockCancelPlan,
  // Endpoint A9 — PUT /api/plan/:id/menus/:menuId/discount
  mockSetDiscount,
  // Endpoint A10 — DELETE /api/plan/:id/menus/:menuId/discount
  mockDeleteDiscount,
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

// =============================================================================
// MODUL MENU / RESEP — 505_Database Schema_resep.md
// =============================================================================

// =============================================================================
// ENDPOINT 1 — POST /api/menu
// Buat menu baru
// Payload: { name, description?, image?, sellingPrice, ingredients[] }
//   ingredients[]: [{ inventoryId, quantityNeeded }]
// Response 201: data menu lengkap + live-populated ingredients + cost fields
// Response 400: ingredient tidak valid / duplikat inventoryId dalam payload
// =============================================================================
export const createMenu = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockMenuCreated })
    : api.post('/api/menu', payload);

// =============================================================================
// ENDPOINT 2 — GET /api/menu
// List semua menu (paginated, untuk halaman manajemen)
// Params opsional: { search, page, limit, includeDeleted }
//   includeDeleted default false — hanya menu active yang muncul
// Response: data ringkas per item (tanpa ingredients[], dengan totalIngredients)
// =============================================================================
export const getMenuList = (params) =>
  USE_MOCK
    ? Promise.resolve({ data: mockMenuList })
    : api.get('/api/menu', { params });

// =============================================================================
// ENDPOINT 3 — GET /api/menu/:id
// Detail menu + breakdown cost & margin per ingredient (diambil live dari Inventory)
// Tidak ada params tambahan — id saja
// Response 200 normal   : costComplete: true,  semua cost terisi
// Response 200 tidak lengkap: costComplete: false, cost null, ada field 'warning'
// Response 404: menu tidak ditemukan atau status deleted
// CATATAN: response ini berbeda dari GET list — mengandung ingredients[] penuh
//          termasuk field inventoryStatus per ingredient
// =============================================================================
export const getMenuDetail = (id) =>
  USE_MOCK
    ? Promise.resolve({ data: mockMenuDetail })
    : api.get(`/api/menu/${id}`);

// =============================================================================
// ENDPOINT 4 — PUT /api/menu/:id
// Edit menu — semua field opsional, kirim hanya yang berubah
// Payload: { name?, description?, image?, sellingPrice?, ingredients[]? }
//   ingredients: kalau dikirim, bersifat REPLACE (array pengganti penuh, bukan patch)
// Response 200: data field yang diubah + affectedDraftPlans[]
//   affectedDraftPlans terisi kalau ingredients atau sellingPrice berubah
//   (draft Plan yang mereferensikan menu ini ditandai checkResultStale: true)
// Response 400: ingredient tidak valid (sama seperti endpoint 1)
// =============================================================================
export const updateMenu = (id, payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockEditMenu })
    : api.put(`/api/menu/${id}`, payload);

// =============================================================================
// ENDPOINT 5 — DELETE /api/menu/:id
// Arsipkan menu (soft-delete) — tidak diblokir kondisi apapun
// Tidak ada payload
// Response 200: { data: { _id, status: 'deleted', deletedAt }, affectedDraftPlans[] }
//   affectedDraftPlans: draft Plan yang ditandai staleReason: 'menu_archived'
// Response 404: menu tidak ditemukan atau sudah berstatus deleted
// =============================================================================
export const archiveMenu = (id) =>
  USE_MOCK
    ? Promise.resolve({ data: mockDeleteMenu })
    : api.delete(`/api/menu/${id}`);

// =============================================================================
// ENDPOINT 6 — GET /api/menu/dropdown
// List ringkas menu aktif untuk dropdown di modul Production Plan
// Params opsional: { search } — search-as-you-type terhadap name
// Tanpa pagination — kembalikan seluruh data aktif yang match filter
// Field minimal: _id, name, sellingPrice, image
// CATATAN: path /dropdown harus didaftarkan SEBELUM /:id di router backend
//          supaya tidak terbaca sebagai id (sudah dihandle di sisi backend)
// =============================================================================
export const getMenuDropdown = (params) =>
  USE_MOCK
    ? Promise.resolve({ data: mockMenuDropdown })
    : api.get('/api/menu/dropdown', { params });

// =============================================================================
// MODUL PRODUCTION PLAN — 505_Database Schema_producitonplan.md
// =============================================================================

// =============================================================================
// ENDPOINT A1 — POST /api/plan
// Buat plan baru (draft)
// Payload: { name, tags?, startDate, duration, menus: [{ menuId, quantityPlanned }] }
// =============================================================================
export const createPlan = (payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockCreatePlan })
    : api.post('/api/plan', payload);

// =============================================================================
// ENDPOINT A2 — GET /api/plan
// List semua plan (filter status)
// Params opsional: { status, search, tags, page, limit }
// =============================================================================
export const getPlanList = (params) =>
  USE_MOCK
    ? Promise.resolve({ data: mockPlanList })
    : api.get('/api/plan', { params });

// =============================================================================
// ENDPOINT A3 — GET /api/plan/:id
// Detail plan + checkResult/committed + diskon
// =============================================================================
export const getPlanDetail = (id) =>
  USE_MOCK
    // TODO: Ganti ke mockPlanDetailActive kalau ingin test UI state active
    ? Promise.resolve({ data: mockPlanDetailDraft })
    : api.get(`/api/plan/${id}`);

// =============================================================================
// ENDPOINT A4 — PUT /api/plan/:id
// Edit plan (hanya saat draft)
// Payload: { startDate?, duration?, menus? }
// =============================================================================
export const updatePlan = (id, payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockUpdatePlan })
    : api.put(`/api/plan/${id}`, payload);

// =============================================================================
// ENDPOINT A5 — POST /api/plan/:id/check-availability
// Refresh simulasi ketersediaan bahan (hanya saat draft)
// Tidak ada payload
// =============================================================================
export const checkAvailabilityPlan = (id) =>
  USE_MOCK
    ? Promise.resolve({ data: mockCheckAvailabilityPlan })
    : api.post(`/api/plan/${id}/check-availability`);

// =============================================================================
// ENDPOINT A6 — POST /api/plan/:id/approve
// Setujui plan → deduct Inventory, bekukan frozenSellingPrice, draft → active
// Tidak ada payload
// =============================================================================
export const approvePlan = (id) =>
  USE_MOCK
    ? Promise.resolve({ data: mockApprovePlan })
    : api.post(`/api/plan/${id}/approve`);

// =============================================================================
// ENDPOINT A7 — POST /api/plan/:id/stop
// Hentikan paksa, active → stopped
// Payload opsional: { reason, stoppedBy }
// =============================================================================
export const stopPlan = (id, payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockStopPlan })
    : api.post(`/api/plan/${id}/stop`, payload);

// =============================================================================
// ENDPOINT A8 — DELETE /api/plan/:id
// Batalkan draft (hanya saat draft)
// =============================================================================
export const cancelPlan = (id) =>
  USE_MOCK
    ? Promise.resolve({ data: mockCancelPlan })
    : api.delete(`/api/plan/${id}`);

// =============================================================================
// ENDPOINT A9 — PUT /api/plan/:id/menus/:menuId/discount
// Set/ganti slot diskon untuk satu menu
// Payload: { discountPercentage, startDate, endDate, reason }
// =============================================================================
export const setMenuDiscount = (id, menuId, payload) =>
  USE_MOCK
    ? Promise.resolve({ data: mockSetDiscount })
    : api.put(`/api/plan/${id}/menus/${menuId}/discount`, payload);

// =============================================================================
// ENDPOINT A10 — DELETE /api/plan/:id/menus/:menuId/discount
// Hapus slot diskon untuk satu menu
// =============================================================================
export const deleteMenuDiscount = (id, menuId) =>
  USE_MOCK
    ? Promise.resolve({ data: mockDeleteDiscount })
    : api.delete(`/api/plan/${id}/menus/${menuId}/discount`);