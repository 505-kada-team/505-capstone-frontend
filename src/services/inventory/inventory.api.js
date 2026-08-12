// src/features/inventory/api/inventory.api.js
//
// Layer ini cuma tanggung jawab manggil HTTP. TIDAK ADA transformasi data
// atau business logic di sini — itu tugas inventory.mapper.js. Tujuannya
// biar gampang di-mock waktu nulis test untuk hooks (tinggal mock objek
// `inventoryApi`, gak perlu mock axios).
//
// ASUMSI: sudah ada axios instance dengan baseURL '/api' dan interceptor
// refresh-token (in-memory access token + isRefreshing/queue) di
// '@/services/api'. Sesuaikan path import di bawah kalau beda.
//
// Semua fungsi resolve ke response envelope backend:
//   { success: boolean, data: <payload>, message: string }
// Unwrapping ke bentuk siap-pakai UI dilakukan di mapper, bukan di sini.

import api from "@/services/api";
import { inventoryEndpoints } from "./inventory.endpoints";

export const inventoryApi = {
  // --- Inventory (item card) ---

  create: (payload) =>
    api.post(inventoryEndpoints.create(), payload).then((res) => res.data),

  /**
   * /**
 * @param {{page?: number, limit?: number, inventoryId?: string, startDate?: string, endDate?: string}} params
   */
  list: (params) =>
    api.get(inventoryEndpoints.list(), { params }).then((res) => res.data),

  dropdown: () =>
    api.get(inventoryEndpoints.dropdown()).then((res) => res.data),

  detail: (id) =>
    api.get(inventoryEndpoints.detail(id)).then((res) => res.data),

  update: (id, payload) =>
    api.put(inventoryEndpoints.update(id), payload).then((res) => res.data),

  remove: (id) =>
    api.delete(inventoryEndpoints.remove(id)).then((res) => res.data),

  // --- SubInventory (batch) ---

  addBatch: (inventoryId, payload) =>
    api
      .post(inventoryEndpoints.addBatch(inventoryId), payload)
      .then((res) => res.data),

  listBatch: (inventoryId) =>
    api.get(inventoryEndpoints.listBatch(inventoryId)).then((res) => res.data),

  removeBatch: (subInventoryId) =>
    api
      .delete(inventoryEndpoints.removeBatch(subInventoryId))
      .then((res) => res.data),

  // --- Logs ---

  /**
   * /**
  * @param {{
  *   page?: number,
  *   limit?: number,
  *   inventoryId?: string,
  *   nameResponsible?: string,
  *   startDate?: string,
  *   endDate?: string
  * }} params
   */
  historySubInventory: (params) =>
    api
      .get(inventoryEndpoints.historySubInventory(), { params })
      .then((res) => res.data),

  /**
   * /**
  * @param {{
  *   page?: number,
  *   limit?: number,
  *   inventoryId?: string,
  *   planId?: string,
  *   startDate?: string,
  *   endDate?: string
  * }} params
   */
  historyUsage: (params) =>
    api
      .get(inventoryEndpoints.historyUsage(), { params })
      .then((res) => res.data),

  // --- FEFO ---

  checkAvailability: (payload) =>
    api
      .post(inventoryEndpoints.checkAvailability(), payload)
      .then((res) => res.data),

  deduct: (payload) =>
    api.post(inventoryEndpoints.deduct(), payload).then((res) => res.data),

  reverseDeduct: (payload) =>
    api
      .post(inventoryEndpoints.reverseDeduct(), payload)
      .then((res) => res.data),
};

export default inventoryApi;
