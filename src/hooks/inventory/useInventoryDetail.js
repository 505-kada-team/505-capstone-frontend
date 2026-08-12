// src/features/inventory/hooks/useInventoryDetail.js

import { useState, useCallback } from "react";
import { inventoryApi } from "@/services/inventory/inventory.api";
import { mapInventoryDetail } from "@/services/inventory/inventory.mapper";

/**
 * Query hook untuk detail satu inventory (GET /inventory/:id) beserta
 * batch-nya (field `batches`, hasil gabungan lazyExpireBatches + toBatchDTO
 * di backend).
 *
 * `id` terakhir yang di-fetch disimpan di state internal supaya `refetch()`
 * bisa dipanggil tanpa parameter — berguna dipanggil ulang setelah mutation
 * (create batch / archive batch / update item) sukses.
 */
export function useInventoryDetail() {
  const [inventory, setInventory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastId, setLastId] = useState(null);

  const fetchInventoryDetail = useCallback(async (id) => {
    if (!id) return null;
    setIsLoading(true);
    setError(null);
    setLastId(id);
    try {
      const res = await inventoryApi.detail(id);
      const mapped = mapInventoryDetail(res.data);
      setInventory(mapped);
      return mapped;
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "Gagal memuat detail inventory.",
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (!lastId) return Promise.resolve(null);
    return fetchInventoryDetail(lastId);
  }, [lastId, fetchInventoryDetail]);

  /** Reset state — panggil pas modal detail ditutup, biar data lama gak sempet flash. */
  const reset = useCallback(() => {
    setInventory(null);
    setError(null);
    setLastId(null);
  }, []);

  return { inventory, isLoading, error, fetchInventoryDetail, refetch, reset };
}

export default useInventoryDetail;
