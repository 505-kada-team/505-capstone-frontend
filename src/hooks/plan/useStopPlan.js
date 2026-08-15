import { useState, useCallback } from "react";
import { stopPlan as apiStopPlan } from "@/services/plan/plan.api";
import { mapStopResult } from "@/services/plan/plan.mapper";

export function useStopPlan(planId) {
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState(null);

  const stop = useCallback(
    async (payload) => {
      setIsStopping(true);
      setError(null);
      try {
        const response = await apiStopPlan(planId, payload);
        return mapStopResult(response.data?.data);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsStopping(false);
      }
    },
    [planId],
  );

  return {
    stop,
    isStopping,
    error,
  };
}
