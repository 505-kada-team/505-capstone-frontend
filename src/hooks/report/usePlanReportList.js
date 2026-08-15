import { useState, useEffect, useCallback } from "react";
import { planApi } from "@/services/report/report.api";
import { mapPlanReport } from "@/services/report/report.mapper";

export function usePlanReportList(initialParams = {}) {
  const [params, setParams] = useState(initialParams);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await planApi.listReports(params);
      // res.data berisi { success, data, meta? }
      const rawList = res.data?.data ?? res.data ?? [];
      const mapped = Array.isArray(rawList) ? rawList.map(mapPlanReport) : [];
      setReports(mapped);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports,
    params,
    setParams,
  };
}
