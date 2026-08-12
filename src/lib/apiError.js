/**
 * src/lib/apiError.js
 *
 * Utility untuk mengekstrak pesan error dari Axios response.
 * Digunakan oleh hooks (usePlanDetail, usePlanList, usePlanDiscount)
 * agar tidak perlu mengulang pattern `err?.response?.data?.message` di mana-mana.
 */

/**
 * Extract user-facing error message from an Axios/API error.
 * Falls back to `fallback` if no message found.
 *
 * @param {unknown} err - The caught error (typically AxiosError)
 * @param {string} [fallback='Terjadi kesalahan'] - Default message
 * @returns {string}
 */
export function getApiErrorMessage(err, fallback = 'Terjadi kesalahan') {
  // Axios-shaped error: err.response.data.message
  const msg =
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message;

  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  return fallback;
}
