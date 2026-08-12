/**
 * schemas/inventorySchema.js — Modul Inventory
 *
 * ATURAN (dari CONVENTIONS.md & MODULE_SETUP_TEMPLATE.md):
 * - 1 form = 1 skema. Jangan tulis validasi manual (if/else) di dalam komponen.
 * - Untuk SETIAP payload request POST/PUT di contract, ada 1 skema di sini.
 * - Validasi kondisional yang tidak bisa dihandle Zod langsung
 *   (field A wajib kalau field B = X) dicatat sebagai komentar dan
 *   ditangani saat submit bila membutuhkan data dari luar payload.
 *
 * Referensi:
 * - Inventory backend contract
 * - Inventory Management Flow Documentation v4
 */

import { z } from "zod";

// =============================================================================
// ENDPOINT 1 — POST /api/inventory
// Buat inventory baru
// =============================================================================

/**
 * createInventorySchema
 * Dipakai di: form tambah inventory baru (halaman admin)
 *
 * Aturan dari contract backend aktual:
 * - name: wajib, duplicate check case-insensitive dilakukan backend
 * - itemCode: wajib
 * - category: wajib, hanya 'ingredients' atau 'packaging'
 * - unit: wajib, hanya 'gr', 'ml', atau 'pcs'
 * - description: opsional
 */
export const createInventorySchema = z.object({
  name: z.string().trim().min(1, "Nama inventory wajib diisi"),

  itemCode: z.string().trim().min(1, "Kode inventory wajib diisi"),

  category: z.enum(["ingredients", "packaging"], {
    error: "Pilih kategori yang valid: ingredients atau packaging",
  }),

  unit: z.enum(["gr", "ml", "pcs"], {
    error: "Pilih satuan yang valid: gr, ml, atau pcs",
  }),

  description: z.string().trim().optional(),
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
 * - name dan description opsional di level field
 * - minimal salah satu harus dikirim
 * - category dan unit TERKUNCI
 * - itemCode belum dimasukkan karena contract update yang tersedia
 *   belum menyatakan itemCode dapat diedit
 */
export const updateInventorySchema = z
  .object({
    name: z.string().trim().min(1, "Nama inventory wajib diisi").optional(),
    description: z.string().trim().optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "Minimal satu field (nama atau deskripsi) harus diisi",
    path: ["name"],
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
 * - inDate wajib diisi
 *
 * - expired KONDISIONAL:
 *   wajib untuk category = ingredients
 *   null untuk category = packaging
 *
 * category berasal dari parent Inventory, bukan payload SubInventory.
 * Karena itu pemeriksaan category dilakukan saat submit berdasarkan
 * inventoryCategory yang sudah dimiliki halaman detail.
 *
 * - nameResponsible: PIC batch
 *
 * z.coerce.number():
 * input dari form dapat masuk sebagai string, kemudian dikonversi
 * menjadi number sebelum divalidasi.
 */
export const addSubInventorySchema = z.object({
  quantity: z.coerce
    .number({ error: "Quantity harus berupa angka" })
    .positive("Quantity harus lebih dari 0"),

  costPrices: z.coerce
    .number({ error: "Harga per unit harus berupa angka" })
    .positive("Harga per unit harus lebih dari 0"),

  inDate: z.string().min(1, "Tanggal masuk batch wajib diisi"),

  // null = packaging
  // string ISO/date = ingredients
  expired: z.string().nullable(),
});

// =============================================================================
// ENDPOINT 9 — DELETE /api/subinventory/:id
// Arsipkan batch secara manual
// =============================================================================

/**
 * deleteSubInventorySchema
 * Dipakai di: confirm dialog hapus/archive batch
 *
 * Aturan dari contract:
 * - deletedBy opsional
 * - reason opsional
 * - keduanya tetap berguna untuk audit trail
 */
export const deleteSubInventorySchema = z.object({
  deletedBy: z.string().trim().min(1, "Nama penghapus wajib diisi").optional(),
  reason: z.string().trim().min(1, "Alasan penghapusan wajib diisi").optional(),
});

// =============================================================================
// ENDPOINT 11 — POST /api/subinventory/check-availability
// Cek ketersediaan stok (dry-run)
// =============================================================================

/**
 * checkAvailabilitySchema
 * Biasanya digunakan Production Plan.
 *
 * Aturan dari contract:
 * - inventoryId wajib
 * - quantityNeeded wajib > 0
 * - availableUntil wajib
 *
 * availableUntil digunakan backend untuk menentukan
 * batchSafetyStatus: safe / unsafe.
 */
export const checkAvailabilitySchema = z.object({
  inventoryId: z.string().min(1, "inventoryId wajib diisi"),

  quantityNeeded: z.coerce
    .number({ error: "Quantity harus berupa angka" })
    .positive("Quantity yang dibutuhkan harus lebih dari 0"),

  availableUntil: z.string().min(1, "Tanggal akhir plan wajib diisi"),
});

// =============================================================================
// ENDPOINT 12 — POST /api/subinventory/deduct
// Potong stok menggunakan FEFO
// =============================================================================

/**
 * deductStockSchema
 * Biasanya digunakan Production Plan ketika approve plan.
 *
 * Aturan:
 * - inventoryId wajib
 * - quantityNeeded wajib > 0
 * - planId wajib
 * - availableUntil opsional pada contract Inventory
 *
 * Jika Production Plan ingin memperoleh batchSafetyStatus,
 * availableUntil perlu dikirim.
 */
export const deductStockSchema = z.object({
  inventoryId: z.string().min(1, "inventoryId wajib diisi"),

  quantityNeeded: z.coerce
    .number({ error: "Quantity harus berupa angka" })
    .positive("Quantity yang dibutuhkan harus lebih dari 0"),

  planId: z.string().min(1, "planId wajib diisi"),

  availableUntil: z.string().optional(),
});

// =============================================================================
// ENDPOINT 13 — POST /api/subinventory/deduct/reverse
// Batalkan pemotongan stok
// =============================================================================

/**
 * reverseDeductSchema
 * Biasanya digunakan Production Plan ketika plan dibatalkan.
 *
 * Aturan:
 * - planId wajib
 * - reason opsional
 */
export const reverseDeductSchema = z.object({
  planId: z.string().min(1, "planId wajib diisi"),
  reason: z.string().optional(),
});
