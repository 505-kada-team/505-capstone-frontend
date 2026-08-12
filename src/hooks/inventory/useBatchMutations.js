// src/features/inventory/hooks/useBatchMutations.js

import { useState, useCallback } from "react";
import { inventoryApi } from "@/features/inventory/api/inventory.api";
import {
  mapBatch,
  toAddBatchPayload,
} from "@/features/inventory/api/inventory.mapper";

/**
 * Mutation hook untuk SubInventory (batch): tambah & arsipkan.
 *
 * CATATAN PENTING soal field yang TIDAK ada di backend:
 * SubInventory schema (models/inventory/subInventory.model.js) cuma
 * punya: inventoryId, batchCode, quantity, costPrices, inDate, expired,
 * status. Gak ada `nameResponsible` (dipakai AddBatchModal lama sebagai
 * default 'Admin') dan gak ada `deletedBy` / `reason` (dipakai
 * DetailInventoryModal/Page lama waktu archive batch). addSubInventory()
 * dan deleteSubInventory() di service juga gak baca field-field itu sama
 * sekali. Karena backend gak akan disesuaikan, field-field itu HARUS
 * dihapus dari:
 *   - addSubInventorySchema (Zod) — hapus `nameResponsible`
 *   - payload yang dikirim AddBatchModal — jangan set default 'Admin' lagi
 *   - pemanggilan archive batch di Detail page — cukup kirim id, tanpa
 *     { deletedBy, reason }
 * Kalau butuh audit "siapa yang archive batch ini", itu harus dari
 * `req.user` di backend (pola yang sama kayak cashierName/reportedBy di
 * modul Selling/Plan Report), bukan dikirim dari client.
 */
export function useBatchMutations() {
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [addBatchError, setAddBatchError] = useState(null);

  const [isArchivingBatch, setIsArchivingBatch] = useState(false);
  const [archiveBatchError, setArchiveBatchError] = useState(null);

  const addBatch = useCallback(async (inventoryId, form) => {
    setIsAddingBatch(true);
    setAddBatchError(null);
    try {
      const res = await inventoryApi.addBatch(
        inventoryId,
        toAddBatchPayload(form),
      );
      return mapBatch(res.data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? "Gagal menyimpan batch. Coba lagi.";
      setAddBatchError(msg);
      throw err;
    } finally {
      setIsAddingBatch(false);
    }
  }, []);

  const archiveBatch = useCallback(async (subInventoryId) => {
    setIsArchivingBatch(true);
    setArchiveBatchError(null);
    try {
      await inventoryApi.removeBatch(subInventoryId);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Gagal menghapus batch.";
      setArchiveBatchError(msg);
      throw err;
    } finally {
      setIsArchivingBatch(false);
    }
  }, []);

  return {
    addBatch,
    isAddingBatch,
    addBatchError,
    archiveBatch,
    isArchivingBatch,
    archiveBatchError,
  };
}

export default useBatchMutations;
