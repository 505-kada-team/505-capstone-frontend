/**
 * services/plan/plan.endpoints.js
 *
 * Definisi path REST untuk modul Plan.
 * Backend: routes/plan.routes.js, di-mount di '/plan' (lihat routes/index.js:
 * `router.use('/plan', planRoutes)`).
 *
 * Sama seperti menu.endpoints.js: file ini HANYA menyusun string path,
 * tidak menyentuh Axios/auth sama sekali -- itu tugas plan.api.js.
 */

const BASE = "/plan";
const REPORT_BASE = '/plan-reports';

export const planEndpoints = {
  // A1 - POST /plan
  create: () => BASE,

  // A2 - GET /plan
  list: () => BASE,

  // A3 - GET /plan/:id
  detail: (id) => `${BASE}/${id}`,

  // A4 - PUT /plan/:id
  update: (id) => `${BASE}/${id}`,

  // A5 - POST /plan/:id/check-availability
  refreshAvailability: (id) => `${BASE}/${id}/check-availability`,

  // A6 - POST /plan/:id/approve
  approve: (id) => `${BASE}/${id}/approve`,

  // A7 - POST /plan/:id/stop
  stop: (id) => `${BASE}/${id}/stop`,

  // A8 - DELETE /plan/:id
  cancel: (id) => `${BASE}/${id}`,

  // A9 - PUT /plan/:id/menus/:menuId/discount
  setDiscount: (id, menuId) => `${BASE}/${id}/menus/${menuId}/discount`,

  // A10 - DELETE /plan/:id/menus/:menuId/discount
  removeDiscount: (id, menuId) => `${BASE}/${id}/menus/${menuId}/discount`,

  // =========================
  // Plan Report
  // =========================

  createReport: () => REPORT_BASE,
  listReports: () => REPORT_BASE,
  reviewReport: (reportId) => `${REPORT_BASE}/${reportId}/review`,
  addReportInventory: (reportId) => `${REPORT_BASE}/${reportId}/add-inventory`,
};
