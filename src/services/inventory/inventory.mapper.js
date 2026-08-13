// src/features/inventory/api/inventory.mapper.js
//
// Dua arah:
//   1. mapX(raw)        -> ubah response backend jadi shape yang enak
//                          dipakai komponen React (Date object asli,
//                          label status turunan, dll).
//   2. toXPayload(form)  -> ubah form values jadi body request sesuai
//                          bentuk yang divalidasi backend
//                          (validations/inventory.validation.js).
//
// Prinsip: hooks (useInventoryList, useAddBatch, dst) manggil inventoryApi
// lalu lewatin hasilnya ke sini. Komponen gak pernah lihat bentuk mentah
// dari backend.

const EXPIRY_WARNING_DAYS = 3; // batas "mau expired" — sesuaikan sama kebijakan tim

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Klasifikasi status kedaluwarsa batch untuk keperluan tampilan (badge warna,
 * sorting, dll). daysUntilExpiry null berarti kategori packaging (gak punya
 * tanggal expired).
 */
function deriveExpiryStatus(daysUntilExpiry) {
  if (daysUntilExpiry === null || daysUntilExpiry === undefined) return "none";
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) return "warning";
  return "safe";
}

function mapPagination(pagination) {
  if (!pagination) return null;
  // Backend mengembalikan { currentPage, totalData, totalPage, limit }.
  // Normalisasi ke shape yang dipakai hooks/UI: { page, total, totalPages, limit }.
  const page = pagination.currentPage ?? pagination.page ?? 1;
  const total = pagination.totalData ?? pagination.total ?? 0;
  const totalPages = pagination.totalPage ?? pagination.totalPages ?? 1;
  const limit = pagination.limit ?? 10;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// ---------------------------------------------------------------------------
// Inventory (item card)
// ---------------------------------------------------------------------------

export function mapInventory(raw) {
  if (!raw) return null;
  // Backend pakai 'nameInventory', frontend internal pakai 'name'.
  // Kedua-duanya didukung untuk kompatibilitas.
  const name = raw.name ?? raw.nameInventory ?? "";
  return {
    id: raw._id ?? raw.id,
    name,
    itemCode: raw.itemCode,
    category: raw.category, // 'ingredients' | 'packaging'
    unit: raw.unit,
    description: raw.description ?? "",
    isDeleted: raw.status === "deleted",
    quantityTotal: raw.quantityTotal ?? 0,
    totalSubInventory: raw.totalSubInventory ?? 0,
    lastCostBatch: raw.lastCostBatch ?? 0,
    createdAt: toDateOrNull(raw.createdAt),
    updatedAt: toDateOrNull(raw.updatedAt),
  };
}

export function mapInventoryDropdownItem(raw) {
  if (!raw) return null;

  const hasPricing = raw.lastCostPricePerBaseUnit != null;

  return {
    id: raw._id ?? raw.id,
    name: raw.name ?? raw.nameInventory ?? "",
    itemCode: raw.itemCode,
    category: raw.category,
    unit: raw.unit, // unit asli inventory, misal "kg"
    baseUnit: raw.baseUnit, // unit basis utk display/kalkulasi, misal "gr"
    lastCostBatch: raw.lastCostBatch,
    pricePerUnit: raw.lastCostPricePerUnit, // harga per kg/liter/pcs
    pricePerBaseUnit: raw.lastCostPricePerBaseUnit, // harga per gr/ml/pcs — dipakai form
    hasPricing, // false kalau item ini belum pernah punya batch
  };
}

/**
 * Hitung estimasi cost satu baris ingredient berdasarkan quantity yang
 * diketik user di form (dalam display unit / base unit — gr/ml/pcs),
 * dikalikan langsung dengan pricePerBaseUnit dari dropdown.
 *
 * Tidak perlu konversi tambahan di sini — backend sudah menormalkan
 * pricePerBaseUnit ke basis yang sama dengan apa yang diketik user
 * (lihat toDisplayQuantity / resolveIngredientsForSubmit).
 */
export function estimateIngredientCost(quantityDisplay, inventoryItem) {
  if (
    !inventoryItem ||
    !inventoryItem.hasPricing ||
    quantityDisplay == null ||
    Number.isNaN(Number(quantityDisplay))
  ) {
    return null;
  }
  return Number(quantityDisplay) * inventoryItem.pricePerBaseUnit;
}

export function mapInventoryList(rawResult) {
  // Backend mengembalikan { success, data: [...], pagination }.
  // 'items' adalah alias lama — 'data' adalah field aktual dari backend.
  const rawItems = rawResult?.items ?? rawResult?.data ?? [];
  return {
    items: rawItems.map(mapInventory),
    pagination: mapPagination(rawResult?.pagination),
  };
}

export function mapInventoryDetail(raw) {
  if (!raw) return null;
  return {
    ...mapInventory(raw),
    batches: (raw.batches ?? []).map(mapBatch),
  };
}

// ---------------------------------------------------------------------------
// SubInventory (batch)
// ---------------------------------------------------------------------------

export function mapBatch(raw) {
  if (!raw) return null;
  const daysUntilExpiry = raw.daysUntilExpiry ?? null;
  return {
    id: raw.id ?? raw._id,
    inventoryId: raw.inventoryId,
    batchCode: raw.batchCode,
    quantity: raw.quantity,
    costPrices: raw.costPrices,
    inDate: toDateOrNull(raw.inDate),
    expired: toDateOrNull(raw.expired),
    daysUntilExpiry,
    expiryStatus: deriveExpiryStatus(daysUntilExpiry), // 'none' | 'safe' | 'warning' | 'expired'
    status: raw.status, // 'active' | 'depleted' | 'expired' | 'deleted'
  };
}

export function mapBatchList(rawBatches) {
  return (rawBatches ?? []).map(mapBatch);
}

// ---------------------------------------------------------------------------
// History logs
// ---------------------------------------------------------------------------

export function mapHistorySubInventoryEntry(raw) {
  if (!raw) return null;
  return {
    id: raw._id ?? raw.id,
    inventoryId: raw.inventoryId,
    subInventoryId: raw.subInventoryId,
    nameInventory: raw.nameInventory ?? raw.name ?? "",
    itemCode: raw.itemCode,
    category: raw.category,
    unit: raw.unit,
    batchCode: raw.batchCode,
    quantity: raw.quantity,
    costPrices: raw.costPrices,
    inDate: toDateOrNull(raw.inDate),
    expired: toDateOrNull(raw.expired),
    createdAt: toDateOrNull(raw.createdAt),
  };
}

export function mapHistorySubInventoryList(rawResult) {
  return {
    items: (rawResult?.items ?? []).map(mapHistorySubInventoryEntry),
    pagination: mapPagination(rawResult?.pagination),
  };
}

export function mapHistoryUsageEntry(raw) {
  if (!raw) return null;
  return {
    id: raw._id ?? raw.id,
    inventoryId: raw.inventoryId,
    subInventoryId: raw.subInventoryId,
    nameInventory: raw.nameInventory ?? raw.name ?? "",
    batchCode: raw.batchCode,
    quantityUsed: raw.quantityUsed,
    costPriceUsed: raw.costPriceUsed,
    reference: raw.reference,
    availableUntil: toDateOrNull(raw.availableUntil),
    batchSafetyStatus: raw.batchSafetyStatus, // 'safe' | 'unsafe' | null
    isReversed: raw.isReversed,
    reversedAt: toDateOrNull(raw.reversedAt),
    createdAt: toDateOrNull(raw.createdAt),
  };
}

export function mapHistoryUsageList(rawResult) {
  return {
    items: (rawResult?.items ?? []).map(mapHistoryUsageEntry),
    pagination: mapPagination(rawResult?.pagination),
  };
}

// ---------------------------------------------------------------------------
// FEFO: check-availability / deduct / reverse
// ---------------------------------------------------------------------------

function mapEligibleBatch(raw) {
  return {
    subInventoryId: raw.subInventoryId,
    quantityTaken: raw.quantityTaken,
    expired: toDateOrNull(raw.expired),
    batchSafetyStatus: raw.batchSafetyStatus,
  };
}

export function mapCheckAvailabilityResult(raw) {
  if (!raw) return null;
  return {
    overallSufficient: raw.overallSufficient,
    overallHasUnsafeBatch: raw.overallHasUnsafeBatch,
    results: (raw.results ?? []).map((r) => ({
      inventoryId: r.inventoryId,
      nameInventory: r.nameInventory,
      unit: r.unit,
      quantityNeeded: r.quantityNeeded,
      sufficient: r.sufficient,
      availableQuantity: r.availableQuantity,
      shortfall: r.shortfall,
      hasUnsafeBatch: r.hasUnsafeBatch,
      eligibleBatches: (r.eligibleBatches ?? []).map(mapEligibleBatch),
    })),
  };
}

function mapDeductedBatch(raw) {
  return {
    subInventoryId: raw.subInventoryId,
    batchCode: raw.batchCode,
    quantityUsed: raw.quantityUsed,
    costPriceUsed: raw.costPriceUsed,
    batchSafetyStatus: raw.batchSafetyStatus,
    expired: toDateOrNull(raw.expired),
  };
}

export function mapDeductResult(raw) {
  if (!raw) return null;
  return {
    reference: raw.reference,
    historyUsageIds: raw.historyUsageIds ?? [],
    items: (raw.items ?? []).map((item) => ({
      inventoryId: item.inventoryId,
      nameInventory: item.nameInventory,
      unit: item.unit,
      quantityNeeded: item.quantityNeeded,
      batches: (item.batches ?? []).map(mapDeductedBatch),
    })),
  };
}

export function mapReverseDeductResult(raw) {
  if (!raw) return null;
  return {
    reference: raw.reference,
    reversedCount: raw.reversedCount,
  };
}

// ---------------------------------------------------------------------------
// Form values -> request payload
// ---------------------------------------------------------------------------

export function toCreateInventoryPayload(form) {
  return {
    name: form.name,
    itemCode: form.itemCode || undefined, // biar backend auto-derive kalau kosong
    category: form.category,
    unit: form.unit,
    description: form.description || "",
  };
}

export function toUpdateInventoryPayload(form) {
  const payload = {};
  if (form.name !== undefined) payload.name = form.name;
  if (form.description !== undefined) payload.description = form.description;
  return payload;
}

export function toAddBatchPayload(form) {
  return {
    quantity: Number(form.quantity),
    costPrices: Number(form.costPrices),
    inDate: form.inDate || undefined, // default ke now() di service kalau gak diisi
    expired: form.expired || undefined, // wajib diisi FE-side untuk category 'ingredients'
  };
}

/**
 * Mendukung dua bentuk form: single item (form.inventoryId + form.quantityNeeded)
 * atau multi item (form.items = [{inventoryId, amountNeeded}]) — cocok dengan
 * service.checkAvailability yang menerima keduanya.
 */
export function toCheckAvailabilityPayload(form) {
  if (form.items) {
    return {
      items: form.items.map((i) => ({
        inventoryId: i.inventoryId,
        amountNeeded: Number(i.amountNeeded),
      })),
      availableUntil: form.availableUntil || undefined,
    };
  }
  return {
    inventoryId: form.inventoryId,
    quantityNeeded: Number(form.quantityNeeded),
    availableUntil: form.availableUntil || undefined,
  };
}

export function toDeductPayload(form) {
  return {
    items: form.items.map((i) => ({
      inventoryId: i.inventoryId,
      amountNeeded: Number(i.amountNeeded),
    })),
    availableUntil: form.availableUntil || undefined,
    reference: form.reference || undefined,
  };
}

export function toReverseDeductPayload(form) {
  return {
    reference: form.reference,
  };
}
