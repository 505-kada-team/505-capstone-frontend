/**
 * schemas/inventorySchema.js — Modul Inventory
 *
 * ATURAN (dari CONVENTIONS.md & MODULE_SETUP_TEMPLATE.md):
 * - 1 form = 1 skema. Jangan tulis validasi manual (if/else) di dalam komponen.
 * - Untuk SETIAP payload request POST/PUT di contract, ada 1 skema di sini.
 * - Validasi kondisional yang tidak bisa dihandle Zod langsung (field A wajib
 *   kalau field B = X) → dicatat sebagai komentar, divalidasi manual saat submit.
 *
 * Referensi: 505_Database Schema_inventory.md — section Flow tiap endpoint
 */

import { z } from 'zod';

// =============================================================================
// ENDPOINT 1 — POST /api/inventory
// Buat inventory baru
// =============================================================================

/**
 * createInventorySchema
 * Dipakai di: form tambah inventory baru (halaman admin)
 *
 * Aturan dari contract:
 * - nameInventory: wajib, case-insensitive duplicate check ada di backend
 * - category: wajib, hanya boleh 'ingredients' atau 'packaging'
 * - unit: wajib, hanya boleh 'gr', 'ml', atau 'pcs'
 * - description: opsional
 */
export const createInventorySchema = z.object({
  nameInventory: z.string().min(1, 'Nama inventory wajib diisi'),
  category: z.enum(['ingredients', 'packaging'], {
    error: 'Pilih kategori yang valid: ingredients atau packaging',
  }),
  unit: z.enum(['gr', 'ml', 'pcs'], {
    error: 'Pilih satuan yang valid: gr, ml, atau pcs',
  }),
  description: z.string().optional(),
});

// =============================================================================
// ENDPOINT 5 — PUT /api/inventory/:id
// Edit nama atau deskripsi inventory
// =============================================================================

/**
 * updateInventorySchema
 * Dipakai di: form edit inventory (halaman admin)
 *
 * Aturan dari contract:
 * - nameInventory dan description keduanya opsional di level field,
 *   tapi minimal salah satu harus diisi (divalidasi lewat .refine di bawah)
 * - category dan unit TERKUNCI — JANGAN ditambahkan ke form ini,
 *   backend tolak 400 kalau field ini disertakan di payload
 */
export const updateInventorySchema = z
  .object({
    nameInventory: z.string().min(1, 'Nama inventory wajib diisi').optional(),
    description: z.string().optional(),
  })
  .refine((data) => data.nameInventory !== undefined || data.description !== undefined, {
    message: 'Minimal satu field (nama atau deskripsi) harus diisi',
    path: ['nameInventory'],
  });

// =============================================================================
// ENDPOINT 7 — POST /api/inventory/:id/subinventory
// Tambah batch baru ke inventory
// =============================================================================

/**
 * addSubInventorySchema
 * Dipakai di: form tambah batch (halaman detail inventory, admin)
 *
 * Aturan dari contract:
 * - quantity dan costPrices wajib > 0
 * - inDate wajib diisi (tanggal batch masuk)
 * - expired: KONDISIONAL — wajib diisi untuk kategori 'ingredients',
 *   paksa null untuk kategori 'packaging'.
 *   → Validasi ini TIDAK bisa dihandle Zod murni di sini karena category
 *     bukan bagian dari payload subinventory (ada di parent inventory).
 *     Lakukan validasi manual saat submit:
 *       if (inventoryCategory === 'ingredients' && !formData.expired) {
 *         setError('expired', { message: 'Expired wajib diisi untuk ingredients' });
 *       }
 * - nameResponsible: nama PIC yang bertanggung jawab atas batch ini
 *
 * Catatan z.coerce.number(): input number dari HTML form datang sebagai string.
 * z.coerce.number() otomatis konversi string → number sebelum validasi.
 */
