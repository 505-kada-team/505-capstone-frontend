import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import DataTable from "@/components/shared/DataTable";
import { useProductionPlanReport } from "@/hooks/report/useProductionPlanReport";

export default function ProductionPlanReport({
  startDate = "",
  endDate = "",
}) {
  const {
    data,
    isLoading,
    error,
  } = useProductionPlanReport({
    startDate,
    endDate,
  });

  useEffect(() => {
    if (!error) return;

    console.error("[PRODUCTION PLAN REPORT ERROR]", error);

    toast.error(
      error.response?.data?.message ??
        "Failed to load production plan report",
    );
  }, [error]);

  const completedPlans = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .filter((plan) => plan.status === "stopped")
      .sort(
        (a, b) =>
          new Date(b.endDate || b.startDate || 0) -
          new Date(a.endDate || a.startDate || 0),
      );
  }, [data]);

  const summary = useMemo(() => {
    const totalPlans = completedPlans.length;

    const totalPlanned = completedPlans.reduce(
      (total, plan) =>
        total + Number(plan.plannedQuantity || 0),
      0,
    );

    const totalSold = completedPlans.reduce(
      (total, plan) =>
        total + Number(plan.soldQuantity || 0),
      0,
    );

    const totalLost = completedPlans.reduce(
      (total, plan) =>
        total + Number(plan.lostQuantity || 0),
      0,
    );

    const totalProcessed = totalSold + totalLost;

    const completionRate =
      totalPlanned > 0
        ? (totalProcessed / totalPlanned) * 100
        : 0;

    return {
      totalPlans,
      totalPlanned,
      totalSold,
      totalLost,
      completionRate,
    };
  }, [completedPlans]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Plan",
        render: (row) => (
          <div>
            <p className="font-medium text-foreground">
              {row.name ?? "—"}
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.totalMenu ?? 0} menus
            </p>
          </div>
        ),
      },
      {
        key: "period",
        header: "Period",
        render: (row) => {
          const start = row.startDate
            ? new Date(row.startDate)
                .toISOString()
                .slice(0, 10)
            : "—";

          const end = row.endDate
            ? new Date(row.endDate)
                .toISOString()
                .slice(0, 10)
            : "—";

          return `${start} — ${end}`;
        },
      },
      {
        key: "plannedQuantity",
        header: "Planned",
        render: (row) => (
          <span className="font-mono">
            {Number(
              row.plannedQuantity || 0,
            ).toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        key: "soldQuantity",
        header: "Sold",
        render: (row) => (
          <span className="font-mono">
            {Number(
              row.soldQuantity || 0,
            ).toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        key: "lostQuantity",
        header: "Lost",
        render: (row) => (
          <span className="font-mono">
            {Number(
              row.lostQuantity || 0,
            ).toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        key: "remainingQuantity",
        header: "Remaining",
        render: (row) => (
          <span className="font-mono">
            {Number(
              row.remainingQuantity || 0,
            ).toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        key: "completion",
        header: "Completion",
        render: (row) => {
          const planned = Number(
            row.plannedQuantity || 0,
          );

          const sold = Number(
            row.soldQuantity || 0,
          );

          const lost = Number(
            row.lostQuantity || 0,
          );

          const completion =
            planned > 0
              ? ((sold + lost) / planned) * 100
              : 0;

          return (
            <span className="font-mono font-medium">
              {completion.toFixed(1)}%
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-4 divide-x rounded-lg border border-border bg-card">
        <SummaryItem
          label="Completed Plans"
          value={summary.totalPlans}
        />

        <SummaryItem
          label="Planned Quantity"
          value={summary.totalPlanned.toLocaleString("id-ID")}
        />

        <SummaryItem
          label="Sold Quantity"
          value={summary.totalSold.toLocaleString("id-ID")}
        />

        <SummaryItem
          label="Lost Quantity"
          value={summary.totalLost.toLocaleString("id-ID")}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Production Plan Report
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Performance of completed production plans within
              the selected period.
            </p>
          </div>

          {completedPlans.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                Overall Completion
              </p>

              <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                {summary.completionRate.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        <DataTable
          columns={columns}
          data={completedPlans}
          loading={isLoading}
          emptyMessage="No completed production plans found for the selected period."
        />

      </section>
    </div>
  );
}

function SummaryItem({
  label,
  description,
  value,
}) {
  return (
    <div className="p-5">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xs text-muted-foreground/80">
        {description}
      </p>

      <p className="mt-3 text-lg font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}