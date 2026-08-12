import { useState, useEffect, useCallback } from "react";
import { menuApi } from "@/services/menu/menu.api";
import { mapMenuDetail } from "@/services/menu/menu.mapper";

export function useMenuDetail(id, { enabled = true } = {}) {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && id));
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await menuApi.detail(id);
      if (res.success) {
        setRecipe(mapMenuDetail(res.data));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal memuat detail resep",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!enabled || !id) return;
    fetchDetail();
  }, [enabled, id, fetchDetail]);

  return { recipe, isLoading, error, refetch: fetchDetail };
}
