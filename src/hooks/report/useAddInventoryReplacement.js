import { useState, useCallback } from "react";
import { planApi } from "@/services/report/report.api";
import { mapPlanReport } from "@/services/report/report.mapper";

export function useAddInventoryReplacement(reportId) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const addInventory = useCallback(
    async (payload) => {
      setIsAdding(true);
      setError(null);
      try {
        const res = await planApi.addReportInventory(reportId, payload);
        // res.data berisi { success, data, message? }
        const rawReport = res.data?.data ?? res.data;
        return mapPlanReport(rawReport);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsAdding(false);
      }
    },
    [reportId],
  );

  return {
    addInventory,
    isAdding,
    error,
  };
}
