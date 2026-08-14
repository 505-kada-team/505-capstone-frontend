/**
 * schemas/menuSchema.js — Modul Menu/Resep
 *
 * ATURAN (dari CONVENTIONS.md & MODULE_SETUP_TEMPLATE.md):
 * - 1 form = 1 skema. Jangan tulis validasi manual (if/else) di dalam komponen.
 * - Untuk SETIAP payload request POST/PUT di contract, ada 1 skema di sini.
 * - Validasi kondisional yang tidak bisa dihandle Zod langsung dicatat sebagai
 *   komentar — validasi manual dilakukan saat submit di komponen.
 *
 * Referensi: 505_Database Schema_resep.md — section Flow tiap endpoint
 */

import { z } from "zod";

// =============================================================================
// Sub-skema: ingredient item
// Dipakai bersama oleh createMenuSchema dan updateMenuSchema.
// Diextract supaya tidak duplikat — kalau aturan ingredient berubah,
// cukup update satu tempat di sini.
// =============================================================================

/**
 * ingredientItemSchema
 * Representasi 1 baris ingredient dalam payload.
 *
 * Aturan dari contract (section Flow endpoint 1 & 4):
 * - inventoryId: wajib, harus merujuk Inventory status active
 *   → Validasi eksistensi & status dilakukan di backend (tidak bisa di frontend)
 * - quantityNeeded: wajib, harus > 0
 *
 * Catatan z.coerce.number():
 *   Input number dari komponen React biasanya sudah number, tapi kalau datang
 *   dari input HTML (type="number") bisa berupa string — coerce handles both.
 */
const ingredientItemSchema = z.object({
  inventoryId: z.string().min(1, "Inventory wajib dipilih"),
  quantityNeeded: z.coerce
    .number({ error: "Kuantitas harus berupa angka" })
    .positive("Kuantitas harus lebih dari 0"),
});

// =============================================================================
// ENDPOINT 1 — POST /api/menu
// Buat menu baru
// =============================================================================

/**
 * createMenuSchema
 * Dipakai di: form tambah menu baru (halaman admin)
 *
 * Aturan dari contract (section Flow endpoint 1):
 * - name: wajib, tidak boleh kosong
 * - description: opsional
 * - image: opsional (URL string atau upload path — validasi format URL ada di backend)
 * - sellingPrice: wajib, harus > 0
 * - ingredients: wajib, minimal 1 item
 *   - setiap item: inventoryId wajib + quantityNeeded > 0
 *   - TIDAK boleh ada inventoryId yang sama lebih dari satu kali dalam satu payload
 *     → Constraint ini divalidasi via .refine() di bawah karena Zod tidak punya
 *       operator "unique across array" secara native.
 *
 * Catatan duplikat inventoryId:
 *   Contract: "Cek tidak ada inventoryId duplikat dalam satu payload. Duplikat → 400."
 *   Implementasi: .refine() membandingkan panjang array asli vs Set (deduplicated).
 *   Error diarahkan ke path 'ingredients' supaya muncul di bawah field daftar ingredient.
 */
export const createMenuSchema = z
  .object({
    name: z.string().min(1, "Nama menu wajib diisi"),
    description: z
      .string()
      .max(200, "Description must not exceed 200 characters")
      .optional(),
    image: z.string().optional(),
    sellingPrice: z.coerce
      .number({ error: "Harga jual harus berupa angka" })
      .positive("Harga jual harus lebih dari 0"),
    ingredients: z
      .array(ingredientItemSchema)
      .min(1, "Menu harus memiliki minimal 1 ingredient"),
  })
  .refine(
    (data) => {
      const ids = data.ingredients.map((item) => item.inventoryId);
      return ids.length === new Set(ids).size;
    },
    {
      message:
        "Setiap inventory hanya boleh muncul satu kali dalam daftar ingredient",
      path: ["ingredients"],
    },
  );

// =============================================================================
// ENDPOINT 4 — PUT /api/menu/:id
// Edit menu (name, description, image, sellingPrice, ingredients)
// =============================================================================

/**
 * updateMenuSchema
 * Dipakai di: form edit menu (halaman admin)
 *
 * Aturan dari contract (section Flow endpoint 4):
 * - Semua field OPSIONAL di level payload — kirim hanya field yang berubah.
 * - Kalau ingredients dikirim:
 *   (a) Bersifat REPLACE (replace semantics) — array pengganti penuh, bukan patch.
 *       Artinya ingredient yang tidak disertakan akan DIHAPUS dari resep.
 *   (b) Aturan validasi SAMA dengan create: minimal 1 item, tidak duplikat inventoryId.
 * - Mengubah ingredients atau sellingPrice → backend memicu efek samping ke draft Plan
 *   (affectedDraftPlans di response) — ini business rule, tidak perlu validasi di Zod.
 * - Mengubah name/description/image → tidak ada efek samping.
 *
 * Implementasi .optional() vs .optional().or(z.undefined()):
 *   Karena PUT mengirim hanya field yang berubah, field yang tidak ada sama sekali
 *   harus lolos validasi. z.optional() sudah cukup — undefined diterima.
 *
 * Catatan validasi minimal 1 item + no-duplicate untuk ingredients:
 *   Ditangani oleh .refine() yang hanya berjalan KALAU ingredients dikirim.
 *   Kalau ingredients tidak ada (undefined), refine tidak dijalankan.
 */
export const updateMenuSchema = z
  .object({
    name: z.string().min(1, "Nama menu tidak boleh kosong").optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    sellingPrice: z.coerce
      .number({ error: "Harga jual harus berupa angka" })
      .positive("Harga jual harus lebih dari 0")
      .optional(),
    ingredients: z
      .array(ingredientItemSchema)
      .min(1, "Jika ingredients dikirim, minimal harus ada 1 item")
      .optional(),
  })
  .refine(
    (data) => {
      // Hanya jalankan duplicate-check kalau ingredients memang dikirim
      if (!data.ingredients) return true;
      const ids = data.ingredients.map((item) => item.inventoryId);
      return ids.length === new Set(ids).size;
    },
    {
      message:
        "Setiap inventory hanya boleh muncul satu kali dalam daftar ingredient",
      path: ["ingredients"],
    },
  );
