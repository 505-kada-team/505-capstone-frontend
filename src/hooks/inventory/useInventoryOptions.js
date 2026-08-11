import { useState, useCallback, useMemo } from "react";
import { getInventoryList } from "@/services/api";

export function useInventoryOptions() {
  const [inventories, setInventories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getInventoryList({ limit: 1000 });
      if (res.data.success) {
        setInventories(res.data.data);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Gagal mengambil daftar inventory",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const activeIngredients = useMemo(
    () => inventories.filter((i) => i.status === "active"),
    [inventories],
  );

  return { inventories, activeIngredients, isLoading, error, fetchInventories };
}
