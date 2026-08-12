/**
 * services/plan/plan.mapper.js
 *
 * Normalisasi response backend Plan menjadi bentuk yang gampang dipakai FE.
 *
 * Prinsip: field yang bentuknya SUDAH pasti (lihat models/plan/productionPlan.model.js
 * dan controllers/plan.controller.js -> services/plan.service.js
 * toSummaryResponse / toDetailedResponse) dinormalisasi eksplisit -- tanggal
 * di-parse ke Date, nilai opsional dikasih default aman (null/0/[]) supaya
 * UI tidak perlu optional-chaining bertingkat. Field yang bentuknya TIDAK
 * dijamin di layer ini (mis. hasil computeMenuCost/computeCommittedIngredientsDetail
 * di utils/planCompute.js, yang isinya tidak terlihat dari controller/service)
 * tetap dipertahankan apa adanya lewat spread, supaya tidak ada data yang
 * hilang diam-diam kalau backend nambah field baru.
 *
 * CATATAN KHUSUS checkResult: komentar di plan.service.js bilang
 * inventoryService.checkAvailability() (endpoint 11) mengembalikan
 * `amountNeeded`/`batches`, TANPA `availableQuantity` -- sedangkan
 * checkResultSchema di model mewajibkan `quantityNeeded`/`availableQuantity`/
 * `eligibleBatches`. Karena runAvailabilityCheck() menyimpan `results` apa
 * adanya ke plan.checkResult, bentuk aktual yang balik ke FE bisa jadi salah
 * satu dari dua penamaan itu tergantung implementasi inventoryService yang
 * sebenarnya. mapCheckResultItem() sengaja menerima KEDUANYA (fallback
 * amountNeeded -> quantityNeeded, batches -> eligibleBatches) supaya mapper
 * ini tidak rapuh terhadap perbedaan tsb. Kalau nanti dikonfirmasi bentuknya
 * sudah pasti salah satu, fallback ini boleh disederhanakan.
 */

const toDateOrNull = (value) => (value ? new Date(value) : null);

// --- Sub-dokumen -----------------------------------------------------------

/** discountSchema (+ discountedPrice/discountStatus kalau dilampirkan controller). */
function mapDiscount(discount) {
  if (!discount) return null;
  return {
    ...discount,
    discountPercentage: discount.discountPercentage,
    startDate: toDateOrNull(discount.startDate),
    endDate: toDateOrNull(discount.endDate),
    reason: discount.reason || "",
    setBy: discount.setBy,
    setAt: toDateOrNull(discount.setAt),
    // Hanya ada saat dilampirkan computePricing (setDiscount / toDetailedResponse)
    discountedPrice: discount.discountedPrice ?? null,
    discountStatus: discount.discountStatus ?? null,
  };
}

/** eligibleBatchSchema (checkResult, draft) -- lihat catatan checkResult di atas. */
function mapEligibleBatch(batch) {
  if (!batch) return null;
  return {
    ...batch,
    subInventoryId: batch.subInventoryId,
    quantityTaken: batch.quantityTaken ?? batch.quantityUsed ?? null,
    expired: toDateOrNull(batch.expired),
    batchSafetyStatus: batch.batchSafetyStatus ?? null,
  };
}

/** checkResultSchema -- 1 baris kebutuhan bahan hasil simulasi (draft only). */
function mapCheckResultItem(item) {
  if (!item) return null;
  return {
    ...item,
    inventoryId: item.inventoryId,
    nameInventory: item.nameInventory,
    unit: item.unit ?? null,
    quantityNeeded: item.quantityNeeded ?? item.amountNeeded ?? null,
    sufficient: item.sufficient,
    availableQuantity: item.availableQuantity ?? null,
    shortfall: item.shortfall ?? null,
    hasUnsafeBatch: item.hasUnsafeBatch ?? false,
    eligibleBatches: (item.eligibleBatches ?? item.batches ?? []).map(
      mapEligibleBatch,
    ),
  };
}

/** committedBatchSchema (committedIngredients, non-draft). */
function mapCommittedBatch(batch) {
  if (!batch) return null;
  return {
    ...batch,
    subInventoryId: batch.subInventoryId,
    batchCode: batch.batchCode,
    quantityUsed: batch.quantityUsed,
    quantityRemaining: batch.quantityRemaining,
    costPriceUsed: batch.costPriceUsed,
    batchSafetyStatus: batch.batchSafetyStatus,
    expired: toDateOrNull(batch.expired),
  };
}

/** committedIngredientSchema -- 1 baris bahan yang sudah dialokasikan (non-draft). */
function mapCommittedIngredient(ingredient) {
  if (!ingredient) return null;
  return {
    ...ingredient,
    inventoryId: ingredient.inventoryId,
    nameInventory: ingredient.nameInventory,
    unit: ingredient.unit ?? null,
    quantityNeeded: ingredient.quantityNeeded,
    batches: (ingredient.batches ?? []).map(mapCommittedBatch),
  };
}

