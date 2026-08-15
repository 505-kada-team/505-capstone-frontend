import api from "@/services/api";
import { PLAN_ENDPOINTS } from "./plan.endpoints";

// =============================================================================
// ENDPOINT A1 — POST /api/plan
// Buat plan baru (draft)
// =============================================================================
export const createPlan = (payload) => api.post(PLAN_ENDPOINTS.create, payload);

// =============================================================================
// ENDPOINT A2 — GET /api/plan
// List semua plan (filter status)
// =============================================================================
export const getPlanList = (params) => api.get(PLAN_ENDPOINTS.list, { params });

// =============================================================================
// ENDPOINT A3 — GET /api/plan/:id
// Detail plan + checkResult/committed + diskon
// =============================================================================
export const getPlanDetail = (id) => api.get(PLAN_ENDPOINTS.detail(id));

// =============================================================================
// ENDPOINT A4 — PUT /api/plan/:id
// Edit plan (hanya saat draft)
// =============================================================================
export const updatePlan = (id, payload) =>
  api.put(PLAN_ENDPOINTS.update(id), payload);

// =============================================================================
// ENDPOINT A5 — POST /api/plan/:id/check-availability
// Refresh simulasi ketersediaan bahan (hanya saat draft)
// =============================================================================
export const checkAvailabilityPlan = (id) => {
  const url = PLAN_ENDPOINTS.refreshAvailability(id);
  console.log("checkAvailabilityPlan URL:", url); // ✅ lihat di browser console
  console.log("checkAvailabilityPlan id:", id); // ✅ pastikan id benar
  return api.post(url);
};

// =============================================================================
// ENDPOINT A6 — POST /api/plan/:id/approve
// Setujui plan → deduct Inventory, bekukan frozenSellingPrice
// =============================================================================
export const approvePlan = (id) => api.post(PLAN_ENDPOINTS.approve(id));

// =============================================================================
// ENDPOINT A7 — POST /api/plan/:id/stop
// Hentikan paksa, active → stopped
// =============================================================================
export const stopPlan = (id, payload) =>
  api.post(PLAN_ENDPOINTS.stop(id), payload);

// =============================================================================
// ENDPOINT A8 — DELETE /api/plan/:id
// Batalkan draft (hanya saat draft)
// =============================================================================
export const cancelPlan = (id) => api.delete(PLAN_ENDPOINTS.cancel(id));

// =============================================================================
// ENDPOINT A9 — PUT /api/plan/:id/menus/:menuId/discount
// Set/ganti slot diskon
// =============================================================================
export const setMenuDiscount = (id, menuId, payload) =>
  api.put(PLAN_ENDPOINTS.setDiscount(id, menuId), payload);

// =============================================================================
// ENDPOINT A10 — DELETE /api/plan/:id/menus/:menuId/discount
// Hapus slot diskon
// =============================================================================
export const deleteMenuDiscount = (id, menuId) =>
  api.delete(PLAN_ENDPOINTS.removeDiscount(id, menuId));
