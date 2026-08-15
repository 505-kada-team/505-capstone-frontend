import { useState, useCallback } from "react";
import { planApi } from "@/services/report/report.api";
import { mapPlanReport } from "@/services/report/report.mapper";

export function useCreatePlanReport() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (payload) => {
    setIsCreating(true);
    setError(null);
    try {
      const res = await planApi.createReport(payload);
      // res.data berisi { success, data, message? }
      const rawReport = res.data?.data ?? res.data;
      return mapPlanReport(rawReport);
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
