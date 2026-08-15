import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { useProductionPlanReport } from "@/hooks/report/useProductionPlanReport";

export default function ProductionPlanReport({ startDate = "", endDate = "" }) {
  const { data, isLoading, error, summary } = useProductionPlanReport({
    startDate,
    endDate,
  });

  useEffect(() => {
    if (error) {
      console.error("[PRODUCTION PLAN REPORT ERROR]", error);
      toast.error(
        error.response?.data?.message ??
          "Failed to load production plan report",
      );
    }
  }, [error]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Plan",
        render: (row) => row.name ?? "—",
      },
      {
        key: "period",
        header: "Period",
        render: (row) => {
          const start = row.startDate
            ? new Date(row.startDate).toISOString().slice(0, 10)
            : "—";
          const end = row.endDate
            ? new Date(row.endDate).toISOString().slice(0, 10)
            : "—";
          return `${start} — ${end}`;
        },
      },
      {
        key: "status",
        header: "Status",
        render: (row) =>
          row.status ? <StatusBadge variant={row.status} /> : "—",
      },
      {
        key: "totalMenu",
        header: "Menus",
        render: (row) => (
          <span className="font-mono">{row.totalMenu ?? 0}</span>
        ),
      },
      {
        key: "plannedQuantity",
        header: "Planned",
        render: (row) => (
          <span className="font-mono">{row.plannedQuantity ?? 0}</span>
        ),
      },
      {
        key: "soldQuantity",
        header: "Sold",
        render: (row) => (
          <span className="font-mono">{row.soldQuantity ?? 0}</span>
        ),
      },
      {
        key: "lostQuantity",
        header: "Lost",
        render: (row) => (
          <span className="font-mono">{row.lostQuantity ?? 0}</span>
        ),
      },
      {
        key: "remainingQuantity",
        header: "Remaining",
        render: (row) => (
          <span className="font-mono">{row.remainingQuantity ?? 0}</span>
        ),
      },
      {
        key: "hasUnsafeBatch",
        header: "Batch Safety",
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
        key: "hasActiveDiscount",
        header: "Discount",
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
