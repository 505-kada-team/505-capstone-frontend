/**
 * schemas/planSchema.js — Modul Production Plan
 *
 * ATURAN (dari CONVENTIONS.md & MODULE_SETUP_TEMPLATE.md):
 * - 1 form = 1 skema. Jangan tulis validasi manual (if/else) di dalam komponen.
 * - Untuk SETIAP payload request POST/PUT di contract, ada 1 skema di sini.
 * - Validasi kondisional yang tidak bisa dihandle Zod langsung dicatat sebagai
 *   komentar — validasi manual dilakukan saat submit di komponen.
 *
 * Referensi: 505_Database Schema_producitonplan.md — section Flow tiap endpoint
 */

import { z } from 'zod';

// =============================================================================
// Sub-skema: menu item dalam plan
// Dipakai bersama oleh createPlanSchema dan updatePlanSchema
// =============================================================================

const planMenuItemSchema = z.object({
  menuId: z.string().min(1, 'Menu wajib dipilih'),
  quantityPlanned: z.coerce
    .number({ error: 'Kuantitas harus berupa angka' })
    .positive('Kuantitas harus lebih dari 0'),
});

// =============================================================================
// ENDPOINT A1 — POST /api/plan
// Buat plan baru (draft)
// =============================================================================

/**
 * createPlanSchema
 * Dipakai di: form tambah plan baru (halaman admin)
 *
 * Aturan dari contract:
 * - name: wajib
 * - tags: opsional, array of string
 * - startDate: wajib, string tanggal ISO
 * - duration: wajib, angka antara 7 sampai 30
 * - menus: wajib, minimal 1 item, quantityPlanned > 0
 *   (validasi duplikat menuId sama seperti ingredients di menuSchema)
 */
export const createPlanSchema = z
  .object({
    name: z.string().min(1, 'Nama plan wajib diisi'),
    tags: z.array(z.string()).optional(),
    startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
    duration: z.coerce
      .number({ error: 'Durasi harus berupa angka' })
      .min(7, 'Durasi minimal 7 hari')
      .max(30, 'Durasi maksimal 30 hari'),
    menus: z
      .array(planMenuItemSchema)
      .min(1, 'Plan harus memiliki minimal 1 menu'),
  })
  .refine(
    (data) => {
      const ids = data.menus.map((item) => item.menuId);
      return ids.length === new Set(ids).size;
    },
    {
      message: 'Setiap menu hanya boleh ditambahkan satu kali ke dalam plan',
      path: ['menus'],
    }
  );

// =============================================================================
// ENDPOINT A4 — PUT /api/plan/:id
// Edit plan (hanya saat draft)
// =============================================================================

/**
 * updatePlanSchema
 * Dipakai di: form edit plan (halaman admin)
 *
 * Aturan dari contract:
 * - startDate, duration, menus semuanya opsional
 * - Jika dikirim, aturan validasinya sama persis dengan createPlanSchema
 */
export const updatePlanSchema = z
  .object({
    name: z.string().min(1, 'Nama plan tidak boleh kosong').optional(),
    tags: z.array(z.string()).optional(),
    startDate: z.string().min(1, 'Tanggal mulai tidak boleh kosong').optional(),
    duration: z.coerce
      .number({ error: 'Durasi harus berupa angka' })
      .min(7, 'Durasi minimal 7 hari')
      .max(30, 'Durasi maksimal 30 hari')
      .optional(),
    menus: z
      .array(planMenuItemSchema)
      .min(1, 'Jika menu dikirim, minimal harus ada 1 item')
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.menus) return true;
      const ids = data.menus.map((item) => item.menuId);
      return ids.length === new Set(ids).size;
    },
    {
      message: 'Setiap menu hanya boleh ditambahkan satu kali ke dalam plan',
      path: ['menus'],
    }
  );

// =============================================================================
// ENDPOINT A7 — POST /api/plan/:id/stop
// Hentikan paksa, active → stopped
// =============================================================================

/**
 * stopPlanSchema
 * Dipakai di: dialog konfirmasi hentikan plan
 *
 * Aturan dari contract:
 * - reason dan stoppedBy opsional secara teknis di payload, tapi disarankan
 *   untuk pencatatan audit. Kita buat opsional di Zod.
 */
export const stopPlanSchema = z.object({
  reason: z.string().min(1, 'Alasan penghentian wajib diisi').optional(),
  stoppedBy: z.string().min(1, 'Nama wajib diisi').optional(),
});

// =============================================================================
// ENDPOINT A9 — PUT /api/plan/:id/menus/:menuId/discount
// Set/ganti slot diskon untuk satu menu
// =============================================================================

/**
 * setMenuDiscountSchema
 * Dipakai di: form set diskon pada menu (halaman detail plan)
 *
 * Aturan dari contract:
 * - discountPercentage: wajib, angka 1–100
 * - startDate: wajib
 *   - Constraint: >= hari ini
 *   - Constraint: >= plan.startDate
 * - endDate: wajib
 *   - Constraint: > startDate
 *   - Constraint: <= plan.endDate
 * - reason: string, wajib
 *
 * Catatan:
 * Validasi terhadap plan.startDate dan plan.endDate TIDAK BISA dilakukan
 * murni di Zod karena Zod schema tidak memiliki akses ke state 'plan' saat itu.
 * Validasi silang dengan tanggal plan harus dilakukan secara manual saat submit form
 * atau via .superRefine() dengan me-pass state plan sebagai argumen tambahan.
 */
export const setMenuDiscountSchema = z
  .object({
    discountPercentage: z.coerce
      .number({ error: 'Persentase harus berupa angka' })
      .min(1, 'Persentase diskon minimal 1%')
      .max(100, 'Persentase diskon maksimal 100%'),
    startDate: z.string().min(1, 'Tanggal mulai diskon wajib diisi'),
    endDate: z.string().min(1, 'Tanggal berakhir diskon wajib diisi'),
    reason: z.string().min(1, 'Alasan pemberian diskon wajib diisi'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'Tanggal berakhir harus lebih dari tanggal mulai diskon',
      path: ['endDate'],
    }
  );
