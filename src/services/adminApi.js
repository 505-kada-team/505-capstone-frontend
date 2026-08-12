import api from "./api";

// ============================================================
// Inventory
// ============================================================

export const getInventoryList = (params) =>
  api.get('/api/inventory', { params });

export const createInventory = (payload) =>
  api.post('/api/inventory', payload);

export const getInventoryDetail = (id) =>
  api.get(`/api/inventory/${id}`);

export const archiveInventory = (id) =>
  api.delete(`/api/inventory/${id}`);