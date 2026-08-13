import api from "./api";

// ============================================================
// Inventory
// ============================================================

export const getInventoryList = (params) =>
  api.get('/inventory', { params });

export const createInventory = (payload) =>
  api.post('/inventory', payload);

export const getInventoryDetail = (id) =>
  api.get(`/inventory/${id}`);

export const archiveInventory = (id) =>
  api.delete(`/inventory/${id}`);