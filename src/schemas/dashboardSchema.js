/**
 * schemas/dashboardSchema.js
 *
 * Validasi query parameters untuk endpoint GET /api/dashboard/summary.
 * Karena ini query params, semuanya opsional secara default.
 * Mode akses mutually exclusive:
 * - Single-Day (Hourly): menggunakan `date`
 * - Multi-Day (Daily): menggunakan `startDate` dan `endDate`
 */

import { z } from 'zod';

// Regex untuk memvalidasi format YYYY-MM-DD secara presisi.
// Memastikan tahun 4 digit, bulan 01-12, dan hari 01-31.
const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

export const dashboardQuerySchema = z
  .object({
    date: z.string().regex(dateRegex, 'Format tanggal harus YYYY-MM-DD').optional(),
    startDate: z.string().regex(dateRegex, 'Format tanggal awal harus YYYY-MM-DD').optional(),
    endDate: z.string().regex(dateRegex, 'Format tanggal akhir harus YYYY-MM-DD').optional(),
  })
  // 1. Validasi mutually exclusive antara mode Single-Day dan Multi-Day
  .refine(
    (data) => {
      const hasDate = data.date !== undefined && data.date !== '';
      const hasRange = (data.startDate !== undefined && data.startDate !== '') || (data.endDate !== undefined && data.endDate !== '');

      // Jika mengirim date, TIDAK BOLEH mengirim startDate atau endDate
      if (hasDate && hasRange) {
        return false;
      }
      return true;
    },
    {
      message: "Parameter 'date' tidak boleh digunakan bersamaan dengan 'startDate' atau 'endDate'",
      path: ['date'], // Memasang error path di 'date'
    },
  )
  // 2. Validasi kelengkapan range (Jika kirim startDate, sebaiknya kirim endDate juga)
  .refine(
    (data) => {
      const hasStart = data.startDate !== undefined && data.startDate !== '';
      const hasEnd = data.endDate !== undefined && data.endDate !== '';

      // Jika salah satu dikirim, harus kirim dua-duanya
      if (hasStart && !hasEnd) return false;
      return true;
    },
    {
      message: 'endDate harus diisi jika startDate diisi',
      path: ['endDate'],
    },
  )
  .refine(
    (data) => {
      const hasStart = data.startDate !== undefined && data.startDate !== '';
      const hasEnd = data.endDate !== undefined && data.endDate !== '';

      if (!hasStart && hasEnd) return false;
      return true;
    },
    {
      message: 'startDate harus diisi jika endDate diisi',
      path: ['startDate'],
    },
  )
  // 3. Validasi urutan tanggal (endDate >= startDate)
  .refine(
    (data) => {
      const hasStart = data.startDate !== undefined && data.startDate !== '';
      const hasEnd = data.endDate !== undefined && data.endDate !== '';

      if (hasStart && hasEnd) {
        // Bandingkan string secara leksikografikal (karena format YYYY-MM-DD valid untuk string comparison)
        if (data.endDate < data.startDate) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Tanggal akhir (endDate) tidak boleh lebih awal dari tanggal mulai (startDate)',
      path: ['endDate'],
    },
  );
