import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { planApi } from "@/services/plan/plan.api";
import { mapPlanListResponse } from "@/services/plan/plan.mapper";
import { getApiErrorMessage } from "@/lib/apiError";

/**
 * Data-fetching untuk daftar Plan (A2 - GET /plan).
 *
 * Tanggung jawab TUNGGAL: fetch + expose `{ plans, pagination }` yang sudah
 * ternormalisasi lewat plan.mapper. Filter/sort di sisi client (search box,
 * dropdown status, urutan tanggal) SENGAJA tidak ditaruh di sini -- itu
 * concern presentasi milik komponen (lihat useSortable), bukan concern
 * data-fetching. Kalau butuh filter server-side, cukup lempar lewat `params`.
 *
 * @param {{status?: string, search?: string, tags?: string, page?: number, limit?: number}} params
 */
export function usePlanList(params = {}) {
  const paramsKey = JSON.stringify(params);
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const envelope = await planApi.list(params);
      const { data, pagination: pg } = mapPlanListResponse(envelope);
      setPlans(data);
      setPagination(pg);
    } catch (err) {
      setError(err);
      toast.error(getApiErrorMessage(err, "Gagal memuat daftar plan"));
    } finally {
      setIsLoading(false);
    }
    // paramsKey (versi stabil dari params) sengaja jadi dependency, bukan
    // `params` mentah, supaya object literal baru di tiap render caller
    // tidak memicu refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, pagination, isLoading, error, refetch: fetchPlans };
}
