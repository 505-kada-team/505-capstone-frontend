import { useEffect, useMemo, useState } from "react";
import { getPlanList, getPlanDetail } from "@/services/plan/plan.api";

export function useProductionPlanReport({ startDate = "", endDate = "" } = {}) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const listRes = await getPlanList({ limit: 100 });
        const rawPlans = listRes?.data?.data ?? [];

        const filteredPlans = rawPlans.filter((plan) => {
          if (!plan.startDate || !plan.endDate) return false;

          const planStart = new Date(plan.startDate);
          const planEnd = new Date(plan.endDate);

          const filterStart = startDate
            ? new Date(`${startDate}T00:00:00`)
            : null;
          const filterEnd = endDate ? new Date(`${endDate}T23:59:59`) : null;

          if (filterStart && planEnd < filterStart) return false;
          if (filterEnd && planStart > filterEnd) return false;

          return true;
        });

        const details = await Promise.all(
          filteredPlans.map(async (plan) => {
            const planId = plan._id ?? plan.id;
            if (!planId) return null;

            const detailRes = await getPlanDetail(planId);
            const detail = detailRes?.data?.data;
            if (!detail) return null;

            const menus = Array.isArray(detail.menus) ? detail.menus : [];

            const plannedQuantity = menus.reduce(
              (sum, menu) => sum + Number(menu.quantityPlanned || 0),
              0,
            );
            const soldQuantity = menus.reduce(
              (sum, menu) => sum + Number(menu.soldQuantity || 0),
              0,
            );
            const lostQuantity = menus.reduce(
              (sum, menu) => sum + Number(menu.lossQuantity || 0),
              0,
            );
            const remainingQuantity = menus.reduce((sum, menu) => {
              if (menu.remainingQuantity != null) {
                return sum + Number(menu.remainingQuantity);
              }
              const remaining =
                Number(menu.quantityPlanned || 0) -
                Number(menu.soldQuantity || 0) -
                Number(menu.lossQuantity || 0);
              return sum + Math.max(remaining, 0);
            }, 0);

            return {
              id: detail._id ?? planId,
              name: detail.name ?? plan.name ?? "—",
              status: detail.status ?? plan.status ?? null,
              startDate: detail.startDate ?? plan.startDate ?? null,
              endDate: detail.endDate ?? plan.endDate ?? null,
              totalMenu: menus.length || plan.totalMenu || 0,
              plannedQuantity,
              soldQuantity,
              lostQuantity,
              remainingQuantity,
              hasUnsafeBatch: plan.hasUnsafeBatch ?? false,
              hasActiveDiscount: plan.hasActiveDiscount ?? false,
              hasPendingLossReplacement:
                detail.hasPendingLossReplacement ??
                plan.hasPendingLossReplacement ??
                false,
            };
          }),
        );

        if (isActive) {
          setData(details.filter(Boolean));
        }
      } catch (err) {
        if (isActive) setError(err);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchReport();

    return () => {
      isActive = false;
    };
  }, [startDate, endDate]);

  const summary = useMemo(() => {
    const totalPlans = data.length;
    const totalPlanned = data.reduce(
      (sum, plan) => sum + Number(plan.plannedQuantity || 0),
      0,
    );
    const totalSold = data.reduce(
      (sum, plan) => sum + Number(plan.soldQuantity || 0),
      0,
    );
    const totalLost = data.reduce(
      (sum, plan) => sum + Number(plan.lostQuantity || 0),
      0,
    );

    return { totalPlans, totalPlanned, totalSold, totalLost };
  }, [data]);

  return { data, isLoading, error, summary };
}
