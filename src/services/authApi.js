/**
 * services/authApi.js
 *
 * Seluruh authentication API selalu menggunakan backend.
 * Tidak ada mock authentication.
 */

import api, {
  clearAccessToken,
  setAccessToken,
} from './api';

const DEFAULT_AUTH_ROLE =
  import.meta.env.VITE_DEFAULT_AUTH_ROLE || 'admin';

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

const unwrap = (response) =>
  response.data?.data ?? response.data;

const normalizeAuthUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    ...user,
    role: user.role ?? DEFAULT_AUTH_ROLE,
  };
};

const normalizeAuthResult = (result) => {
  if (!result) {
    return result;
  }

  if (result.user) {
    return {
      ...result,
      user: normalizeAuthUser(result.user),
    };
  }

  if (
    result.id ||
    result.userId ||
    result.email ||
    result.name
  ) {
    return normalizeAuthUser(result);
  }

  return result;
};

// =============================================================================
// ENDPOINT 1 — POST /auth/register
// Registrasi pengguna baru
// Payload: { name, email, password }
// =============================================================================

export const register = ({ name, email, password }) =>
  api
    .post('/auth/register', {
      name,
      email,
      password,
    })
    .then(unwrap)
    .then(normalizeAuthResult);

// =============================================================================
// ENDPOINT 2 — POST /auth/verify-email/send
// Kirim kode verifikasi email
// Payload: { email }
// =============================================================================

export const sendVerificationEmail = (email) =>
  api
    .post('/auth/verify-email/send', { email })
    .then(unwrap);

// =============================================================================
// ENDPOINT 3 — POST /auth/verify-email/confirm
// Konfirmasi kode verifikasi email
// Payload: { email, code }
// =============================================================================

export const confirmVerificationEmail = ({ email, code }) =>
  api
    .post('/auth/verify-email/confirm', {
      email,
      code,
    })
    .then(unwrap);

// =============================================================================
// ENDPOINT 4 — POST /auth/login
// Login pengguna
// Payload: { email, password }
// =============================================================================

export const login = ({ email, password }) =>
  api
    .post('/auth/login', {
      email,
      password,
    })
    .then(unwrap)
    .then(normalizeAuthResult)
    .then((result) => {
      const token =
        result?.accessToken ?? result?.token;

      if (token) {
        setAccessToken(token);
      }

      return result;
    });

// =============================================================================
// ENDPOINT 5 — GET /auth/me
// Ambil pengguna yang sedang login
// =============================================================================

export const getMe = () =>
  api
    .get('/auth/me')
    .then(unwrap)
    .then(normalizeAuthResult);

// =============================================================================
// ENDPOINT 6 — POST /auth/refresh
// Perbarui access token menggunakan refresh-token cookie
// =============================================================================

export const refreshToken = () =>
  api
    .post('/auth/refresh')
    .then(unwrap)
    .then((result) => {
      const token =
        result?.accessToken ?? result?.token;

      if (token) {
        setAccessToken(token);
      }

      return result;
    });

// =============================================================================
// ENDPOINT 7 — PATCH /auth/change-password
// Ganti password pengguna yang sedang login
// Payload: { oldPassword, newPassword }
// =============================================================================

export const changePassword = ({
  oldPassword,
  newPassword,
}) =>
  api
    .patch('/auth/change-password', {
      oldPassword,
      newPassword,
    })
    .then(unwrap);

// =============================================================================
// ENDPOINT 8 — POST /auth/forgot-password
// Kirim permintaan reset password
// Payload: { email }
// =============================================================================

export const forgotPassword = (email) =>
  api
    .post('/auth/forgot-password', { email })
    .then(unwrap);

// =============================================================================
// ENDPOINT 9 — POST /auth/forgot-password/verify-code
// Verifikasi kode reset password
// Payload: { email, code }
// =============================================================================

export const verifyResetCode = ({ email, code }) =>
  api
    .post('/auth/forgot-password/verify-code', {
      email,
      code,
    })
    .then(unwrap);

// =============================================================================
// ENDPOINT 10 — POST /auth/reset-password
// Simpan password baru
// Payload: { resetToken, newPassword }
// =============================================================================

export const resetPassword = ({
  resetToken,
  newPassword,
}) =>
  api
    .post('/auth/reset-password', {
      resetToken,
      newPassword,
    })
    .then(unwrap);

// =============================================================================
// ENDPOINT 11 — POST /auth/logout
// Logout pengguna dan hapus access token lokal
// =============================================================================

export const logout = () =>
  api
    .post('/auth/logout')
    .then(unwrap)
    .finally(clearAccessToken);