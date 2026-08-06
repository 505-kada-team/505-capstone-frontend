/**
 * services/api.js — Modul Inventory + Menu/Resep
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
 *   - 505_Database Schema_inventory.md (14 endpoint, section 5)
 *   - 505_Database Schema_resep.md    (6 endpoint, section 5)
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