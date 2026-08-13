import { useState, useMemo } from "react";
import {
  RefreshCw,
  PlusCircle,
  ClipboardList,
  ArrowUpDown,
} from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import PlanListCard from "@/components/shared/PlanListCard";
import Pagination from "@/components/shared/Pagination";
import PlanDetailPane from "@/pages/admin/production-plan/components/PlanDetailPane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlanList } from "@/hooks/plan/usePlanList";
import { usePagination } from "@/hooks/usePagination";

const PAGE_SIZE = 6;

function RightPaneEmpty() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground select-none py-24">
      <ClipboardList
        className="w-10 h-10 text-muted-foreground/40"
        strokeWidth={1.5}
      />
      <p className="text-sm">Select a plan from the list to view details</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-muted/30 h-[68px]"
        />
      ))}
    </div>
  );
}

export default function PlanHistoryView({ onNavigateToCreate }) {
  const { plans, isLoading: isLoadingList, refetch } = usePlanList();
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const filteredPlans = useMemo(() => {
    const result = plans.filter((plan) => {
      const matchSearch = plan.name
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "all" || plan.status === filterStatus;
      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.startDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.startDate || 0).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [plans, search, filterStatus, sortOrder]);

  const {
    currentPage,
    totalPages,
    paginatedItems: pagedPlans,
    setPage,
    resetPage,
  } = usePagination(filteredPlans, PAGE_SIZE);

  const handleSearchChange = (value) => {
    setSearch(value);
    resetPage();
  };
  const handleFilterChange = (value) => {
    setFilterStatus(value);
    resetPage();
  };
  const handleSortChange = (value) => {
    setSortOrder(value);
    resetPage();
  };
  const handleSelectPlan = (id) => setSelectedPlanId(id);
  const handleReload = () => refetch();

  return (
    // Desktop: tinggi pasti agar halaman tidak ikut scroll
    <div className="flex flex-col gap-6 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      <PageHeader
        title="Draft Plan"
        subtitle="Review and manage past production plans."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleReload}
              disabled={isLoadingList}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingList ? "animate-spin" : ""}`}
              />
              Reload
            </Button>
            <Button
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2 font-medium"
              onClick={onNavigateToCreate}
            >
              <PlusCircle className="w-4 h-4" />
              Create Plan
            </Button>
          </div>
        }
      />

      {/* Row flex mengambil sisa tinggi setelah header */}
      <div className="flex gap-6 flex-col lg:flex-row lg:flex-1 lg:min-h-0">
        {/* ── Left Sidebar ─────────────────────────────────────────── */}
        <aside className="w-full lg:w-96 shrink-0 flex flex-col lg:h-full overflow-hidden">
          {/* Header & filter – tetap di atas */}
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold font-heading">
                Plan History
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              <Input
                placeholder="Search plan..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-8 text-sm"
              />

              <div className="flex items-center justify-between gap-2">
                <Select value={filterStatus} onValueChange={handleFilterChange}>
                  <SelectTrigger className="h-8 text-xs text-muted-foreground flex-1">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="stopped">Stopped</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={handleSortChange}>
                  <SelectTrigger className="h-8 text-xs text-muted-foreground gap-1 flex-1">
                    <ArrowUpDown className="w-3 h-3 shrink-0" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Daftar plan – scroll internal, memenuhi sisa ruang */}
          <div className="flex flex-col gap-2 mt-4 flex-1 min-h-0 overflow-y-auto -mr-1 pr-1">
            {isLoadingList ? (
              <ListSkeleton />
            ) : pagedPlans.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <ClipboardList
                  className="w-8 h-8 text-muted-foreground/40"
                  strokeWidth={1.5}
                />
                <p className="text-xs text-center">No plans found</p>
              </div>
            ) : (
              pagedPlans.map((plan) => (
                <PlanListCard
                  key={plan._id}
                  plan={plan}
                  isSelected={plan._id === selectedPlanId}
                  onClick={handleSelectPlan}
                />
              ))
            )}
          </div>

          {/* Pagination – tetap di bawah, tidak ikut scroll */}
          <div className="shrink-0  pt-2">
            <Pagination
              currentPage={currentPage}
              totalPage={totalPages}
              totalData={filteredPlans.length}
              limit={PAGE_SIZE}
              onPageChange={setPage}
              showInfo={false}
            />
          </div>
        </aside>

        {/* Pemisah vertikal */}
        <div className="hidden lg:block w-px bg-border shrink-0 self-stretch" />

        {/* ── Right Panel ─────────────────────────────────────────── */}
        <section className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto">
          {!selectedPlanId ? (
            <RightPaneEmpty />
          ) : (
            <PlanDetailPane planId={selectedPlanId} onRefreshList={refetch} />
          )}
        </section>
      </div>
    </div>
  );
}
