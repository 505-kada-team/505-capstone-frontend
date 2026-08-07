/**
 * schemas/planReportSchema.js — Modul Plan Report
 *
 * ATURAN (dari CONVENTIONS.md & MODULE_SETUP_TEMPLATE.md):
 * - 1 form = 1 skema. Jangan tulis validasi manual (if/else) di dalam komponen.
 * - Untuk SETIAP payload request POST/PUT di contract, ada 1 skema di sini.
 *
 * Referensi: 505_Database Schema_planreport.md — section Flow tiap endpoint
 */

import { z } from 'zod';

// =============================================================================
// ENDPOINT C1 — POST /api/plan-reports
// Lapor kerusakan/kehilangan
// =============================================================================

/**
 * createPlanReportSchema
 * Dipakai di: form lapor insiden (halaman kasir dan admin)
 *
 * Aturan dari contract:
 * - planId, category ('ingredient'/'menu'), refId: wajib
 * - quantityLost: wajib, angka > 0
 * - incidentAt: wajib, tanggal ISO
 *   - Constraint: tidak boleh di masa depan (<= now)
 *   - Constraint: harus dalam rentang durasi plan (divalidasi di backend)
 * - reason, reportedBy, reportedByRole ('cashier'/'admin'): wajib
 */
export const createPlanReportSchema = z
  .object({
    planId: z.string().min(1, 'Plan ID wajib diisi'),
    category: z.enum(['ingredient', 'menu'], {
      errorMap: () => ({ message: 'Kategori harus ingredient atau menu' }),
    }),
    refId: z.string().min(1, 'Item yang dilaporkan wajib dipilih'),
    quantityLost: z.coerce
      .number({ error: 'Kuantitas harus berupa angka' })
      .positive('Kuantitas harus lebih dari 0'),
    incidentAt: z.string().min(1, 'Waktu kejadian wajib diisi'),
    reason: z.string().min(1, 'Alasan / kronologi kejadian wajib diisi'),
    reportedBy: z.string().min(1, 'Nama pelapor wajib diisi'),
    reportedByRole: z.enum(['cashier', 'admin'], {
      errorMap: () => ({ message: 'Role pelapor tidak valid' }),
    }),
  })
  .refine(
    (data) => {
      const incidentDate = new Date(data.incidentAt);
      const now = new Date();
      return incidentDate <= now;
    },
    {
      message: 'Waktu kejadian tidak boleh di masa depan',
      path: ['incidentAt'],
    }
  );

// =============================================================================
// ENDPOINT C3 — PUT /api/plan-reports/:id/review
// ACC/tolak laporan
// =============================================================================

/**
 * reviewPlanReportSchema
 * Dipakai di: dialog konfirmasi review laporan (halaman admin)
 *
 * Aturan dari contract:
 * - decision: wajib ('approved' atau 'rejected')
 * - adminNote: opsional, namun disarankan diisi jika ditolak.
 *   Kita buat logika: jika ditolak, note wajib diisi.
 */
export const reviewPlanReportSchema = z
  .object({
    decision: z.enum(['approved', 'rejected'], {
      errorMap: () => ({ message: 'Keputusan harus disetujui atau ditolak' }),
    }),
    adminNote: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.decision === 'rejected') {
        return data.adminNote && data.adminNote.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Catatan admin wajib diisi jika laporan ditolak',
      path: ['adminNote'],
    }
  );

// =============================================================================
// ENDPOINT C4 — POST /api/plan-reports/:id/add-inventory
// Tarik stok pengganti
// =============================================================================

/**
 * addInventoryReplacementSchema
 * Dipakai di: form tarik stok pengganti untuk laporan ingredient (halaman admin)
 *
 * Aturan dari contract:
 * - replacementQuantity: wajib, angka > 0
 *   (defaultnya sama dengan quantityLost, tapi admin bebas ubah)
 * - availableUntil: wajib, tanggal plan berakhir (dikirim ke Inventory deduct)
 * - varianceNote: opsional
 */
export const addInventoryReplacementSchema = z.object({
  replacementQuantity: z.coerce
    .number({ error: 'Kuantitas harus berupa angka' })
    .positive('Kuantitas harus lebih dari 0'),
  availableUntil: z.string().min(1, 'Batas ketersediaan stok wajib diisi'),
  varianceNote: z.string().optional(),
});
