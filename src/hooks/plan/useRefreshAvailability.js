import { useState, useCallback } from "react";
import { checkAvailabilityPlan } from "@/services/plan/plan.api";
export function useRefreshAvailability(planId) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await checkAvailabilityPlan(planId);
      return response.data?.data; // bentuk sesuai A5
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  }, [planId]);

  return {
    refresh,
    isRefreshing,
    error,
  };
}
