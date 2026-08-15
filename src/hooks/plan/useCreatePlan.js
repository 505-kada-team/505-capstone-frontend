import { useState, useCallback } from "react";
import { createPlan as apiCreatePlan } from "@/services/plan/plan.api";
import { mapPlanSummary } from "@/services/plan/plan.mapper";

export function useCreatePlan() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (payload) => {
    setIsCreating(true);
    setError(null);
    try {
      const response = await apiCreatePlan(payload);
      return mapPlanSummary(response.data?.data);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    create,
    isCreating,
    error,
  };
}
