import { useState, useCallback } from "react";
import { updatePlan as apiUpdatePlan } from "@/services/plan/plan.api";
import { mapPlanSummary } from "@/services/plan/plan.mapper";

export function useUpdatePlan(planId) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(
    async (payload) => {
      setIsUpdating(true);
      setError(null);
      try {
        const response = await apiUpdatePlan(planId, payload);
        return mapPlanSummary(response.data?.data);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [planId],
  );

  return {
    update,
    isUpdating,
    error,
  };
}
