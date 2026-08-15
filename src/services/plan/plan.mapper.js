/**
 * Mapper untuk menormalisasi response backend Production Plan.
 * Perbedaan utama:
 * - Draft: punya checkResult, ingredientsDetail, costWarning
 * - Non-draft (active/stopped/completed/cancelled): punya committedIngredients, committedIngredientsDetail
 * - Cancelled: banyak field null karena tidak pernah approve
 */
export function isDraftPlan(plan) {
  return plan.status === "draft";
}

function mapDiscount(discount) {
  if (!discount) return null;
  return {
    discountPercentage: discount.discountPercentage,
    startDate: discount.startDate,
    endDate: discount.endDate,
    reason: discount.reason,
    setBy: discount.setBy,
    setAt: discount.setAt,
    discountedPrice: discount.discountedPrice ?? null,
    discountStatus: discount.discountStatus ?? null,
  };
}

function mapMenuSummary(menu) {
  return {
    menuId: menu.menuId,
    name: menu.name ?? null, // bisa null di cancelled
    menuStatus: menu.menuStatus ?? "active", // ← tambahkan baris ini
    quantityPlanned: menu.quantityPlanned,
    soldQuantity: menu.soldQuantity,
    lossQuantity: menu.lossQuantity,
    soldOutAt: menu.soldOutAt,
    remainingQuantity: menu.remainingQuantity ?? null,
    frozenSellingPrice: menu.frozenSellingPrice ?? null,
    effectiveSellingPrice: menu.effectiveSellingPrice ?? null,
    discountedPrice: menu.discountedPrice ?? null,
    discountStatus: menu.discountStatus ?? null,
    currentPrice: menu.effectiveSellingPrice ?? menu.frozenSellingPrice ?? null,
    discount: mapDiscount(menu.discount), // akan null jika tidak ada
  };
}

function mapMenuDetailDraft(menu) {
  return {
    ...mapMenuSummary(menu),
    currentPrice: menu.effectiveSellingPrice, // alias untuk komponen
    ingredientsDetail: menu.ingredientsDetail ?? [],
    lowStock: menu.lowStock ?? false,
    costPerPortion: menu.costPerPortion ?? null,
    costComplete: menu.costComplete ?? false,
    estimatedProfit: menu.estimatedProfit ?? null,
    costWarning: menu.costWarning ?? null,
  };
}

function mapMenuDetailCommitted(menu) {
  return {
    ...mapMenuSummary(menu),
    currentPrice: menu.effectiveSellingPrice, // alias
    remainingQuantity: menu.remainingQuantity ?? 0,
    committedIngredientsDetail: menu.committedIngredientsDetail ?? [],
    lowStock: menu.lowStock ?? false,
    costComplete: menu.costComplete ?? false,
    costPerPortion: menu.costPerPortion ?? null,
    estimatedProfit: menu.estimatedProfit ?? null,
  };
}

export function mapPlanSummary(raw) {
  if (!raw) return null;
  return {
    id: raw._id,
    name: raw.name,
    tags: raw.tags ?? [],
    status: raw.status,
    startDate: raw.startDate,
    duration: raw.duration,
    endDate: raw.endDate,
    menus: (raw.menus ?? []).map(mapMenuSummary),
    checkResult: raw.checkResult ?? [],
    checkResultStale: raw.checkResultStale,
    staleReason: raw.staleReason,
    readyToApprove: raw.readyToApprove,
    hasPendingLossReplacement: raw.hasPendingLossReplacement,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapPlanListItem(raw) {
  return {
    _id: raw._id,
    id: raw._id,
    name: raw.name,
    tags: raw.tags ?? [],
    status: raw.status,
    startDate: raw.startDate,
    endDate: raw.endDate,
    totalMenu: raw.totalMenu,
    readyToApprove: raw.readyToApprove,
    hasPendingLossReplacement: raw.hasPendingLossReplacement,
    hasActiveDiscount: raw.hasActiveDiscount,
    hasUnsafeBatch: raw.hasUnsafeBatch,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapPlanDetail(raw) {
  if (!raw) return null;

  const base = {
    id: raw._id,
    name: raw.name,
    tags: raw.tags ?? [],
    status: raw.status,
    isDraft: isDraftPlan(raw),
    startDate: raw.startDate,
    duration: raw.duration,
    endDate: raw.endDate,
    hasPendingLossReplacement: raw.hasPendingLossReplacement,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    warning: raw.warning ?? null,
    checkResultStale: raw.checkResultStale ?? false,
    staleReason: raw.staleReason ?? null,
    readyToApprove: raw.readyToApprove ?? false,
  };

  if (isDraftPlan(raw)) {
    return {
      ...base,
      menus: (raw.menus ?? []).map(mapMenuDetailDraft),
      inventorySafetyStatus: raw.inventorySafetyStatus,
      suggestion: raw.suggestion,
      checkResultStale: raw.checkResultStale,
      staleReason: raw.staleReason,
      readyToApprove: raw.readyToApprove,
      checkResult: raw.checkResult ?? [],
    };
  }

  return {
    ...base,
    menus: (raw.menus ?? []).map(mapMenuDetailCommitted),
    committedIngredients: raw.committedIngredients ?? [],
    approvedAt: raw.approvedAt ?? null,
    approvedBy: raw.approvedBy ?? null,
    stoppedAt: raw.stoppedAt,
    stoppedBy: raw.stoppedBy,
    stopReason: raw.stopReason,
    completedAt: raw.completedAt,
  };
}

export function mapApproveResult(raw) {
  return {
    id: raw._id,
    status: raw.status,
    approvedAt: raw.approvedAt,
  };
}

export function mapStopResult(raw) {
  return {
    id: raw._id,
    status: raw.status,
    stoppedAt: raw.stoppedAt,
    stoppedBy: raw.stoppedBy,
    stopReason: raw.stopReason,
  };
}

export function mapCancelResult(raw) {
  return {
    id: raw._id,
    status: raw.status,
    cancelledAt: raw.cancelledAt,
  };
}

export function mapDiscountResult(raw) {
  return {
    menuId: raw.menuId,
    effectiveSellingPrice: raw.effectiveSellingPrice,
    discount: mapDiscount(raw.discount),
  };
}

function mapIngredientDetailDraft(item) {
  return {
    ...item,
    quantityAvailable: item.availableQuantity,
    availableQuantity: item.availableQuantity, // biar kompatibel
  };
}

function mapCommittedIngredientDetail(item) {
  return {
    ...item,
    availableQuantity: item.quantityAvailable,
    quantityAvailable: item.quantityAvailable, // biar kompatibel
  };
}
