import { useState, useEffect, useCallback } from "react";
import { getPlanList } from "@/services/plan/plan.api";
import { mapPlanListItem } from "@/services/plan/plan.mapper";

export function usePlanList() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Ambil data sebanyak mungkin (limit besar) karena komponen melakukan
      // filter & pagination sendiri di sisi client.
      const response = await getPlanList({ limit: 100 });

      const rawData = response.data?.data ?? [];
      const mappedPlans = rawData.map(mapPlanListItem);

      setPlans(mappedPlans);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    isLoading,
    error,
    refetch: fetchPlans,
  };
}
