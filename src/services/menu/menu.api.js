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

function buildMenuFormData(payload, imageFile) {
  const fd = new FormData();
  if (payload.name !== undefined) fd.append("name", payload.name);
  if (payload.description !== undefined)
    fd.append("description", payload.description);
  if (payload.sellingPrice !== undefined)
    fd.append("sellingPrice", payload.sellingPrice);
  if (payload.ingredients !== undefined) {
    // backend parseJsonFields('ingredients') expect ini sebagai JSON string
    fd.append("ingredients", JSON.stringify(payload.ingredients));
  }
  if (imageFile) fd.append("image", imageFile); // field name harus "image" — cocok sama uploadSingleImage('image')
  return fd;
}

export const menuApi = {
  /**
   * POST /menu
   * multipart/form-data: { name, description?, sellingPrice,
   *   ingredients: JSON string, image?: File }
   */
  create: (payload, imageFile) =>
    api
      .post(menuEndpoints.create(), buildMenuFormData(payload, imageFile), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data),
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
   * multipart/form-data: subset dari { name, description, sellingPrice,
   *   ingredients: JSON string, image?: File }
   */
  update: (id, payload, imageFile) =>
    api
      .put(menuEndpoints.update(id), buildMenuFormData(payload, imageFile), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data),

  /** DELETE /menu/:id (soft-delete / arsip) */
  remove: (id) => api.delete(menuEndpoints.remove(id)).then((res) => res.data),

  /**
   * GET /menu/dropdown
   * Query: { search? }
   */
  dropdown: (params) =>
    api.get(menuEndpoints.dropdown(), { params }).then((res) => res.data),
};
