import { useState, useCallback } from "react";
import { setMenuDiscount, deleteMenuDiscount } from "@/services/plan/plan.api";
import { mapDiscountResult } from "@/services/plan/plan.mapper";

export function usePlanDiscount(planId, menuId) {
  const [isSetting, setIsSetting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);

  const setDiscount = useCallback(
    async (payload) => {
      setIsSetting(true);
      setError(null);
      try {
        const response = await setMenuDiscount(planId, menuId, payload);
        return mapDiscountResult(response.data?.data);
      } catch (err) {
        console.error("Error set discount:", err);
        console.error("Response data:", err.response?.data);
        setError(err);
        throw err;
      } finally {
        setIsSetting(false);
      }
    },
    [planId, menuId],
  );

  const removeDiscount = useCallback(async () => {
    setIsRemoving(true);
    setError(null);
    try {
      const response = await deleteMenuDiscount(planId, menuId);
      return mapDiscountResult(response.data?.data);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsRemoving(false);
    }
  }, [planId, menuId]);

  return {
    setDiscount,
    removeDiscount,
    isSetting,
    isRemoving,
    error,
  };
}

/**
 * Hook khusus untuk menghapus diskon berdasarkan promo group.
 * Digunakan di PlanDetailModal.
 */
export function useDeletePlanPromo(planId, { onDeleted } = {}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const deletePromo = useCallback(
    async (menuIds) => {
      if (!planId) return;

      const ids = Array.isArray(menuIds) ? menuIds : [menuIds];
      if (ids.length === 0) return;

      setIsDeleting(true);
      setError(null);
      try {
        await Promise.all(ids.map((id) => deleteMenuDiscount(planId, id)));
        onDeleted?.();
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [planId, onDeleted],
  );

  return { isDeleting, deletePromo, error };
}
