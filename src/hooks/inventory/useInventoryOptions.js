import { useState, useCallback } from "react";
import { inventoryApi } from "@/services/inventory/inventory.api";
import { mapInventoryDropdownItem } from "@/services/inventory/inventory.mapper";

/**
 * GET /inventory/dropdown -> dropdownInventory() di inventory.service.js
 * sudah filter status:'active' di level query (bukan asumsi FE), dan
 * sengaja hanya select _id/name/itemCode/category/unit — tidak ada
 * lastCostBatch, jadi cost estimate tidak bisa dihitung dari data ini.
 */
export function useInventoryOptions() {
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventoryOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.dropdown();
      if (res.success) {
        setInventoryOptions((res.data ?? []).map(mapInventoryDropdownItem));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Gagal mengambil daftar inventory",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { inventoryOptions, isLoading, error, fetchInventoryOptions };
}
