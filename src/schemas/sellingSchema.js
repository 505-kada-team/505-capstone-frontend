/**
 * schemas/sellingSchema.js — Modul Selling (Kasir)
 *
 * ATURAN (dari CONVENTIONS.md & MODULE_SETUP_TEMPLATE.md):
 * - 1 form = 1 skema. Jangan tulis validasi manual (if/else) di dalam komponen.
 * - Untuk SETIAP payload request POST/PUT di contract, ada 1 skema di sini.
 *
 * Referensi: 505_Database Schema_selling.md — section Flow tiap endpoint
 */

import { z } from 'zod';

// =============================================================================
// ENDPOINT B2 — POST /api/selling
// Catat penjualan
// =============================================================================

/**
 * createSaleSchema
 * Dipakai di: form / aksi catat penjualan (halaman kasir)
 *
 * Aturan dari contract:
 * - planId: wajib (id dari plan aktif)
 * - menuId: wajib (id menu yang dijual)
 * - quantitySold: wajib, angka > 0
 * - cashierName: wajib
 *
 * Catatan:
 * - Kasir TIDAK mengirimkan harga (priceUsed). Harga dihitung murni di sisi
 *   server berdasarkan waktu transaksi (now) dan rentang diskon.
 * - Validasi sisa porsi (quantitySold <= remainingQuantity) secara ideal
 *   dilakukan di backend (menghasilkan 409 kalau tidak cukup), namun di frontend
 *   juga bisa divalidasi manual di komponen sebelum submit dengan membandingkan
 *   terhadap state remainingQuantity yang sedang dirender.
 */
export const createSaleSchema = z.object({
  planId: z.string().min(1, 'Plan ID wajib diisi'),
  menuId: z.string().min(1, 'Menu wajib dipilih'),
  quantitySold: z.coerce
    .number({ error: 'Kuantitas harus berupa angka' })
    .positive('Kuantitas harus lebih dari 0'),
  cashierName: z.string().min(1, 'Nama kasir wajib diisi'),
});
