// src/features/inventory/api/inventory.endpoints.js
//
// Satu-satunya tempat yang tahu bentuk URL inventory. Kalau backend route
// berubah (lihat routes/inventory.routes.js), cukup ubah di sini —
// inventory.api.js dan semua hooks di atasnya gak perlu disentuh.

const BASE = "/inventory";
const SUB_BASE = "/subinventory";

export const inventoryEndpoints = {
  // --- Inventory (item card) ---
  create: () => BASE,
  list: () => BASE,
  dropdown: () => `${BASE}/dropdown`,
  detail: (id) => `${BASE}/${id}`,
  update: (id) => `${BASE}/${id}`,
  remove: (id) => `${BASE}/${id}`,

  // --- SubInventory (batch) ---
  addBatch: (inventoryId) => `${BASE}/${inventoryId}/subinventory`,
  listBatch: (inventoryId) => `${BASE}/${inventoryId}/subinventory`,
  removeBatch: (subInventoryId) => `${SUB_BASE}/${subInventoryId}`,

  // --- Logs ---
  historySubInventory: () => "/history-sub-inventory",
  historyUsage: () => "/history-usage",

  // --- FEFO ---
  checkAvailability: () => `${SUB_BASE}/check-availability`,
  deduct: () => `${SUB_BASE}/deduct`,
  reverseDeduct: () => `${SUB_BASE}/deduct/reverse`,
};

export default inventoryEndpoints;
