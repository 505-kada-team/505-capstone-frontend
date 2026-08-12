import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { planApi } from '@/services/plan/plan.api';

export default function ProductionPlanReport({ startDate = '', endDate = '' }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchReport = async () => {
      setIsLoading(true);

      try {
        const listRes = await planApi.list();

        if (!listRes?.success) {
          if (isActive) setData([]);
          return;
        }

        const plans = Array.isArray(listRes.data) ? listRes.data : [];

        // Plan masuk report jika periodenya overlap dengan filter report.
        const filteredPlans = plans.filter((plan) => {
          if (!plan.startDate || !plan.endDate) return false;

          const planStart = new Date(plan.startDate);
          const planEnd = new Date(plan.endDate);

          const filterStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
          const filterEnd = endDate ? new Date(`${endDate}T23:59:59`) : null;

          if (filterStart && planEnd < filterStart) return false;
          if (filterEnd && planStart > filterEnd) return false;

          return true;
        });

        const details = await Promise.all(
          filteredPlans.map(async (plan) => {
            const planId = plan._id ?? plan.id;

            if (!planId) return null;

            const detailRes = await planApi.detail(planId);

            if (!detailRes?.success || !detailRes?.data) return null;

            const detail = detailRes.data;
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
              name: detail.name ?? plan.name ?? '—',
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
      } catch (error) {
        console.error('[PRODUCTION PLAN REPORT ERROR]', error);
        console.error('[PRODUCTION PLAN REPORT RESPONSE]', error.response?.data);

        if (isActive) {
          setData([]);

          toast.error(
            error.response?.data?.message ??
              'Failed to load production plan report',
          );
        }
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

    return {
      totalPlans,
      totalPlanned,
      totalSold,
      totalLost,
    };
  }, [data]);

const columns = useMemo(
  () => [
    {
      key: 'name',
      header: 'Plan',
      render: (row) => row.name ?? '—',
    },
    {
      key: 'period',
      header: 'Period',
      render: (row) => {
        const start = row.startDate
          ? new Date(row.startDate).toISOString().slice(0, 10)
          : '—';

        const end = row.endDate
          ? new Date(row.endDate).toISOString().slice(0, 10)
          : '—';

        return `${start} — ${end}`;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.status ? <StatusBadge variant={row.status} /> : '—',
    },
    {
      key: 'totalMenu',
      header: 'Menus',
      render: (row) => (
        <span className="font-mono">{row.totalMenu ?? 0}</span>
      ),
    },
    {
      key: 'plannedQuantity',
      header: 'Planned',
      render: (row) => (
        <span className="font-mono">{row.plannedQuantity ?? 0}</span>
      ),
    },
    {
      key: 'soldQuantity',
      header: 'Sold',
      render: (row) => (
        <span className="font-mono">{row.soldQuantity ?? 0}</span>
      ),
    },
    {
      key: 'lostQuantity',
      header: 'Lost',
      render: (row) => (
        <span className="font-mono">{row.lostQuantity ?? 0}</span>
      ),
    },
    {
      key: 'remainingQuantity',
      header: 'Remaining',
      render: (row) => (
        <span className="font-mono">{row.remainingQuantity ?? 0}</span>
      ),
    },
    {
      key: 'hasUnsafeBatch',
      header: 'Batch Safety',
      render: (row) =>
        row.hasUnsafeBatch ? (
          <span className="rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
            Unsafe
          </span>
        ) : (
          <span className="text-muted-foreground">Safe</span>
        ),
    },
    {
      key: 'hasActiveDiscount',
      header: 'Discount',
      render: (row) =>
        row.hasActiveDiscount ? (
          <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
            Active
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ],
  [],
);
  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-4 divide-x rounded-lg border border-border bg-card">
        <SummaryItem label="Total Plans" value={summary.totalPlans} />
        <SummaryItem label="Planned Quantity" value={summary.totalPlanned} />
        <SummaryItem label="Sold Quantity" value={summary.totalSold} />
        <SummaryItem label="Lost Quantity" value={summary.totalLost} />
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Production Plan Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Production plan performance within the selected period.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading production plan report...
          </div>
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </section>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}