/**
 * planMenuSchema, dipakai untuk toSummaryResponse (A1/A2/A4) MAUPUN
 * toDetailedResponse (A3). Field yang cuma relevan di salah satu bentuk
 * (mis. ingredientsDetail vs committedIngredientsDetail) tetap dipertahankan
 * apa adanya -- FE cukup cek `plan.status` buat tahu mana yang relevan.
 */
function mapPlanMenu(menu) {
  if (!menu) return null;
  return {
    ...menu,
    menuId: menu.menuId,
    name: menu.name ?? null,
    quantityPlanned: menu.quantityPlanned,
    soldQuantity: menu.soldQuantity ?? 0,
    lossQuantity: menu.lossQuantity ?? 0,
    soldOutAt: toDateOrNull(menu.soldOutAt),
    // Hanya diisi di toDetailedResponse untuk plan non-draft.
    remainingQuantity: menu.remainingQuantity ?? null,
    frozenSellingPrice: menu.frozenSellingPrice ?? null,
    frozenMenuImage: menu.frozenMenuImage ?? null,
    // Dari computePricing (...pricing) -- nama field dipastikan dari
    // pemakaian di setDiscount destructuring.
    effectiveSellingPrice: menu.effectiveSellingPrice ?? null,
    discountedPrice: menu.discountedPrice ?? null,
    discountStatus: menu.discountStatus ?? null,
    discount: mapDiscount(menu.discount),
    lowStock: menu.lowStock ?? null,

    // Draft-only (A3, status === 'draft')
    ingredientsDetail: menu.ingredientsDetail ?? null,

    // Non-draft-only (A3, status !== 'draft')
    costComplete: menu.costComplete ?? null,
    costPerPortion: menu.costPerPortion ?? null,
    estimatedProfit: menu.estimatedProfit ?? null,
    committedIngredientsDetail: menu.committedIngredientsDetail
      ? menu.committedIngredientsDetail
      : null,
  };
}

// --- Response utuh per endpoint ---------------------------------------

/** A2 - 1 baris di listPlans(). */
export function mapPlanListItem(item) {
  if (!item) return null;
  return {
    ...item,
    _id: item._id,
    name: item.name,
    tags: item.tags ?? [],
    status: item.status,
    startDate: toDateOrNull(item.startDate),
    endDate: toDateOrNull(item.endDate),
    totalMenu: item.totalMenu ?? 0,
    readyToApprove: !!item.readyToApprove,
    hasPendingLossReplacement: !!item.hasPendingLossReplacement,
    hasActiveDiscount: !!item.hasActiveDiscount,
    hasUnsafeBatch: !!item.hasUnsafeBatch,
  };
}

/** A2 - bungkus { data, pagination } dari envelope ApiResponse. */
export function mapPlanListResponse(envelope) {
  const data = envelope?.data ?? [];
  return {
    data: data.map(mapPlanListItem),
    pagination: envelope?.pagination ?? null,
  };
}

/** A1 / A4 - toSummaryResponse. */
export function mapPlanSummary(plan) {
  if (!plan) return null;
  return {
    ...plan,
    _id: plan._id,
    name: plan.name,
    tags: plan.tags ?? [],
    status: plan.status,
    startDate: toDateOrNull(plan.startDate),
    duration: plan.duration,
    endDate: toDateOrNull(plan.endDate),
    menus: (plan.menus ?? []).map(mapPlanMenu),
    checkResult: (plan.checkResult ?? []).map(mapCheckResultItem),
    checkResultStale: !!plan.checkResultStale,
    staleReason: plan.staleReason ?? null,
    readyToApprove: !!plan.readyToApprove,
    hasPendingLossReplacement: !!plan.hasPendingLossReplacement,
    createdAt: toDateOrNull(plan.createdAt),
    updatedAt: toDateOrNull(plan.updatedAt),
  };
}

/**
 * A3 - toDetailedResponse. Bentuknya beda antara draft dan non-draft (lihat
 * service), jadi field-field yang tidak relevan untuk status saat ini akan
 * bernilai null/undefined -- selalu cek `plan.status` (atau `isDraft`) dulu
 * sebelum pakai field draft-only/non-draft-only.
 */
