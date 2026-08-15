import { useState, useCallback } from "react";
import { approvePlan as apiApprovePlan } from "@/services/plan/plan.api";
import { mapApproveResult } from "@/services/plan/plan.mapper";

export function useApprovePlan(planId) {
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState(null);

  const approve = useCallback(async () => {
    setIsApproving(true);
    setError(null);
    try {
      const response = await apiApprovePlan(planId);
      return mapApproveResult(response.data?.data);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsApproving(false);
    }
  }, [planId]);

  return {
    approve,
    isApproving,
    error,
  };
}
