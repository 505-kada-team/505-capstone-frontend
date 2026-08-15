/**
 * Mapper untuk menormalisasi response backend Production Plan.
 *
 * Perbedaan utama antar status:
 * - Draft: punya `checkResult` (per-inventory, dengan `eligibleBatches`) dan
 *   `ingredientsDetail` per menu (dengan `availableQuantity`).
 * - Non-draft (active/stopped/completed): punya `committedIngredients`
 *   (per-inventory, dengan `batches`) dan `committedIngredientsDetail` per
 *   menu (dengan `quantityAvailable`).
 * - Cancelled: banyak field null karena tidak pernah approve.
 *
 * Untuk memudahkan komponen UI, mapper ini MENYERAGAMKAN nama field supaya
 * komponen tidak perlu tahu lagi apakah plan sedang draft atau sudah
 * committed:
 * - Setiap menu selalu punya `ingredientsDetail` (bukan
 *   `committedIngredientsDetail` lagi) dengan field `availableQuantity`.
 * - Plan detail selalu punya `inventoryList` (dari `checkResult` ATAU
 *   `committedIngredients`, disamakan bentuknya) untuk tab Inventory.
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
    menuStatus: menu.menuStatus ?? "active",
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
    discount: mapDiscount(menu.discount),
  };
}

// Baris ingredient di dalam dropdown MENU (bukan tab Inventory) - draft
function mapMenuIngredientDraft(item) {
  return {
    inventoryId: item.inventoryId,
    nameInventory: item.nameInventory,
    unit: item.unit,
    quantityNeeded: item.quantityNeeded,
    availableQuantity: item.availableQuantity,
    shortfall: item.shortfall ?? 0,
    hasUnsafeBatch: !!item.hasUnsafeBatch,
    nearestExpiry: item.nearestExpiry ?? null,
    unitCost: item.unitCost ?? null,
    costContribution: item.costContribution ?? null,
  };
}

// Baris ingredient di dalam dropdown MENU - active/stopped/completed
function mapMenuIngredientCommitted(item) {
  return {
    inventoryId: item.inventoryId,
    nameInventory: item.nameInventory,
    unit: item.unit,
    quantityNeeded: item.quantityNeeded,
    availableQuantity: item.quantityAvailable, // disamakan nama dg draft
    shortfall: 0, // sudah dikomit saat approve, tidak ada shortfall lagi
    hasUnsafeBatch: !!item.hasUnsafeBatch,
    nearestExpiry: item.nearestExpiry ?? null,
    unitCost: item.unitCost ?? null,
    costContribution: item.costContribution ?? null,
  };
}

function mapMenuDetailDraft(menu) {
  return {
    ...mapMenuSummary(menu),
    ingredientsDetail: (menu.ingredientsDetail ?? []).map(
      mapMenuIngredientDraft,
    ),
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
    remainingQuantity: menu.remainingQuantity ?? 0,
    ingredientsDetail: (menu.committedIngredientsDetail ?? []).map(
      mapMenuIngredientCommitted,
    ),
    lowStock: menu.lowStock ?? false,
    costComplete: menu.costComplete ?? false,
    costPerPortion: menu.costPerPortion ?? null,
    estimatedProfit: menu.estimatedProfit ?? null,
  };
}

// ── Inventory tab (per-inventory, bukan per-menu) ───────────────────────

function mapInventoryBatchDraft(batch) {
  return {
    subInventoryId: batch.subInventoryId,
    batchCode: null, // draft belum punya batchCode, baru ada saat committed
    quantityTaken: batch.quantityTaken,
    expired: batch.expired ?? null,
    batchSafetyStatus: batch.batchSafetyStatus ?? "safe",
  };
}

function mapInventoryBatchCommitted(batch) {
  return {
    subInventoryId: batch.subInventoryId,
    batchCode: batch.batchCode ?? null,
    quantityTaken: batch.quantityUsed,
    expired: batch.expired ?? null,
    batchSafetyStatus: batch.batchSafetyStatus ?? "safe",
  };
}

function mapInventoryItemDraft(item) {
  return {
    inventoryId: item.inventoryId,
    nameInventory: item.nameInventory,
    unit: item.unit,
    quantityNeeded: item.quantityNeeded,
    availableQuantity: item.availableQuantity ?? null,
    sufficient: !!item.sufficient,
    hasUnsafeBatch: !!item.hasUnsafeBatch,
    batches: (item.eligibleBatches ?? []).map(mapInventoryBatchDraft),
  };
}

function mapInventoryItemCommitted(item) {
  const rawBatches = item.batches ?? [];
  // Setelah committed, "available" dihitung dari sisa tiap batch yang dipakai
  const availableQuantity = rawBatches.reduce(
    (sum, b) => sum + (b.quantityRemaining ?? 0),
    0,
  );
  const hasUnsafeBatch = rawBatches.some(
    (b) => b.batchSafetyStatus === "unsafe",
  );
  return {
    inventoryId: item.inventoryId,
    nameInventory: item.nameInventory,
    unit: item.unit,
    quantityNeeded: item.quantityNeeded,
    availableQuantity,
    // sudah lolos pengecekan saat approve, jadi selalu dianggap sufficient
    sufficient: true,
    hasUnsafeBatch,
    batches: rawBatches.map(mapInventoryBatchCommitted),
  };
}

export function mapInventoryList(raw) {
  if (isDraftPlan(raw)) {
    return (raw.checkResult ?? []).map(mapInventoryItemDraft);
  }
  return (raw.committedIngredients ?? []).map(mapInventoryItemCommitted);
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
    inventoryList: mapInventoryList(raw),
    checkResult: raw.checkResult ?? [],
  };

  if (isDraftPlan(raw)) {
    return {
      ...base,
      menus: (raw.menus ?? []).map(mapMenuDetailDraft),
      inventorySafetyStatus: raw.inventorySafetyStatus ?? null,
      suggestion: raw.suggestion ?? null,
    };
  }

  return {
    ...base,
    menus: (raw.menus ?? []).map(mapMenuDetailCommitted),
    approvedAt: raw.approvedAt ?? null,
    approvedBy: raw.approvedBy ?? null,
    stoppedAt: raw.stoppedAt ?? null,
    stoppedBy: raw.stoppedBy ?? null,
    stopReason: raw.stopReason ?? null,
    completedAt: raw.completedAt ?? null,
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