export function mapPlanDetail(plan) {
  if (!plan) return null;
  const isDraft = plan.status === "draft";

  return {
    ...plan,
    _id: plan._id,
    name: plan.name,
    tags: plan.tags ?? [],
    status: plan.status,
    isDraft,
    startDate: toDateOrNull(plan.startDate),
    duration: plan.duration,
    endDate: toDateOrNull(plan.endDate),
    hasPendingLossReplacement: !!plan.hasPendingLossReplacement,
    menus: (plan.menus ?? []).map(mapPlanMenu),
    createdAt: toDateOrNull(plan.createdAt),
    updatedAt: toDateOrNull(plan.updatedAt),
    warning: plan.warning ?? null,

    // Draft-only
    inventorySafetyStatus: isDraft
      ? (plan.inventorySafetyStatus ?? null)
      : null,
    suggestion: isDraft ? (plan.suggestion ?? null) : null,
    checkResultStale: isDraft ? !!plan.checkResultStale : null,
    staleReason: isDraft ? (plan.staleReason ?? null) : null,
    readyToApprove: isDraft ? !!plan.readyToApprove : null,
    checkResult: isDraft
      ? (plan.checkResult ?? []).map(mapCheckResultItem)
      : null,

    // Non-draft-only (active / completed / stopped)
    committedIngredients: !isDraft
      ? (plan.committedIngredients ?? []).map(mapCommittedIngredient)
      : null,
    approvedAt: !isDraft ? toDateOrNull(plan.approvedAt) : null,
    approvedBy: !isDraft ? (plan.approvedBy ?? null) : null,
    // Hanya terisi kalau plan.status === 'stopped'
    stoppedAt: plan.status === "stopped" ? toDateOrNull(plan.stoppedAt) : null,
    stoppedBy: plan.status === "stopped" ? (plan.stoppedBy ?? null) : null,
    stopReason: plan.status === "stopped" ? (plan.stopReason ?? null) : null,
    // Hanya terisi kalau plan.status === 'completed'
    completedAt:
      plan.status === "completed" ? toDateOrNull(plan.completedAt) : null,
  };
}


    export const mapPlanReport = (report = {}) => ({
    id: report._id ?? '',
    planId: report.planId ?? '',
    category: report.category ?? '',
    refId: report.refId ?? '',
    nameRef: report.nameRef ?? '',
    quantityLost: report.quantityLost ?? 0,
    incidentAt: report.incidentAt ?? null,
    isLateReport: report.isLateReport ?? false,
    reason: report.reason ?? '',
    reportedBy: report.reportedBy ?? '',
    reportedByRole: report.reportedByRole ?? '',
    status: report.status ?? '',

    reviewedBy: report.reviewedBy ?? null,
    reviewedAt: report.reviewedAt ?? null,
    adminNote: report.adminNote ?? null,

    valuation: report.valuation ?? null,

    replacementQuantity: report.replacementQuantity ?? null,
    varianceNote: report.varianceNote ?? null,
    replacementDeducted: report.replacementDeducted ?? false,
    replacementBatches: report.replacementBatches ?? [],
    replacementCost: report.replacementCost ?? null,
    replacedAt: report.replacedAt ?? null,
    replacedBy: report.replacedBy ?? null,

    createdAt: report.createdAt ?? null,
  });

  export const mapPlanReportList = (reports = []) => {
    if (!Array.isArray(reports)) return [];

    return reports.map(mapPlanReport);
  };


/** A5 - hasil refreshAvailability(). */
export function mapRefreshAvailabilityResult(result) {
  if (!result) return null;
  return {
    ...result,
    readyToApprove: !!result.readyToApprove,
    checkResultStale: !!result.checkResultStale,
    staleReason: result.staleReason ?? null,
    checkResult: (result.checkResult ?? []).map(mapCheckResultItem),
  };
}

/** A6 - hasil approvePlan(). */
export function mapApproveResult(result) {
  if (!result) return null;
  return {
    ...result,
    _id: result._id,
    status: result.status,
    approvedAt: toDateOrNull(result.approvedAt),
  };
}

/** A7 - hasil stopPlan(). */
export function mapStopResult(result) {
  if (!result) return null;
  return {
    ...result,
    _id: result._id,
    status: result.status,
    stoppedAt: toDateOrNull(result.stoppedAt),
    stoppedBy: result.stoppedBy ?? null,
    stopReason: result.stopReason ?? null,
  };
}

/** A8 - hasil cancelPlan(). */
export function mapCancelResult(result) {
  if (!result) return null;
  return {
    ...result,
    _id: result._id,
    status: result.status,
    cancelledAt: toDateOrNull(result.cancelledAt),
  };
}

/** A9 - hasil setDiscount(). */
export function mapSetDiscountResult(result) {
  if (!result) return null;
  return {
    ...result,
    menuId: result.menuId,
    effectiveSellingPrice: result.effectiveSellingPrice ?? null,
    discount: mapDiscount(result.discount),
  };
}

/** A10 - hasil removeDiscount(). discount selalu null setelah dihapus. */
export function mapRemoveDiscountResult(result) {
  if (!result) return null;
  return {
    ...result,
    menuId: result.menuId,
    discount: null,
  };
}

export const planMapper = {
  mapPlanListItem,
  mapPlanListResponse,
  mapPlanSummary,
  mapPlanDetail,
  mapRefreshAvailabilityResult,
  mapApproveResult,
  mapStopResult,
  mapCancelResult,
  mapSetDiscountResult,
  mapRemoveDiscountResult,
};
