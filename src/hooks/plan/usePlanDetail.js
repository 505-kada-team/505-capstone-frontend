import { useState, useEffect, useCallback } from "react";
import {
  getPlanDetail,
  approvePlan,
  cancelPlan,
  stopPlan as apiStopPlan,
  checkAvailabilityPlan,
  setMenuDiscount,
  deleteMenuDiscount,
} from "@/services/plan/plan.api";
import { mapPlanDetail, mapDiscountResult } from "@/services/plan/plan.mapper";

/**
 * Hook untuk mengambil detail plan + menyediakan aksi:
 * - approve (A6)
 * - reject / cancel (A8)
 * - stop (A7)
 * - refreshAvailability (A5)
 * - setDiscount / removeDiscount (A9/A10)
 *
 * @param {string} planId
 * @param {Object} [options]
 * @param {Function} [options.onMutationSuccess] - dipanggil setelah operasi sukses.
 */
export function usePlanDetail(planId, { onMutationSuccess } = {}) {
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!planId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getPlanDetail(planId);
      const mapped = mapPlanDetail(response.data?.data);
      setPlan(mapped);
      return mapped;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (planId) {
      fetchDetail();
    } else {
      setPlan(null);
      setIsLoading(false);
    }
  }, [planId, fetchDetail]);

  const runMutation = useCallback(
    async (mutationFn) => {
      setIsMutating(true);
      setError(null);
      try {
        const result = await mutationFn();
        await fetchDetail();
        onMutationSuccess?.();
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchDetail, onMutationSuccess],
  );

  const approve = useCallback(
    () => runMutation(() => approvePlan(planId)),
    [runMutation, planId],
  );

  const reject = useCallback(
    () => runMutation(() => cancelPlan(planId)),
    [runMutation, planId],
  );

  const stop = useCallback(
    async (payload) => {
      if (!planId) return;
      setIsMutating(true);
      setError(null);
      try {
        const response = await apiStopPlan(planId, payload);
        await fetchDetail();
        onMutationSuccess?.();
        return { ok: true, data: response.data?.data };
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [planId, fetchDetail, onMutationSuccess],
  );

  const refreshAvailability = useCallback(async () => {
    if (!planId) return;
    setIsMutating(true);
    setError(null);
    try {
      const response = await checkAvailabilityPlan(planId);
      await fetchDetail();
      onMutationSuccess?.();
      return response.data?.data;
    } catch (err) {
      console.log("refreshAvailability planId:", planId);
      setError(err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [planId, fetchDetail, onMutationSuccess]);

  const setDiscount = useCallback(
    async (menuId, payload) => {
      if (!planId) return;
      setIsMutating(true);
      setError(null);
      try {
        const response = await setMenuDiscount(planId, menuId, payload);
        await fetchDetail();
        onMutationSuccess?.();
        return mapDiscountResult(response.data?.data);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [planId, fetchDetail, onMutationSuccess],
  );

  const removeDiscount = useCallback(
    async (menuId) => {
      if (!planId) return;
      setIsMutating(true);
      setError(null);
      try {
        const response = await deleteMenuDiscount(planId, menuId);
        await fetchDetail();
        onMutationSuccess?.();
        return mapDiscountResult(response.data?.data);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [planId, fetchDetail, onMutationSuccess],
  );

  return {
    plan,
    isLoading,
    isMutating,
    error,
    refetch: fetchDetail,
    approve,
    reject,
    stop,
    refreshAvailability,
    setDiscount,
    removeDiscount,
  };
}