export const addSubInventorySchema = z.object({
  quantity: z.coerce
    .number({ error: 'Quantity harus berupa angka' })
    .positive('Quantity harus lebih dari 0'),
  costPrices: z.coerce
    .number({ error: 'Harga per unit harus berupa angka' })
    .positive('Harga per unit harus lebih dari 0'),
  inDate: z.string().min(1, 'Tanggal masuk batch wajib diisi'),
  // null = packaging (tidak perlu expired), string ISO = ingredients
  // Validasi kondisional: lakukan manual saat submit (lihat komentar di atas)
  expired: z.string().nullable(),
  nameResponsible: z.string().min(1, 'Nama penanggung jawab wajib diisi'),
});

// =============================================================================
// ENDPOINT 9 — DELETE /api/subinventory/:id
// Arsipkan batch secara manual (body opsional)
// =============================================================================

/**
 * deleteSubInventorySchema
 * Dipakai di: confirm dialog hapus batch (body payload opsional, tapi baik untuk divalidasi)
 *
 * Aturan dari contract:
 * - deletedBy dan reason keduanya opsional di contract,
 *   tapi dianjurkan diisi untuk keperluan audit trail
 */
export const deleteSubInventorySchema = z.object({
  deletedBy: z.string().min(1, 'Nama penghapus wajib diisi').optional(),
  reason: z.string().min(1, 'Alasan penghapusan wajib diisi').optional(),
});

// =============================================================================
// ENDPOINT 11 — POST /api/subinventory/check-availability
// Cek ketersediaan stok (dry-run, tanpa mutasi)
// Biasanya dipanggil oleh modul Production Plan, bukan form inventory langsung
// =============================================================================

/**
 * checkAvailabilitySchema
 * Dipakai di: modul Production Plan (saat simulasi draft sebelum approve)
 *
 * Aturan dari contract:
 * - inventoryId: wajib — ID inventory yang akan dicek
 * - quantityNeeded: wajib, > 0 — kebutuhan bahan untuk plan
 * - availableUntil: wajib — tanggal akhir plan (dipakai untuk evaluasi batchSafetyStatus)
 */
export const checkAvailabilitySchema = z.object({
  inventoryId: z.string().min(1, 'inventoryId wajib diisi'),
  quantityNeeded: z.coerce
    .number({ error: 'Quantity harus berupa angka' })
    .positive('Quantity yang dibutuhkan harus lebih dari 0'),
  availableUntil: z.string().min(1, 'Tanggal akhir plan wajib diisi'),
});

// =============================================================================
// ENDPOINT 12 — POST /api/subinventory/deduct
// Potong stok FEFO (mutasi nyata)
// Biasanya dipanggil oleh modul Production Plan saat approve
// =============================================================================

/**
 * deductStockSchema
 * Dipakai di: modul Production Plan (saat approve plan)
 *
 * Aturan dari contract:
 * - inventoryId: wajib
 * - quantityNeeded: wajib, > 0
 * - planId: wajib — dipakai sebagai guard double-deduct di backend
 * - availableUntil: OPSIONAL secara teknis, tapi wajib dikirim oleh Production Plan.
 *   Jika tidak dikirim, backend tidak mengevaluasi batchSafetyStatus (nilainya null).
 *   → Beri catatan di UI Production Plan bahwa field ini wajib diisi.
 */
export const deductStockSchema = z.object({
  inventoryId: z.string().min(1, 'inventoryId wajib diisi'),
  quantityNeeded: z.coerce
    .number({ error: 'Quantity harus berupa angka' })
    .positive('Quantity yang dibutuhkan harus lebih dari 0'),
  planId: z.string().min(1, 'planId wajib diisi'),
  availableUntil: z.string().optional(), // wajib dikirim Production Plan, tapi opsional di contract
});

// =============================================================================
// ENDPOINT 13 — POST /api/subinventory/deduct/reverse
// Batalkan pemotongan stok
// Biasanya dipanggil oleh modul Production Plan saat plan dibatalkan
// =============================================================================

/**
 * reverseDeductSchema
 * Dipakai di: modul Production Plan (saat plan dibatalkan/di-reject)
 *
 * Aturan dari contract:
 * - planId: wajib — backend cari semua HistoryUsage dengan planId ini yang belum direverse
 * - reason: opsional — dianjurkan diisi untuk audit trail
 */
export const reverseDeductSchema = z.object({
  planId: z.string().min(1, 'planId wajib diisi'),
  reason: z.string().optional(),
});