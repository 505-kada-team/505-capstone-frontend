import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Calendar, Plus, TriangleAlert, StopCircle } from "lucide-react";

import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PlanReportBanner from "@/components/shared/admin/PlanReportBanner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import SearchInput from "@/components/shared/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPlanList, getPlanDetail, stopPlan } from "@/services/api";
import { useSortable } from "@/hooks/useSortable";
import Pagination from "@/components/shared/Pagination";
import { usePagination } from "@/hooks/usePagination";
import ActiveMenuDetailModal from "./components/ActiveMenuDetailModal";
import PlanHistoryDetailModal from "../components/PlanHistoryDetailModal";

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")} ${
    [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][date.getMonth()]
  } ${date.getFullYear()}`;
}

const formatRp = (num) =>
  num != null ? `Rp ${num.toLocaleString("id-ID")}` : "-";

// Komponen Progress Bar kustom
function ProgressBar({ current, max, colorClass = "bg-[#4E6A3E]" }) {
  const percentage =
    max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs sm:text-sm font-mono whitespace-nowrap">
        {current} / {max}
      </span>
    </div>
  );
}

const ACTIVE_MENU_LIMIT = 5;
const HISTORY_LIMIT = 5;

export default function ActivePlanPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [searchHistory, setSearchHistory] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { sortBy, setSortBy, sortData } = useSortable("date_newest");
  const [activePlanDetail, setActivePlanDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [selectedActiveMenuId, setSelectedActiveMenuId] = useState(null);
  const [selectedHistoryPlanId, setSelectedHistoryPlanId] = useState(null);

  // --- Plan History (bottom table) ---
  // Filter out draft plans so they don't inflate pagination count
  const nonDraftPlans = plans.filter((plan) => plan.status !== "draft");

  const filteredPlans = sortData(
    nonDraftPlans.filter((plan) => {
      const matchSearch = plan.name
        .toLowerCase()
        .includes(searchHistory.toLowerCase());
      const matchStatus =
        filterStatus === "all" || plan.status === filterStatus;
      return matchSearch && matchStatus;
    }),
  );

  const {
    currentPage: historyPage,
    totalPages: historyTotalPages,
    paginatedItems: paginatedPlans,
    setPage: setHistoryPage,
    resetPage: resetHistoryPage,
  } = usePagination(filteredPlans, HISTORY_LIMIT);

  useEffect(() => {
    resetHistoryPage();
  }, [searchHistory, filterStatus, sortBy, resetHistoryPage]);

  // --- Active Menu Tracking (top table) ---
  const activeMenus = activePlanDetail?.menus || [];
  const {
    currentPage: activeMenuPage,
    totalPages: activeMenuTotalPages,
    paginatedItems: paginatedActiveMenus,
    setPage: setActiveMenuPage,
    resetPage: resetActiveMenuPage,
  } = usePagination(activeMenus, ACTIVE_MENU_LIMIT);

  useEffect(() => {
    resetActiveMenuPage();
  }, [activePlanDetail?._id, resetActiveMenuPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all plans for history
      const listRes = await getPlanList();
      if (listRes.data?.success) {
        const fetchedPlans = listRes.data.data || [];
        setPlans(fetchedPlans);

        // Check if there is an active plan
        const active = fetchedPlans.find((p) => p.status === "active");
        if (active) {
          // Fetch detailed active plan to get menus tracking
          const detailRes = await getPlanDetail(active._id);
          if (detailRes.data?.success) {
            setActivePlanDetail(detailRes.data.data);
          }
        }
      }
    } catch {
      toast.error("Failed to fetch plan data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleStopPlan = async () => {
    setIsStopping(true);
    try {
      const res = await stopPlan(activePlanDetail._id, {
        reason: "Dihentikan manual",
      });
      if (res.data?.success) {
        toast.success("Plan berhasil dihentikan");
        setIsStopDialogOpen(false);
        setActivePlanDetail(null);
        fetchData();
      }
    } catch {
      toast.error("Gagal menghentikan plan");
    } finally {
      setIsStopping(false);
    }
  };

  const hasActive = !!activePlanDetail;

  const promoGroup = (() => {
    if (!activePlanDetail?.menus) return null;
    const discountedMenus = activePlanDetail.menus.filter(
      (m) => m.discount?.discountPercentage > 0,
    );
    if (discountedMenus.length === 0) return null;

    const firstDiscount = discountedMenus[0].discount;
    const firstPercent = firstDiscount.discountPercentage;
    const isFlat = discountedMenus.every(
      (m) => m.discount.discountPercentage === firstPercent,
    );

    return {
      reason: firstDiscount.reason || "Active Promo",
      scheme: isFlat ? "flat" : "vary",
      percent: firstPercent,
      menus: discountedMenus,
    };
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* CUSTOM PAGE HEADER */}
      <div className="flex flex-col gap-3 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <h1 className="text-2xl font-bold font-heading">Active Plan</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`w-8 h-8 rounded-md ${hasActive && (activePlanDetail.hasPendingLossReplacement || activePlanDetail.checkResultStale) ? "border-[#C4441F] text-[#C4441F] bg-[#C4441F]/10 hover:bg-[#C4441F]/20" : "text-muted-foreground bg-white"}`}
                    disabled={
                      !hasActive ||
                      !(
                        activePlanDetail.hasPendingLossReplacement ||
                        activePlanDetail.checkResultStale
                      )
                    }
                  >
                    <TriangleAlert className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                {hasActive && activePlanDetail.hasPendingLossReplacement && (
                  <PopoverContent className="w-[320px] p-3" align="end">
                    <PlanReportBanner
                      pendingCount={
                        activePlanDetail.pendingLossReplacementCount || 1
                      }
                      planId={activePlanDetail._id}
                    />
                  </PopoverContent>
                )}
              </Popover>
              {hasActive &&
                (activePlanDetail.hasPendingLossReplacement ||
                  activePlanDetail.checkResultStale) && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white pointer-events-none" />
                )}
            </div>

            {hasActive ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white border-green-400 text-green-700 hover:bg-green-50 transition-colors cursor-pointer outline-none"
                  >
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-md bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-md h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-xs font-medium">Active</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10 w-full justify-start"
                    onClick={() => setIsStopDialogOpen(true)}
                  >
                    <StopCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Stop Plan</span>
                  </Button>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white border-border text-muted-foreground">
                <div className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground"></span>
                </div>
                <span className="text-xs font-medium">None</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6 text-sm font-medium">
          <span>
            Plan Name:{" "}
            <span className="font-normal text-muted-foreground">
              {hasActive ? activePlanDetail.name : "-"}
            </span>
          </span>
          <span>
            Plan Period:{" "}
            <span className="font-normal text-muted-foreground">
              {hasActive
                ? `${formatDate(activePlanDetail.startDate)} - ${formatDate(activePlanDetail.endDate)}`
                : "-"}
            </span>
          </span>
          {hasActive && promoGroup && (
            <span>
              Active Promo:{" "}
              <span className="font-semibold text-[#F97316] font-body">
                {promoGroup.reason}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (
                  {promoGroup.scheme === "flat"
                    ? `Flat Rate ${promoGroup.percent}%`
                    : "Vary per Menu"}
                  )
                </span>
              </span>
            </span>
          )}
        </div>
      </div>

      {/* TOP SECTION: ACTIVE PLAN TRACKING */}
      <Card className="w-full shadow-sm py-0">
        <CardContent className={hasActive ? "p-0" : "p-3"}>
          {isLoading ? (
            <div className="flex justify-center py-20 text-muted-foreground">
              Loading data...
            </div>
          ) : !hasActive ? (
            // EMPTY STATE
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No active plan!</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                There is no active production plan at the moment. Create a new
                plan to start production tracking.
              </p>
              <Button
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
                onClick={() => navigate("/admin/production-plan/draft")}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Plan
              </Button>
            </div>
          ) : (
            // FILLED STATE
            <div className="flex flex-col">
              <div className="overflow-x-auto -mx-px">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border sticky top-0 bg-background z-10">
                    <tr>
                      <th className="py-3 font-medium px-4 sm:px-5 sticky left-0 bg-background z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        Menu Name
                      </th>
                      <th className="py-3 font-medium px-4 sm:px-5">
                        Sold / Quantity
                      </th>
                      <th className="py-3 font-medium px-4 sm:px-5 hidden sm:table-cell">
                        Profit
                      </th>
                      <th className="py-3 font-medium px-4 sm:px-5 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {paginatedActiveMenus.map((menu) => {
                      const sold = menu.soldQuantity || 0;
                      const planned = menu.quantityPlanned || 0;
                      const effectivePrice =
                        menu.discount?.discountPercentage > 0
                          ? menu.discount.discountedPrice
                          : menu.currentPrice || 25000;

                      const profit = sold * effectivePrice;

                      const ratio = planned > 0 ? sold / planned : 0;
                      let colorClass = "bg-[#4E6A3E]";
                      if (ratio > 0.8) colorClass = "bg-amber-600";
                      if (ratio >= 1) colorClass = "bg-[#C4441F]";

                      return (
                        <tr key={menu.menuId} className="hover:bg-muted/30">
                          <td className="py-3.5 px-4 sm:px-5 font-medium sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{menu.name}</span>
                              {menu.discount?.discountPercentage > 0 && (
                                <span className="text-[10px] font-semibold text-[#F97316] bg-[#F97316]/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                                  {menu.discount.discountPercentage}% Off
                                </span>
                              )}
                            </div>
                            <div className="sm:hidden text-xs text-muted-foreground font-mono mt-1">
                              {formatRp(profit)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5">
                            <ProgressBar
                              current={sold}
                              max={planned}
                              colorClass={colorClass}
                            />
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 font-mono hidden sm:table-cell">
                            {formatRp(profit)}
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-center">
                            <button
                              className="text-[#F97316] font-medium text-sm hover:underline"
                              onClick={() =>
                                setSelectedActiveMenuId(menu.menuId)
                              }
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 pb-3 border-t border-border">
                <Pagination
                  currentPage={activeMenuPage}
                  totalPage={activeMenuTotalPages}
                  totalData={activeMenus.length}
                  limit={ACTIVE_MENU_LIMIT}
                  onPageChange={setActiveMenuPage}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOTTOM SECTION: PLAN HISTORY */}
      <div className="flex flex-col">
        <h2 className="text-xl font-bold font-heading mb-4">Plan History</h2>

        <Card className="w-full shadow-sm py-0">
          <CardContent className="p-0">
            <div className="p-3 sm:p-4 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <SearchInput
                  id="plan-history-search"
                  placeholder="Search plan by name..."
                  value={searchHistory}
                  onChange={setSearchHistory}
                  className="w-full sm:flex-1 sm:max-w-[320px] h-9"
                />
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px] sm:w-[140px] h-9 text-muted-foreground font-normal text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Executed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="stopped">Stopped</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[130px] sm:w-[140px] h-9 text-muted-foreground font-normal text-xs">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_newest">Newest</SelectItem>
                      <SelectItem value="date_oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[420px]">
                <thead className="text-xs text-muted-foreground sticky top-0 bg-background z-10">
                  <tr>
                    <th className="py-3 px-4 sm:px-5 font-medium sticky left-0  z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      Plan Name
                    </th>
                    <th className="py-3 px-4 sm:px-5 font-medium hidden sm:table-cell">
                      Date
                    </th>
                    <th className="py-3 px-4 sm:px-5 font-medium text-center">
                      Status
                    </th>
                    <th className="py-3 px-4 sm:px-5 font-medium text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-10 text-center text-muted-foreground"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : paginatedPlans.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-10 text-center text-muted-foreground"
                      >
                        No plan history
                      </td>
                    </tr>
                  ) : (
                    paginatedPlans.map((p) => {
                      let displayStatus = p.status;
                      if (p.status === "completed") displayStatus = "Executed";
                      if (p.status === "cancelled" || p.status === "stopped")
                        displayStatus = "Terminated";

                      return (
                        <tr key={p._id} className="hover:bg-muted/30">
                          <td className="py-3.5 px-4 sm:px-5 font-medium sticky left-0  z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                            {p.name}
                            <div className="sm:hidden text-xs text-muted-foreground font-mono mt-1">
                              {formatDate(p.startDate)} -{" "}
                              {formatDate(p.endDate)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 font-mono text-xs hidden sm:table-cell">
                            {formatDate(p.startDate)} - {formatDate(p.endDate)}
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-center">
                            <StatusBadge
                              variant={displayStatus.toLowerCase()}
                            />
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-center">
                            <button
                              className="text-[#F97316] font-medium hover:underline text-sm"
                              onClick={() => setSelectedHistoryPlanId(p._id)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {paginatedPlans.length > 0 && (
              <div className="px-4 pb-3 border-t border-border">
                <Pagination
                  currentPage={historyPage}
                  totalPage={historyTotalPages}
                  totalData={filteredPlans.length}
                  limit={HISTORY_LIMIT}
                  onPageChange={setHistoryPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasActive && (
        <ConfirmDialog
          open={isStopDialogOpen}
          onClose={() => setIsStopDialogOpen(false)}
          onConfirm={handleStopPlan}
          title="Stop this plan?"
          description="The active plan will be stopped permanently. No more production can be added to this plan."
          confirmLabel="Stop Plan"
          cancelLabel="Cancel"
          loading={isStopping}
          variant="destructive"
        />
      )}

      {/* Active Menu Detail Modal */}
      <ActiveMenuDetailModal
        isOpen={!!selectedActiveMenuId}
        onClose={() => setSelectedActiveMenuId(null)}
        menuId={selectedActiveMenuId}
        plan={activePlanDetail}
      />

      {/* Plan History Detail Modal */}
      <PlanHistoryDetailModal
        isOpen={!!selectedHistoryPlanId}
        onClose={() => setSelectedHistoryPlanId(null)}
        planId={selectedHistoryPlanId}
      />
    </div>
  );
}
