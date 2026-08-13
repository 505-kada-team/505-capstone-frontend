import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import DataTable from "@/components/shared/DataTable";
import Pagination from "@/components/shared/Pagination";
import StatusBadge from "@/components/shared/StatusBadge";
import { usePagination } from "@/hooks/usePagination";
import { planApi } from "@/services/plan/plan.api";
import { mapPlanReportList } from "@/services/plan/plan.mapper";
import { formatCurrency } from "@/lib/formatCurrency";

const LIMIT = 8; // jumlah baris per halaman

export default function WasteReport({ startDate, endDate }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch & filter data ──────────────────────────────────────
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const res = await planApi.listReports();
        if (!res.success) {
          setReports([]);
          return;
        }

        const mappedReports = mapPlanReportList(res.data);
        const filteredReports = mappedReports.filter((report) => {
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

        setReports(filteredReports);
      } catch (error) {
        console.error("[WASTE REPORT ERROR]", error);
        toast.error(
          error.response?.data?.message ?? "Failed to load waste report",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [startDate, endDate]);

  // ── Pagination ──────────────────────────────────────────────
  const { currentPage, totalPages, paginatedItems, setPage, resetPage } =
    usePagination(reports, LIMIT);

  // Reset ke halaman pertama setiap kali filter berubah
  useEffect(() => {
    resetPage();
  }, [startDate, endDate, resetPage]);

  // ── Definisi kolom (tidak berubah) ─────────────────────────
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
          <span className="capitalize">{row.category ?? "—"}</span>
        ),
      },
      {
        key: "quantityLost",
        header: "Lost Quantity",
        render: (row) => (
          <span className="font-mono">{row.quantityLost ?? 0}</span>
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
              {formatCurrency(row.valuation.lostRevenueEstimate)}
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
          <span className="text-sm">{row.isLateReport ? "Yes" : "No"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) =>
          row.status ? <StatusBadge variant={row.status} /> : "—",
      },
    ],
    [],
  );

  // ── Render ──────────────────────────────────────────────────
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b p-6">
        <h2 className="text-lg font-semibold">Waste & Loss Report</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingredient and menu losses within the selected period.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Loading report...
        </div>
      ) : (
        <>
          {/* Container tabel dengan batas tinggi & scroll */}
          <div className="w-full min-w-0 overflow-auto max-h-[500px] p-0">
            <DataTable
              columns={columns}
              data={paginatedItems}
              emptyMessage="Tidak ada data waste & loss untuk periode ini"
            />
          </div>

          {/* Pagination */}
          {reports.length > 0 && (
            <div className="border-t p-4">
              <Pagination
                currentPage={currentPage}
                totalPage={totalPages}
                totalData={reports.length}
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
