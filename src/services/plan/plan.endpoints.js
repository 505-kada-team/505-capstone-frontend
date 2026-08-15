/**
 * Kumpulan endpoint untuk modul Production Plan.
 * Base path: /api/plan
 */
export const PLAN_ENDPOINTS = {
  create: "/plan",
  list: "/plan",
  detail: (id) => `/plan/${id}`,
  update: (id) => `/plan/${id}`,
  refreshAvailability: (id) => `/plan/${id}/check-availability`,
  approve: (id) => `/plan/${id}/approve`,
  stop: (id) => `/plan/${id}/stop`,
  cancel: (id) => `/plan/${id}`,
  setDiscount: (id, menuId) => `/plan/${id}/menus/${menuId}/discount`,
  removeDiscount: (id, menuId) => `/plan/${id}/menus/${menuId}/discount`,
};
