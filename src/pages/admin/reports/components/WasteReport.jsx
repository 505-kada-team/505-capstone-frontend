import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import DataTable from "@/components/shared/DataTable";
import Pagination from "@/components/shared/Pagination";
import StatusBadge from "@/components/shared/StatusBadge";
import { usePagination } from "@/hooks/usePagination";
import { usePlanReportList } from "@/hooks/report/usePlanReportList";
import { formatCurrency } from "@/lib/formatCurrency";

const LIMIT = 8;

export default function WasteReport({
  planId,
  startDate,
  endDate,
  onExportDataChange,
}) {
  // ── Fetch data via hook ─────────────────────────────────────
  const { reports: allReports, isLoading, error } = usePlanReportList();

  // ── Filter client-side berdasarkan plan & tanggal ───────────
  const filteredReports = useMemo(() => {
    return allReports.filter((report) => {
      if (planId && report.planId !== planId) {
        return false;
      }

      if (!report.incidentAt) return false;

      const incidentDate = new Date(report.incidentAt);

      if (startDate && incidentDate < new Date(`${startDate}T00:00:00`)) {
        return false;
      }

      if (endDate && incidentDate > new Date(`${endDate}T23:59:59`)) {
        return false;
      }

      return true;
    });
  }, [allReports, planId, startDate, endDate]);

  // ── Pagination ──────────────────────────────────────────────
  const {
    currentPage,
    totalPages,
    paginatedItems,
    setPage,
    resetPage,
  } = usePagination(filteredReports, LIMIT);

  useEffect(() => {
    resetPage();
  }, [planId, startDate, endDate, resetPage]);

  // ── Error handling ─────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error(
        error.response?.data?.message ??
          "Failed to load waste report",
      );
    }
  }, [error]);

  // ── Definisi kolom ─────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: "incidentAt",
        header: "Incident Date",
        render: (row) =>
          row.incidentAt
            ? new Date(row.incidentAt).toISOString().slice(0, 10)
            : "—",
      },
      {
        key: "nameRef",
        header: "Item",
        render: (row) => row.nameRef ?? "—",
      },
      {
        key: "category",
        header: "Category",
        render: (row) => (
          <span className="capitalize">
            {row.category ?? "—"}
          </span>
        ),
      },
      {
        key: "quantityLost",
        header: "Lost Quantity",
        render: (row) => (
          <span className="font-mono">
            {row.quantityLost ?? 0}
          </span>
        ),
      },
      {
        key: "costLoss",
        header: "Cost Loss",
        render: (row) =>
          row.valuation?.costLoss != null ? (
            <span className="font-mono">
              {formatCurrency(row.valuation.costLoss)}
            </span>
          ) : (
            "—"
          ),
      },
      {
        key: "lostRevenue",
        header: "Lost Revenue",
        render: (row) =>
          row.valuation?.lostRevenueEstimate != null ? (
            <span className="font-mono">
              {formatCurrency(
                row.valuation.lostRevenueEstimate,
              )}
            </span>
          ) : (
            "—"
          ),
      },
      {
        key: "replacementCost",
        header: "Replacement Cost",
        render: (row) =>
          row.replacementCost != null ? (
            <span className="font-mono">
              {formatCurrency(row.replacementCost)}
            </span>
          ) : (
            "—"
          ),
      },
      {
        key: "isLateReport",
        header: "Late Report",
        render: (row) => (
          <span className="text-sm">
            {row.isLateReport ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) =>
          row.status ? (
            <StatusBadge variant={row.status} />
          ) : (
            "—"
          ),
      },
    ],
    [],
  );

  // ── Export CSV data ────────────────────────────────────────
  useEffect(() => {
    onExportDataChange?.({
      filename: "waste-loss-report",
      columns: [
        { key: "incidentDate", label: "Incident Date" },
        { key: "item", label: "Item" },
        { key: "category", label: "Category" },
        { key: "lostQuantity", label: "Lost Quantity" },
        { key: "costLoss", label: "Cost Loss" },
        { key: "lostRevenue", label: "Lost Revenue" },
        {
          key: "replacementCost",
          label: "Replacement Cost",
        },
        { key: "lateReport", label: "Late Report" },
        { key: "status", label: "Status" },
      ],
      rows: filteredReports.map((report) => ({
        incidentDate: report.incidentAt
          ? new Date(report.incidentAt)
              .toISOString()
              .slice(0, 10)
          : "",
        item: report.nameRef ?? "",
        category: report.category ?? "",
        lostQuantity: report.quantityLost ?? 0,
        costLoss: report.valuation?.costLoss ?? 0,
        lostRevenue:
          report.valuation?.lostRevenueEstimate ?? 0,
        replacementCost: report.replacementCost ?? "",
        lateReport: report.isLateReport ? "Yes" : "No",
        status: report.status ?? "",
      })),
    });
  }, [filteredReports, onExportDataChange]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b p-6">
        <h2 className="text-lg font-semibold">
          Waste & Loss Report
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Ingredient and menu losses within the selected
          period.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Loading report...
        </div>
      ) : (
        <>
          <div className="max-h-[500px] w-full min-w-0 overflow-auto p-0">
            <DataTable
              columns={columns}
              data={paginatedItems}
              emptyMessage="No waste & loss data found for the selected filters."
            />
          </div>

          {filteredReports.length > 0 && (
            <div className="border-t p-4">
              <Pagination
                currentPage={currentPage}
                totalPage={totalPages}
                totalData={filteredReports.length}
                limit={LIMIT}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}