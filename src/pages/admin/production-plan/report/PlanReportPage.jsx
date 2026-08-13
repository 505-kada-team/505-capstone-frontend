import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Clock, Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import Pagination from "@/components/shared/Pagination";
import StatusBadge from "@/components/shared/StatusBadge";
import SearchInput from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//import { getPlanReportList } from '@/services/api';
import { planApi } from "@/services/plan/plan.api";
import { mapPlanReportList } from "@/services/plan/plan.mapper";
import { useSortable } from "@/hooks/useSortable";
import { usePagination } from "@/hooks/usePagination";

import ReviewReportModal from "./components/ReviewReportModal";
import ReplacementModal from "./components/ReplacementModal";
import AddReportModal from "./components/AddReportModal";

const LIMIT = 8;

export default function PlanReportPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sortBy, setSortBy } = useSortable("date_newest");

  // Filters state
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Modals state
  const [reviewReport, setReviewReport] = useState(null);
  const [replaceReport, setReplaceReport] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const params = {
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(filterCategory !== "all" && { category: filterCategory }),
      };

      console.log("[PLAN REPORT PARAMS]", params);

      const res = await planApi.listReports(params);

      console.log("[PLAN REPORT RESPONSE]", res);

      if (res.success) {
        setReports(mapPlanReportList(res.data));
      }
    } catch (error) {
      console.error("[PLAN REPORT ERROR]", error);
      console.error("[PLAN REPORT RESPONSE ERROR]", error.response?.data);

      toast.error(
        error.response?.data?.message ??
          error.message ??
          "Gagal mengambil daftar laporan",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterCategory]);

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return [...reports]
      .filter((report) => {
        if (!keyword) return true;

        return [report.nameRef, report.reason, report.reportedBy].some(
          (value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(keyword),
        );
      })
      .sort((a, b) => {
        const aDate = new Date(a.incidentAt).getTime();
        const bDate = new Date(b.incidentAt).getTime();

        return sortBy === "date_oldest" ? aDate - bDate : bDate - aDate;
      });
  }, [reports, search, sortBy]);

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedReports,
    setPage,
    resetPage,
  } = usePagination(filteredReports, LIMIT);

  useEffect(() => {
    resetPage();
  }, [search, sortBy, filterStatus, filterCategory, resetPage]);

  const columns = [
    {
      key: "incidentAt",
      header: "Date & Time",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">
            {new Date(row.incidentAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.incidentAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {row.isLateReport && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 px-1 py-0.5 rounded w-max">
              <Clock size={10} /> Late Report
            </span>
          )}
        </div>
      ),
    },
    {
      key: "item",
      header: "Category & Item",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold capitalize text-foreground">
            {row.category}
          </span>
          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
            {row.nameRef ?? row.refId}
          </span>
        </div>
      ),
    },
    {
      key: "quantityLost",
      header: "Quantity Lost",
      render: (row) => (
        <span className="font-semibold text-destructive">
          {row.quantityLost}
        </span>
      ),
    },
    {
      key: "reportedBy",
      header: "Reporter",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.reportedBy}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {row.reportedByRole}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const varMap = {
          pending: "low stock",
          approved: "active",
          rejected: "deleted",
        };
        return (
          <StatusBadge
            variant={varMap[row.status] || "deleted"}
            label={row.status}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      headerClass: "text-right",
      cellClass: "text-right",
      render: (row) => {
        if (row.status === "pending") {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReviewReport(row)}
            >
              Review
            </Button>
          );
        }

        const isTarikStok =
          row.category === "ingredient" &&
          row.status === "approved" &&
          !row.replacementDeducted;

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setReviewReport(row)}
            >
              Detail
            </Button>
            {isTarikStok && (
              <Button
                size="sm"
                variant="default"
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => setReplaceReport(row)}
              >
                Pull Stock
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      <PageHeader
        title="Plan Report"
        subtitle="Manage reports about ingredient stock incidents"
        action={
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2"
          >
            <Plus size={18} strokeWidth={2} /> Add Report
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <SearchInput
          id="report-search"
          placeholder="Search name or reason..."
          value={search}
          onChange={setSearch}
          className="w-full md:flex-[3] md:min-w-0 h-9"
        />

        <div className="flex flex-nowrap items-center gap-2 w-full md:w-auto md:flex-[4] md:min-w-0">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-[3] min-w-0 md:w-[130px] md:flex-none h-9 text-muted-foreground font-normal text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="flex-[4] min-w-0 md:w-[130px] md:flex-none h-9 text-muted-foreground font-normal text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Category</SelectItem>
              <SelectItem value="menu">Menu</SelectItem>
              <SelectItem value="ingredient">Ingredient</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-[3] min-w-0 md:w-[130px] md:flex-none h-9 text-muted-foreground font-normal text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel Laporan */}
      <div className="w-full min-w-[720px] rounded-lg border border-border bg-card shadow-sm overflow-x-auto mt-2">
        <DataTable
          columns={columns}
          data={paginatedReports}
          loading={isLoading}
          emptyMessage="No reports found. Click 'Add Report' to create a new report."
        />
      </div>

      {filteredReports.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPage={totalPages}
          totalData={filteredReports.length}
          limit={LIMIT}
          onPageChange={setPage}
        />
      )}

      <ReviewReportModal
        open={!!reviewReport}
        report={reviewReport}
        onClose={() => setReviewReport(null)}
        onRefresh={fetchData}
        readOnly={reviewReport?.status !== "pending"}
      />

      <ReplacementModal
        open={!!replaceReport}
        report={replaceReport}
        onClose={() => setReplaceReport(null)}
        onRefresh={fetchData}
      />

      <AddReportModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onRefresh={fetchData}
      />
    </div>
  );
}
