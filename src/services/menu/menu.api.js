/**
 * services/menu/menu.api.js
 *
 * Data source layer - Menu.
 * Tanggung jawab TUNGGAL: memanggil endpoint backend lewat instance Axios
 * yang sudah ada (`services/api.js`). Auth/bearer token sudah ditangani
 * interceptor di sana, jadi TIDAK diimplementasikan ulang di sini.
 *
 * File ini sengaja TIDAK melakukan normalisasi/transformasi response —
 * itu tugas `menu.mapper.js`. Dengan begitu setiap file punya satu alasan
 * untuk berubah (Single Responsibility Principle):
 *   - endpoint backend berubah        -> ubah file ini / menu.endpoints.js
 *   - bentuk response FE berubah      -> ubah menu.mapper.js
 *   - cara data dipakai di UI berubah -> ubah hooks/menu/*
 *
 * Setiap fungsi mengembalikan `response.data` mentah, yaitu envelope
 * ApiResponse dari backend (utils/ApiResponse.js), contoh untuk GET /menu:
 *   { data: [...], pagination: { totalData, totalPage, currentPage, limit } }
 */

import api from "../api";
import { menuEndpoints } from "./menu.endpoints";

export const menuApi = {
  /**
   * POST /menu
   * Body: { name, description?, image?, sellingPrice, ingredients: [{ inventoryId, quantityNeeded }] }
   */
  create: (payload) =>
    api.post(menuEndpoints.create(), payload).then((res) => res.data),

  /**
   * GET /menu
   * Query: { page?, limit?, includeDeleted?, search? }
   */
  list: (params) =>
    api.get(menuEndpoints.list(), { params }).then((res) => res.data),

  /** GET /menu/:id */
  detail: (id) => api.get(menuEndpoints.detail(id)).then((res) => res.data),

  /**
   * PUT /menu/:id
   * Body: subset dari { name, description, image, sellingPrice, ingredients }
   */
  update: (id, payload) =>
    api.put(menuEndpoints.update(id), payload).then((res) => res.data),

  /** DELETE /menu/:id (soft-delete / arsip) */
  remove: (id) => api.delete(menuEndpoints.remove(id)).then((res) => res.data),

  /**
   * GET /menu/dropdown
   * Query: { search? }
   */
  dropdown: (params) =>
    api.get(menuEndpoints.dropdown(), { params }).then((res) => res.data),
};
