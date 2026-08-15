import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  TriangleAlert,
  StopCircle,
  Percent,
} from "lucide-react";

import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import PlanReportBanner from "@/components/shared/admin/PlanReportBanner";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/formatDate";
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
import { useSortable } from "@/hooks/useSortable";
import Pagination from "@/components/shared/Pagination";
import { usePagination } from "@/hooks/usePagination";
import ActiveMenuDetailModal from "./components/ActiveMenuDetailModal";
import PlanHistoryDetailModal from "../components/PlanHistoryDetailModal";
import DiscountModal from "../draft/components/DiscountModal";
import DiscountDetailModal from "../draft/components/DiscountDetailModal";

// Hooks yang sudah dibuat
import { usePlanList } from "@/hooks/plan/usePlanList";
import { usePlanDetail } from "@/hooks/plan/usePlanDetail";
import { useStopPlan } from "@/hooks/plan/useStopPlan";
import { usePlanPromoGroup } from "@/hooks/plan/usePlanPromoGroup";
import { useDeletePlanPromo } from "@/hooks/plan/usePlanDiscount";

const formatRp = (num) =>
  num != null ? `Rp ${num.toLocaleString("id-ID")}` : "-";

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

  // ── Hooks ─────────────────────────────────────────────────────
  const {
    plans,
    isLoading: isLoadingList,
    refetch: refetchPlans,
  } = usePlanList();

  const [activePlanId, setActivePlanId] = useState(null);

  // Cari plan aktif dari daftar
  useEffect(() => {
    const active = plans.find((p) => p.status === "active");
    setActivePlanId(active?._id || null);
  }, [plans]);

  const {
    plan: activePlanDetail,
    isLoading: isLoadingDetail,
    refetch: refetchPlanDetail,
  } = usePlanDetail(activePlanId);

  const refreshActiveData = async () => {
    await Promise.all([refetchPlans(), refetchPlanDetail()]);
  };

  const { stop, isStopping } = useStopPlan(activePlanId);

  const promoGroup = usePlanPromoGroup(activePlanDetail?.menus);
  const hasActiveDiscount = !!promoGroup;

  const { deletePromo, isDeleting: isDeletingPromo } = useDeletePlanPromo(
    activePlanId,
    {
      onDeleted: refreshActiveData, // sudah refetch detail + list
    },
  );

  // State UI lainnya
  const [searchHistory, setSearchHistory] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { sortBy, setSortBy, sortData } = useSortable("date_newest");
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [selectedActiveMenuId, setSelectedActiveMenuId] = useState(null);
  const [selectedHistoryPlanId, setSelectedHistoryPlanId] = useState(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editPromo, setEditPromo] = useState(null);

  // Gabungan loading untuk seluruh halaman
  const isPageLoading = isLoadingList || (activePlanId && isLoadingDetail);

  // ── Plan History (bottom table) ──────────────────────────────
  const nonDraftPlans = plans.filter(
    (plan) => plan.status !== "draft" && plan.status !== "active",
  );

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

  // ── Active Menu Tracking ─────────────────────────────────────
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
  }, [activePlanId, resetActiveMenuPage]);

  const handleStopPlan = async () => {
    try {
      await stop({
        reason: "Dihentikan manual",
        stoppedBy: "Admin", // bisa diganti dengan user auth
      });
      toast.success("Plan berhasil dihentikan");
      setIsStopDialogOpen(false);
      setActivePlanId(null); // trigger planDetail menghilang
      refetchPlans();
    } catch {
      toast.error("Gagal menghentikan plan");
    }
  };

  const hasActive = !!activePlanDetail;

  const handleEditDiscount = (promo) => {
    setEditPromo(promo);
    setIsDetailModalOpen(false);
    setIsDiscountModalOpen(true);
  };

  const handleDeleteMenuPromo = async (menuId) => {
    try {
      await deletePromo(menuId);
      toast.success("Diskon menu berhasil dihapus");
      setIsDetailModalOpen(false);
    } catch {
      toast.error("Gagal menghapus diskon menu");
    }
  };

  const handleDeleteAllPromo = async () => {
    const discountedMenuIds = activeMenus
      .filter((menu) => menu.discount?.discountPercentage > 0)
      .map((menu) => menu.menuId);

    if (discountedMenuIds.length === 0) {
      toast.info("Tidak ada diskon untuk dihapus");
      return;
    }

    try {
      await deletePromo(discountedMenuIds);
      toast.success("Semua diskon berhasil dihapus");
      setIsDetailModalOpen(false);
    } catch {
      toast.error("Gagal menghapus semua diskon");
    }
  };

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
                    className={`w-8 h-8 rounded-md ${
                      hasActive &&
                      (activePlanDetail.hasPendingLossReplacement ||
                        activePlanDetail.checkResultStale)
                        ? "border-[#C4441F] text-[#C4441F] bg-[#C4441F]/10 hover:bg-[#C4441F]/20"
                        : "text-muted-foreground bg-white"
                    }`}
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
                      planId={activePlanDetail.id}
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
              <>
                {!hasActiveDiscount && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#F97316] border-[#F97316]/40 hover:bg-[#F97316]/10 gap-1.5 h-8"
                    onClick={() => setIsDiscountModalOpen(true)}
                  >
                    <Percent className="w-3.5 h-3.5" /> Diskon
                  </Button>
                )}
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
                {hasActiveDiscount && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#F97316] border-[#F97316]/40 hover:bg-[#F97316]/10 gap-1.5 h-8"
                    onClick={() => setIsDetailModalOpen(true)}
                  >
                    <Percent className="w-3.5 h-3.5" /> Lihat Diskon
                  </Button>
                )}
              </>
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                Promo:{" "}
                <span className="font-semibold text-accent">
                  {promoGroup.reason}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {promoGroup.scheme === "flat"
                  ? `Flat Rate ${promoGroup.percent}%`
                  : "Vary per Menu"}
              </span>
              <span className="text-xs text-muted-foreground">
                • Starts {formatDateTime(promoGroup.startDate)}
              </span>
              <span className="text-xs text-muted-foreground">
                • Ends {formatDateTime(promoGroup.endDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* TOP SECTION: ACTIVE PLAN TRACKING */}
      <Card className="w-full shadow-sm py-0">
        <CardContent className={hasActive ? "p-0" : "p-3"}>
          {isPageLoading ? (
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
                          : menu.effectiveSellingPrice ||
                            menu.frozenSellingPrice ||
                            0;

                      const costPerPortion = menu.costPerPortion || 0;
                      const profit =
                        sold * effectivePrice - sold * costPerPortion;

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
                    <th className="py-3 px-4 sm:px-5 font-medium sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
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
                  {isLoadingList ? (
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
                          <td className="py-3.5 px-4 sm:px-5 font-medium sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
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

      <ActiveMenuDetailModal
        isOpen={!!selectedActiveMenuId}
        onClose={() => setSelectedActiveMenuId(null)}
        menuId={selectedActiveMenuId}
        plan={activePlanDetail}
      />

      <PlanHistoryDetailModal
        isOpen={!!selectedHistoryPlanId}
        onClose={() => setSelectedHistoryPlanId(null)}
        planId={selectedHistoryPlanId}
      />

      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => {
          setIsDiscountModalOpen(false);
          setEditPromo(null);
        }}
        plan={activePlanDetail}
        planId={activePlanId}
        editPromo={editPromo}
        onApply={() => {
          refetchPlans();
          refreshActiveData();
        }}
      />

      <DiscountDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        planId={activePlanId}
        promo={promoGroup}
        onEdit={handleEditDiscount}
        onDelete={() => {
          refreshActiveData();
        }}
      />
    </div>
  );
}
