import { useState, useCallback } from "react";
import { cancelPlan as apiCancelPlan } from "@/services/plan/plan.api";
import { mapCancelResult } from "@/services/plan/plan.mapper";

export function useCancelPlan(planId) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);

  const cancel = useCallback(async () => {
    setIsCancelling(true);
    setError(null);
    try {
      const response = await apiCancelPlan(planId);
      return mapCancelResult(response.data?.data);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsCancelling(false);
    }
  }, [planId]);

  return {
    cancel,
    isCancelling,
    error,
  };
}
