/**
 * services/menu/menu.endpoints.js
 *
 * Sumber tunggal path endpoint Menu, mengikuti backend routes/menu.routes.js
 * (semua route di bawah `authenticate` middleware — token sudah ditangani
 * oleh interceptor di services/api.js, tidak diulang di sini).
 *
 *   POST   /menu            -> create
 *   GET    /menu             -> list
 *   GET    /menu/dropdown    -> dropdown  (didaftarkan sebelum '/:id' di backend)
 *   GET    /menu/:id         -> detail
 *   PUT    /menu/:id         -> update
 *   DELETE /menu/:id         -> remove
 */

const MENU_BASE_URL = "/menu";

export const menuEndpoints = {
  list: () => MENU_BASE_URL,
  create: () => MENU_BASE_URL,
  dropdown: () => `${MENU_BASE_URL}/dropdown`,
  detail: (id) => `${MENU_BASE_URL}/${id}`,
  update: (id) => `${MENU_BASE_URL}/${id}`,
  remove: (id) => `${MENU_BASE_URL}/${id}`,
};
