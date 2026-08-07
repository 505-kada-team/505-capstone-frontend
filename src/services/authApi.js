/**
 * services/authApi.js
 *
 * Seluruh authentication API selalu menggunakan backend.
 * Tidak menggunakan mock authentication.
 */

import api, { clearAccessToken, extractAccessToken,  refreshAccessToken, setAccessToken } from "./api";

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

const unwrap = (response) => response.data?.data ?? response.data;

const ALLOWED_ROLES = ["admin", "cashier"];

const normalizeRole = (role) => {
  if (typeof role !== "string") return null;

  const normalizedRole = role.trim().toLowerCase();

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return null;
  }

  return normalizedRole;
};

const normalizeAuthUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    id: user.id ?? user._id,
    role: normalizeRole(user.role),
  };
};

const normalizeAuthResult = (result) => {
  if (!result) return result;

  if (result.user) {
    return {
      ...result,
      user: normalizeAuthUser(result.user),
    };
  }

  return result;
};

const saveAccessToken = (result) => {
  const token = extractAccessToken(result);

  if (token) setAccessToken(token);

  return result;
};

// =============================================================================
// ENDPOINT 1 — POST /auth/register
// Registrasi pengguna baru
// Payload: { name, email, password }
// Role ditentukan backend sebagai kasir, tidak dikirim dari frontend.
// (Selaras — pastikan registerSchema.js di FE juga tidak lagi mengirim
//  field `role`, lihat catatan review.)
// =============================================================================

export const register = ({ name, email, password }) =>
  api.post("/auth/register", { name, email, password })
    .then(unwrap);

// =============================================================================
// ENDPOINT 2 — POST /auth/verify-email/send
// Kirim kode verifikasi email
// Payload: { email }
// =============================================================================

export const sendVerificationEmail = (email) =>
  api.post("/auth/verify-email/send", { email })
    .then(unwrap);

// =============================================================================
// ENDPOINT 3 — POST /auth/verify-email/confirm
// Konfirmasi kode verifikasi email
// Payload: { email, code }
// =============================================================================

export const confirmVerificationEmail = ({ email, code }) =>
  api.post("/auth/verify-email/confirm", { email, code })
    .then(unwrap);

// =============================================================================
// ENDPOINT 4 — POST /auth/login
// Login pengguna
// Payload: { email, password }
// =============================================================================

// export const login = ({ email, password }) =>
//   api.post("/auth/login", { email, password })
//     .then(unwrap)
//     .then(normalizeAuthResult)
//     .then(saveAccessToken);

export const login = ({ email, password }) =>
  api
    .post("/auth/login", { email, password })
    .then(unwrap)
    .then((result) => {
      console.log("[LOGIN UNWRAPPED RESULT]", result);
      return result;
    })
    .then(normalizeAuthResult)
    .then((result) => {
      console.log("[LOGIN NORMALIZED RESULT]", result);
      return result;
    })
    .then(saveAccessToken);

// =============================================================================
// ENDPOINT 5 — GET /auth/me
//
// ⚠️ BELUM TERKONFIRMASI: endpoint ini tidak disebutkan di auth.flow.md.
// Dipakai di sini untuk rehydrate session setelah page reload (karena
// access token cuma disimpan di memory dan hilang saat refresh browser,
// sementara response /auth/refresh tidak mengandung `user`).
// JANGAN pakai fungsi ini sebelum dikonfirmasi ke backend dev bahwa
// endpoint ini benar ada dan tahu response shape-nya.
// =============================================================================

export const getMe = () =>
  api
    .get("/auth/me", {
      headers: {
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
      },
      params: {
        _ts: Date.now(),
      },
    })
    .then(unwrap)
    .then(normalizeAuthUser);

// =============================================================================
// ENDPOINT 6 — POST /auth/refresh
// Perbarui access token menggunakan refresh-token cookie.
// Catatan: response TIDAK mengandung `user` (sesuai auth.flow.md §5) —
// jangan andalkan hasil fungsi ini untuk tahu role pengguna.
// =============================================================================


export const refreshToken = () =>
  refreshAccessToken();

let restoreSessionPromise = null;

export const restoreSession = () => {
  if (restoreSessionPromise) {
    return restoreSessionPromise;
  }

  restoreSessionPromise = refreshAccessToken()
    .then(() => getMe())
    .then((user) => {
      if (!user || typeof user !== "object") {
        throw new Error(
          "Response /auth/me tidak memiliki data user.",
        );
      }

      return user;
    })
    .finally(() => {
      restoreSessionPromise = null;
    });

  return restoreSessionPromise;
};

// =============================================================================
// ENDPOINT 7 — PATCH /auth/change-password
// Ganti password pengguna yang sedang login
// Payload: { oldPassword, newPassword }
//
// Catatan penting (auth.flow.md §9): sukses di sini membuat SEMUA refresh
// token direvoke + tokenVersion naik, termasuk device yang sedang dipakai.
// Access token di memory masih "kelihatan hidup" sampai request berikutnya
// kena 401 tak terduga. Di pemanggil (AuthContext), setelah promise ini
// resolve sukses, sebaiknya langsung clearAccessToken() + redirect ke
// /login secara eksplisit — jangan menunggu 401 nyasar.
// =============================================================================

export const changePassword = ({ oldPassword, newPassword }) =>
  api.patch("/auth/change-password", { oldPassword, newPassword })
    .then(unwrap);

// =============================================================================
// ENDPOINT 8 — POST /auth/forgot-password
// Kirim permintaan reset password
// Payload: { email }
// =============================================================================

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email })
    .then(unwrap);

// =============================================================================
// ENDPOINT 9 — POST /auth/forgot-password/verify-code
// Verifikasi kode reset password
// Payload: { email, code }
// =============================================================================

export const verifyResetCode = ({ email, code }) =>
  api.post("/auth/forgot-password/verify-code", { email, code })
    .then(unwrap);

// =============================================================================
// ENDPOINT 10 — POST /auth/reset-password
// Simpan password baru
// Payload: { resetToken, newPassword }
// =============================================================================

export const resetPassword = ({ resetToken, newPassword }) =>
  api.post("/auth/reset-password", { resetToken, newPassword })
    .then(unwrap);

// =============================================================================
// ENDPOINT 11 — POST /auth/logout
// Logout pengguna dan hapus access token lokal
// =============================================================================

export const logout = () =>
  api.post("/auth/logout")
    .then(unwrap)
    .finally(clearAccessToken);