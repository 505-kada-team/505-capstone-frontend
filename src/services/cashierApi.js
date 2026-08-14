/**
 * services/cashierApi.js
 *
 * Seluruh API Kasir untuk proses Selling dan Plan Report menggunakan backend.
 * Tidak menggunakan mock selling.
 *
 * Endpoint yang digunakan:
 * - GET  /selling/active
 * - POST /selling
 * - GET  /selling/history
 * - GET  /plan/:planId
 * - GET  /plan-reports
 * - POST /plan-reports
 */

import api from "./api";

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

const unwrap = (response) => response.data?.data ?? response.data;

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

const normalizeSellingMenu = (menu, plan) => {
  if (!menu) return null;

  return {
    id: menu.menuId,
    menuId: menu.menuId,
    planId: plan.planId,
    name: menu.name ?? "Menu tidak tersedia",
    image: menu.image ?? null,
    price: menu.sellingPrice,

    isDiscounted: menu.isDiscounted === true,
    discountPrice: menu.isDiscounted ? menu.currentPrice : null,
    discountPercent: menu.discountPercentage,

    stock: menu.remainingQuantity,
    stockRemaining: menu.remainingQuantity,
    remainingQuantity: menu.remainingQuantity,
    isAvailable:
      plan.sellable === true &&
      Number(menu.remainingQuantity ?? 0) > 0,

    discountEndsAt: menu.discountEndsAt,
    ingredientsDetail: menu.ingredientsDetail ?? [],
    planName: plan.name,
    planStartDate: plan.startDate,
    planEndDate: plan.endDate,
    warning: plan.warning,
  };
};

const normalizeActiveSellingPlans = (plans) => {
  if (!Array.isArray(plans)) return [];

  return plans.flatMap((plan) =>
    (plan.menus ?? [])
      .map((menu) => normalizeSellingMenu(menu, plan))
      .filter(Boolean)
  );
};

const normalizeSaleTransaction = (transaction) => {
  if (!transaction) return null;

  return {
    id: transaction._id,
    planId: transaction.planId,
    cashierName: transaction.cashierName,
    soldAt: transaction.soldAt,
    items: transaction.items ?? [],
    total: transaction.transactionRevenue ?? 0,
  };
};

const normalizeSaleHistory = (result) => {
  const transactions = Array.isArray(result?.data)
    ? result.data.map(normalizeSaleTransaction).filter(Boolean)
    : [];

  return {
    transactions,
    summary: {
      totalTransaction: result?.summary?.totalTransaction ?? 0,
      totalRevenue: result?.summary?.totalRevenue ?? 0,
      totalDiscountGiven: result?.summary?.totalDiscountGiven ?? 0,
    },
  };
};

// =============================================================================
// ENDPOINT 1 — GET /selling/active
// Mengambil menu dari seluruh production plan aktif.
// Hasil dinormalisasi menjadi array produk untuk halaman Cashier.
// =============================================================================

export const getActiveSellingPlans = () =>
  api
    .get("/selling/active")
    .then((response) => {
      const menus = response.data?.data?.[0]?.menus ?? [];

      menus.forEach((menu) => {
        console.log("[SELLING MENU]", {
          name: menu.name,
          sellingPrice: menu.sellingPrice,
          currentPrice: menu.currentPrice,
          isDiscounted: menu.isDiscounted,
          discountPercentage: menu.discountPercentage,
          discountEndsAt: menu.discountEndsAt,
        });
      });

      return unwrap(response);
    })
    .then(normalizeActiveSellingPlans);

// =============================================================================
// ENDPOINT 2 — POST /selling
// Membuat transaksi penjualan.
//
// Payload mengikuti kontrak backend Selling.
// cashierName tidak dikirim frontend karena diambil backend dari req.user.name.
// =============================================================================

export const createSale = (payload) => api.post("/selling", payload).then(unwrap);

// =============================================================================
// ENDPOINT 3 — GET /selling/history
// Mengambil riwayat transaksi penjualan.
//
// Params opsional:
// { planId, date, cashierName }
// =============================================================================

export const getSaleHistory = (params) =>
  api
    .get("/selling/history", { params })
    .then(unwrap)
    .then(normalizeSaleHistory);

// =============================================================================
// ENDPOINT 4 — GET /selling/active
// Mengambil response plan aktif secara raw.
//
// Digunakan ketika frontend membutuhkan struktur plan lengkap seperti:
// - planId / name
// - menus
// - menus[].ingredientsDetail
// - committedBatchesQueue
// - warning
// =============================================================================

export const getActivePlans = () => api.get("/selling/active").then(unwrap);

// =============================================================================
// ENDPOINT 5 — GET /plan/:planId
// Mengambil detail production plan.
//
// Masih digunakan untuk kebutuhan tertentu seperti resolve nama plan
// pada detail Report Issue.
// =============================================================================

export const getPlanDetail = (planId) => api.get(`/plan/${planId}`).then(unwrap);

// =============================================================================
// ENDPOINT 6 — GET /plan-reports
// Mengambil daftar laporan.
//
// Params opsional:
// { planId, status, category }
// =============================================================================

export const getPlanReports = (params) =>
  api.get("/plan-reports", { params }).then(unwrap);

// =============================================================================
// ENDPOINT 7 — POST /plan-reports
// Membuat laporan kehilangan/kerusakan.
//
// Payload:
// { planId, category, refId, quantityLost, incidentAt, reason }
//
// reportedBy dan reportedByRole tidak dikirim frontend.
// Backend mengambil data reporter dari req.user.
// =============================================================================

export const createPlanReport = (payload) =>
  api.post("/plan-reports", payload).then(unwrap);