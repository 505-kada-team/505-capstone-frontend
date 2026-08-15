import { useState, useCallback } from "react";
import { planApi } from "@/services/report/report.api";
import { mapPlanReport } from "@/services/report/report.mapper";

export function useReviewPlanReport(reportId) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState(null);

  const review = useCallback(
    async (payload) => {
      setIsReviewing(true);
      setError(null);
      try {
        const res = await planApi.reviewReport(reportId, payload);
        // res.data berisi { success, data, message? }
        const rawReport = res.data?.data ?? res.data;
        return mapPlanReport(rawReport);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsReviewing(false);
      }
    },
    [reportId],
  );

  return {
    review,
    isReviewing,
    error,
  };
}
