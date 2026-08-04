/**
 * schemas/authSchema.js — Modul Authentication
 *
 * ATURAN (dari CONVENTIONS.md & MODULE_SETUP_TEMPLATE.md):
 * - 1 form = 1 skema. Jangan tulis validasi manual panjang menggunakan
 *   banyak if/else di dalam komponen.
 * - Login dan registrasi tetap memiliki skema masing-masing meskipun
 *   ditampilkan dalam satu halaman /login.
 * - Untuk setiap payload request POST/PUT authentication, tersedia
 *   satu skema validasi di file ini.
 * - Pengguna tidak memilih role saat registrasi atau login.
 *   Role ditentukan oleh backend dan dikembalikan setelah login.
 *
 * Referensi endpoint dan aturan payload harus disesuaikan kembali
 * dengan API contract authentication final.
 */

import { z } from "zod"

// =============================================================================
// ENDPOINT 1 — POST /api/auth/register
// Mendaftarkan pengguna baru
// =============================================================================

/**
 * registerSchema
 * Dipakai di: form registrasi pada halaman /login
 *
 * Aturan:
 * - name: wajib diisi
 * - email: wajib dan harus berformat email
 * - password: minimal 8 karakter
 * - confirmPassword: harus sama dengan password
 * - role TIDAK BOLEH dimasukkan karena ditentukan oleh backend
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi").min(3, "Nama minimal 3 karakter"),
    email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi").min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })

// =============================================================================
// ENDPOINT 2 — POST /api/auth/login
// Masuk menggunakan email dan password
// =============================================================================

/**
 * loginSchema
 * Dipakai di: form login pada halaman /login
 *
 * Aturan:
 * - email: wajib dan harus berformat email
 * - password: wajib diisi
 * - role TIDAK dipilih pengguna
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

// =============================================================================
// ENDPOINT 3 — POST /api/auth/verify-email
// Memverifikasi email menggunakan kode verifikasi
// =============================================================================

/**
 * verifyEmailSchema
 * Dipakai di: form verifikasi email
 *
 * Aturan:
 * - email: wajib dan harus berformat email
 * - code: wajib, terdiri dari tepat 6 digit angka
 */
export const verifyEmailSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  code: z
    .string()
    .trim()
    .min(1, "Kode verifikasi wajib diisi")
    .regex(/^\d{6}$/, "Kode verifikasi harus terdiri dari 6 digit angka"),
})

// =============================================================================
// ENDPOINT 4 — POST /api/auth/resend-verification
// Mengirim ulang kode verifikasi email
// =============================================================================

/**
 * resendVerificationSchema
 * Dipakai di: aksi kirim ulang kode verifikasi
 *
 * Aturan:
 * - email: wajib dan harus berformat email
 */
export const resendVerificationSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
})

// =============================================================================
// ENDPOINT 5 — POST /api/auth/forgot-password
// Meminta kode reset password
// =============================================================================

/**
 * forgotPasswordSchema
 * Dipakai di: form lupa password
 *
 * Aturan:
 * - email: wajib dan harus berformat email
 * - Backend sebaiknya memberikan pesan umum baik email terdaftar maupun tidak
 *   untuk mencegah account enumeration.
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
})

// =============================================================================
// ENDPOINT 6 — POST /api/auth/verify-reset-code
// Memverifikasi kode reset password
// =============================================================================

/**
 * verifyResetCodeSchema
 * Dipakai di: form verifikasi kode reset password
 *
 * Aturan:
 * - email: wajib dan harus berformat email
 * - code: wajib, terdiri dari tepat 6 digit angka
 */
export const verifyResetCodeSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  code: z
    .string()
    .trim()
    .min(1, "Kode reset wajib diisi")
    .regex(/^\d{6}$/, "Kode reset harus terdiri dari 6 digit angka"),
})

// =============================================================================
// ENDPOINT 7 — POST /api/auth/reset-password
// Mengubah password setelah kode reset berhasil diverifikasi
// =============================================================================

/**
 * resetPasswordSchema
 * Dipakai di: form reset password
 *
 * Aturan:
 * - resetToken: wajib, diperoleh dari response verifikasi kode reset
 * - password: minimal 8 karakter
 * - confirmPassword: harus sama dengan password
 *
 * Catatan:
 * Jika contract backend memakai email dan code sebagai pengganti resetToken,
 * sesuaikan field payload setelah contract final tersedia.
 */
export const resetPasswordSchema = z
  .object({
    resetToken: z.string().trim().min(1, "Token reset password tidak tersedia"),
    password: z.string().min(1, "Password baru wajib diisi").min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })