// src/features/inventory/hooks/useInventoryMutations.js

import { useState, useCallback } from "react";
import { inventoryApi } from "@/features/inventory/api/inventory.api";
import {
  mapInventory,
  toCreateInventoryPayload,
  toUpdateInventoryPayload,
} from "@/features/inventory/api/inventory.mapper";

/**
 * Mutation hook untuk create / update / archive Inventory (item card).
 *
 * Tiap aksi punya loading & error state sendiri-sendiri (bukan satu state
 * digabung) — soalnya di DetailInventoryPage, tombol "Save Changes" (update)
 * dan tombol "Archive Item" (archive) ada di halaman yang sama, dan gak
 * boleh saling nge-disable satu sama lain cuma karena salah satu lagi
 * loading.
 *
 * CATATAN backend:
 * - `archiveInventory` (DELETE /inventory/:id) akan throw 409 kalau masih
 *   ada batch aktif dengan stok > 0 (§5.4 delete guard di service). Pesan
 *   errornya sudah otomatis kebawa lewat `archiveError`.
 * - `updateInventory` cuma terima `name` & `description` — `category` dan
 *   `unit` gak bisa diubah lewat endpoint ini (lihat toUpdateInventoryPayload
 *   di mapper, dan updateInventory() di service yang cuma nulis dua field
 *   itu). Kalau form edit masih render input category/unit sebagai
 *   editable, itu harus dikunci/disabled di komponen.
 */
export function useInventoryMutations() {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState(null);

  const createInventory = useCallback(async (form) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await inventoryApi.create(toCreateInventoryPayload(form));
      return mapInventory(res.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? "Gagal menyimpan inventory. Coba lagi.";
      setCreateError(msg);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateInventory = useCallback(async (id, form) => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const res = await inventoryApi.update(id, toUpdateInventoryPayload(form));
      return mapInventory(res.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? "Gagal memperbarui inventory.";
      setUpdateError(msg);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const archiveInventory = useCallback(async (id) => {
    setIsArchiving(true);
    setArchiveError(null);
    try {
      await inventoryApi.remove(id);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Gagal mengarsipkan item.";
      setArchiveError(msg);
      throw err;
    } finally {
      setIsArchiving(false);
    }
  }, []);

  return {
    createInventory,
    isCreating,
    createError,
    updateInventory,
    isUpdating,
    updateError,
    archiveInventory,
    isArchiving,
    archiveError,
  };
}

export default useInventoryMutations;
