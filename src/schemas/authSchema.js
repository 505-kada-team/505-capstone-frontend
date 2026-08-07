/**
 * schemas/authSchema.js — Modul Authentication
 *
 * ATURAN (dari CONVENTIONS.md & MODULE_SETUP_TEMPLATE.md):
 * - 1 form = 1 skema. Jangan tulis validasi manual panjang menggunakan
 *   banyak if/else di dalam komponen.
 * - Login dan registrasi tetap memiliki skema masing-masing meskipun
 *   ditampilkan dalam satu halaman /login.
 * - Untuk setiap payload request POST/PUT/PATCH authentication, tersedia
 *   satu skema validasi di file ini.
 * - Pengguna tidak memilih role saat registrasi atau login.
 *   Role ditentukan oleh backend dan dikembalikan setelah login.
 *
 * ⚠️ Path endpoint di komentar mengikuti services/authApi.js (sumber
 * kebenaran final, tanpa prefix /api). Kode verifikasi email/reset
 * diasumsikan 6 digit — belum terkonfirmasi ke backend, rfc.auth.md
 * menyebut "4–8 digit numeric". Sesuaikan regex code di bawah kalau
 * ternyata berbeda.
 */

import { z } from "zod"


// =============================================================================
// ENDPOINT 1 — POST /auth/register
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
// ENDPOINT 2 — POST /auth/login
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
// ENDPOINT 3 — POST /auth/verify-email/confirm
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
// ENDPOINT 4 — POST /auth/verify-email/send
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
// ENDPOINT 5 — POST /auth/forgot-password
// Meminta kode reset password
// =============================================================================

/**
 * forgotPasswordSchema
 * Dipakai di: form lupa password
 *
 * Aturan:
 * - email: wajib dan harus berformat email
 * - Backend selalu balikin 200 baik email terdaftar maupun tidak,
 *   untuk mencegah account enumeration (auth.flow.md §8).
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
})

// =============================================================================
// ENDPOINT 6 — POST /auth/forgot-password/verify-code
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
// ENDPOINT 7 — POST /auth/reset-password
// Mengubah password setelah kode reset berhasil diverifikasi
// =============================================================================

/**
 * resetPasswordSchema
 * Dipakai di: form reset password
 *
 * Aturan:
 * - resetToken: wajib, diperoleh dari response verifikasi kode reset
 * - newPassword: minimal 8 karakter
 * - confirmPassword: harus sama dengan newPassword
 *
 * ⚠️ Field bernama `newPassword` (BUKAN `password`) — harus match persis
 * dengan payload yang dikirim resetPassword() di services/authApi.js
 * ({ resetToken, newPassword }), supaya hasil form bisa langsung
 * di-spread tanpa mapping manual.
 */
export const resetPasswordSchema = z
  .object({
    resetToken: z.string().trim().min(1, "Token reset password tidak tersedia"),
    newPassword: z.string().min(1, "Password baru wajib diisi").min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })

// =============================================================================
// ENDPOINT 8 — PATCH /auth/change-password
// Mengganti password pengguna yang sedang login
// =============================================================================

/**
 * changePasswordSchema
 * Dipakai di: form ganti password (halaman profil/pengaturan akun)
 *
 * Aturan:
 * - oldPassword: wajib diisi
 * - newPassword: minimal 8 karakter, TIDAK BOLEH sama dengan oldPassword
 *   (backend juga menolak ini di auth.flow.md §9 — validasi di FE cuma
 *   untuk UX lebih cepat, backend tetap sumber kebenaran)
 * - confirmPassword: harus sama dengan newPassword
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(1, "Password baru wajib diisi").min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: "Password baru tidak boleh sama dengan password lama",
    path: ["newPassword"],
  })    