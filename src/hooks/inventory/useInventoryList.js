// src/features/inventory/hooks/useInventoryList.js

import { useState, useCallback } from "react";
import { inventoryApi } from "@/services/inventory/inventory.api";
import { mapInventoryList } from "@/services/inventory/inventory.mapper";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

/**
 * Query hook untuk daftar inventory (paginated + filter).
 *
 * PENTING — backend cuma nerima query { page, limit, category, search,
 * includeDeleted } (lihat validations/inventory.validation.js /
 * listInventoryQuery). Gak ada param `sort`. Kalau page butuh sorting,
 * itu HARUS dilakukan client-side terhadap `items` yang sudah didapat —
 * jangan kirim `sort` ke backend, bakal di-ignore atau malah 400
 * tergantung strictness validation middleware-nya.
 *
 * `category` juga harus persis enum backend: 'ingredients' | 'packaging'
 * (lowercase), bukan 'Ingredients'/'Packaging'.
 */
export function useInventoryList() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventoryList = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 10, category, search, includeDeleted } = params;
      const res = await inventoryApi.list({
        page,
        limit,
        ...(category && category !== "all" && { category }),
        ...(search && { search }),
        ...(includeDeleted && { includeDeleted }),
      });
      const mapped = mapInventoryList(res.data);
      setItems(mapped.items);
      setPagination(mapped.pagination ?? DEFAULT_PAGINATION);
      return mapped;
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "Gagal mengambil daftar inventory.",
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { items, pagination, isLoading, error, fetchInventoryList };
}

export default useInventoryList;
