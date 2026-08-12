/**
 * services/plan/plan.api.js
 *
 * Data source layer - Plan (Production Plan).
 * Tanggung jawab TUNGGAL: memanggil endpoint backend lewat instance Axios
 * yang sudah ada (`services/api.js`). Auth/bearer token sudah ditangani
 * interceptor di sana, jadi TIDAK diimplementasikan ulang di sini.
 *
 * Sama seperti menu.api.js, file ini sengaja TIDAK melakukan normalisasi/
 * transformasi response -- itu tugas `plan.mapper.js`. Satu alasan untuk
 * berubah per file:
 *   - endpoint backend berubah        -> ubah file ini / plan.endpoints.js
 *   - bentuk response FE berubah      -> ubah plan.mapper.js
 *   - cara data dipakai di UI berubah -> ubah hooks/plan/*
 *
 * Setiap fungsi mengembalikan `response.data` mentah, yaitu envelope
 * ApiResponse dari backend (utils/ApiResponse.js):
 *   { data: <payload>, message?, pagination? }
 *
 * Bentuk `<payload>` per endpoint mengacu ke controllers/plan.controller.js
 * dan services/plan.service.js (toSummaryResponse / toDetailedResponse).
 */

import api from "../api";
import { planEndpoints } from "./plan.endpoints";

export const planApi = {
  /**
   * A1 - POST /plan
   * Body: { name, tags?, startDate, duration, menus: [{ menuId, quantityPlanned }] }
   * -> plan baru berstatus draft, sudah termasuk checkResult hasil simulasi
   * ketersediaan bahan awal (toSummaryResponse).
   */
  create: (payload) =>
    api.post(planEndpoints.create(), payload).then((res) => res.data),

  /**
   * A2 - GET /plan
   * Query: { status?, search?, tags?, page?, limit? }
   * -> { data: [...ringkasan list], pagination }
   */
  list: (params) =>
    api.get(planEndpoints.list(), { params }).then((res) => res.data),

  /**
   * A3 - GET /plan/:id
   * -> detail plan + breakdown per-menu. Selagi draft: ingredientsDetail,
   * inventorySafetyStatus, suggestion. Setelah approve: committedIngredients
   * + committedIngredientsDetail per menu (toDetailedResponse).
   */
  detail: (id) => api.get(planEndpoints.detail(id)).then((res) => res.data),

  /**
   * A4 - PUT /plan/:id
   * Hanya bisa selagi status draft. Body: subset dari
   * { name, tags, startDate, duration, menus }.
   * Server otomatis refresh check-availability setelah edit.
   */
  update: (id, payload) =>
    api.put(planEndpoints.update(id), payload).then((res) => res.data),

  /**
   * A5 - POST /plan/:id/check-availability
   * Refresh simulasi ketersediaan bahan (hanya selagi status draft), tanpa body.
   */
  refreshAvailability: (id) =>
    api.post(planEndpoints.refreshAvailability(id)).then((res) => res.data),

  /**
   * A6 - POST /plan/:id/approve
   * Alokasikan stok, bekukan harga jual/resep, plan -> active.
   * Tanpa body -- aktor diambil server dari req.user.
   */
  approve: (id) => api.post(planEndpoints.approve(id)).then((res) => res.data),

  /**
   * A7 - POST /plan/:id/stop
   * Body: { reason, stoppedBy? } -- hanya selagi status active.
   */
  stop: (id, payload) =>
    api.post(planEndpoints.stop(id), payload).then((res) => res.data),

  /**
   * A8 - DELETE /plan/:id
   * Batalkan plan (hanya selagi status draft).
   */
  cancel: (id) => api.delete(planEndpoints.cancel(id)).then((res) => res.data),

  /**
   * A9 - PUT /plan/:id/menus/:menuId/discount
   * Body: { discountPercentage, startDate, endDate, reason? }
   * -> set/replace diskon 1 menu di dalam plan (draft atau active).
   */
  setDiscount: (id, menuId, payload) =>
    api
      .put(planEndpoints.setDiscount(id, menuId), payload)
      .then((res) => res.data),

  /**
   * A10 - DELETE /plan/:id/menus/:menuId/discount
   * Hapus diskon aktif dari 1 menu di dalam plan.
   */
  removeDiscount: (id, menuId) =>
    api
      .delete(planEndpoints.removeDiscount(id, menuId))
      .then((res) => res.data),

      // =========================
      // Plan Report
      // =========================

      createReport: (payload) =>
        api.post(planEndpoints.createReport(), payload).then((res) => res.data),

      listReports: (params) =>
        api.get(planEndpoints.listReports(), { params }).then((res) => res.data),

      reviewReport: (reportId, payload) =>
        api.put(planEndpoints.reviewReport(reportId), payload).then((res) => res.data),

      addReportInventory: (reportId, payload) =>
        api.post(planEndpoints.addReportInventory(reportId), payload).then((res) => res.data),
};
