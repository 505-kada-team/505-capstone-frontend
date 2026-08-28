import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Printer,
  Edit,
  CheckCircle,
  StopCircle,
  Lightbulb,
  Link,
  Plus,
  Ban,
  RefreshCw,
} from "lucide-react";

import StatusBadge from "@/components/shared/StatusBadge";
import AlertSummaryCard from "@/components/shared/AlertSummaryCard";
import PlanMenuAccordion from "@/components/shared/PlanMenuAccordion";
import PlanInventoryAccordion from "@/components/shared/PlanInventoryAccordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DiscountModal from "../draft/components/DiscountModal";
import DiscountDetailModal from "../draft/components/DiscountDetailModal";

import { usePlanDetail } from "@/hooks/plan/usePlanDetail";
import { usePlanPromoGroup } from "@/hooks/plan/usePlanPromoGroup";
import { useDeletePlanPromo } from "@/hooks/plan/usePlanDiscount";

/**
 * Helper to derive badge variant.
 */
function deriveBadgeVariant(plan) {
  switch (plan.status) {
    case "draft":
      return "draft";
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "stopped":
      return "stopped";
    case "cancelled":
      return "cancelled";
    default:
      return "deleted";
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
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

// Ubah bentuk ingredient hasil mapper (sudah seragam untuk semua status)
// jadi row siap-tampil untuk tabel dropdown menu.
function formatIngredientRow(ing) {
  return {
    name: ing.nameInventory,
    needed: `${ing.quantityNeeded ?? 0} ${ing.unit || ""}`.trim(),
    available: `${ing.availableQuantity ?? 0} ${ing.unit || ""}`.trim(),
    status: ing.hasUnsafeBatch ? "unsafe" : "safe",
    expired: ing.nearestExpiry ? formatDate(ing.nearestExpiry) : "-/-/-",
  };
}

export default function PlanDetailPane({ planId, onRefreshList }) {
  const navigate = useNavigate();
  const {
    plan,
    isLoading,
    isMutating,
    approve,
    reject,
    stop,
    refreshAvailability,
    setDiscount,
    removeDiscount,
    refetch,
  } = usePlanDetail(planId, { onMutationSuccess: onRefreshList });

  const promoGroup = usePlanPromoGroup(plan?.menus);
  const hasPlanDiscount = !!promoGroup;

  const { isDeleting, deletePromo } = useDeletePlanPromo(planId, {
    onDeleted: refetch,
  });

  const [confirmStopOpen, setConfirmStopOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editPromo, setEditPromo] = useState(null);

  const handleEditDiscount = (promo) => {
    setEditPromo(promo);
    setIsDetailModalOpen(false);
    setIsDiscountModalOpen(true);
  };

  const [availabilityError, setAvailabilityError] = useState(null);

  useEffect(() => {
    setAvailabilityError(null);
  }, [planId]);

  const handleRefreshAvailability = async () => {
    try {
      await refreshAvailability();
      setAvailabilityError(null);
      toast.success("Availability simulation updated");
    } catch (err) {
      console.error("Refresh availability error:", err);
      const rawMessage = err?.response?.data?.message || err?.message || "";

      const message = /Inventory .+ not found/.test(rawMessage)
        ? "One of the ingredients in this plan has been deleted from inventory. Please edit the menu recipe before refreshing again."
        : rawMessage || "Failed to refresh availability simulation";

      setAvailabilityError(message);
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-card rounded-lg border border-border shadow-sm overflow-hidden min-w-0 animate-pulse">
        {/* Header Skeleton */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-x-8 gap-y-3 mt-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6 space-y-6">
          {/* Tabs list skeleton */}
          <div className="w-full grid grid-cols-2 bg-muted p-1 rounded-lg">
            <Skeleton className="h-8 w-full bg-background/50 rounded-md" />
          </div>

          {/* Accordion Stack Skeletons */}
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-card">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-5 bg-muted/60" />
                    <Skeleton className="h-5 w-32 bg-muted/60" />
                  </div>
                  <Skeleton className="h-5 w-16 bg-muted/60" />
                </div>
                {idx === 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="grid grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1.5">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }



  if (!plan) {
    return null;
  }

  const badgeVariant = deriveBadgeVariant(plan);
  const isDraft = plan.status === "draft";
  const isActive = plan.status === "active";
  const isCancelled = plan.status === "cancelled";
  const totalTarget =
    plan.menus?.reduce((sum, menu) => sum + (menu.quantityPlanned || 0), 0) ||
    0;

  // Hitung duration dari tanggal, bukan dari field backend yang bisa salah
  const computedDuration =
    plan.startDate && plan.endDate
      ? Math.round(
          (new Date(plan.endDate).getTime() -
            new Date(plan.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : plan.duration ?? 0;

  // Suggestion tambah diskon: berdasarkan field asli dari backend
  // (inventorySafetyStatus + suggestion), bukan hasil hitung ulang FE.
  const showAddDiscountSuggestion =
    isDraft && plan.suggestion === "add_discount" && !hasPlanDiscount;

  return (
    <div className="flex flex-col bg-card rounded-lg border border-border shadow-sm overflow-hidden min-w-0">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-2xl font-bold font-heading text-foreground break-words">
                {plan.name}
              </h2>
              <StatusBadge variant={badgeVariant} />
              {isDraft && plan.inventorySafetyStatus && (
                <StatusBadge
                  variant={
                    plan.inventorySafetyStatus === "unsafe" ? "unsafe" : "safe"
                  }
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              Plan your selling and estimate the flow.
            </p>
          </div>
          {/* Tombol action kanan atas: Print, Edit, Diskon */}
          <div className="flex items-center gap-2 shrink-0">
            {(isDraft || isActive) && !hasPlanDiscount && (
              <Button
                variant="outline"
                size="sm"
                className="text-[#F97316] border-[#F97316]/40 hover:bg-[#F97316]/10 h-9"
                onClick={() => setIsDiscountModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Discount
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 text-muted-foreground" />
            </Button>
            {isDraft && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() =>
                  navigate(`/admin/production-plan/draft?edit=${planId}`)
                }
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        {/* Info header */}
        <div className="flex flex-wrap items-start gap-x-8 gap-y-3 mt-6">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted-foreground">Period</span>
            <span className="text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap">
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted-foreground">Duration</span>
            <span className="text-sm font-semibold whitespace-nowrap">
              {computedDuration} days
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted-foreground">Total Target</span>
            <span className="text-sm font-semibold whitespace-nowrap">
              {totalTarget.toLocaleString("en-US")} units
            </span>
          </div>
          {/* Hanya plan yang sudah diapprove (active/stopped/completed) yang punya approvedBy */}
          {!isDraft && !isCancelled && plan.approvedBy && (
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-xs text-muted-foreground">Approved By</span>
              <span className="text-sm font-semibold truncate">
                {plan.approvedBy}
              </span>
            </div>
          )}
          {/* Sugesti tambah diskon jika backend menandai inventorySafetyStatus unsafe */}
          {showAddDiscountSuggestion && (
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-xs text-muted-foreground">Suggestion</span>
              <span className="text-sm font-semibold text-[#F97316] flex items-center gap-1">
                <Lightbulb className="w-4 h-4" /> Add Discount
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="p-6 flex flex-col gap-6 min-w-0">
        {/* Alerts */}
        {plan.checkResultStale && (
          <AlertSummaryCard
            title="ATTENTION"
            value="Stale Availability Simulation"
            variant="warning"
            className="mb-0"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAvailability}
                disabled={isMutating}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isMutating ? "animate-spin" : ""}`}
                />
                {isMutating ? "Refreshing..." : "Refresh"}
              </Button>
            }
          />
        )}
        {plan.hasPendingLossReplacement && (
          <AlertSummaryCard
            title="WARNING"
            value={plan.warning || "There is a pending loss replacement"}
            variant="warning"
            className="mb-0"
          />
        )}
        {hasPlanDiscount && (
          <AlertSummaryCard
            title="SUGGESTION"
            value="Discount applied"
            variant="success"
            icon={<Lightbulb className="w-5 h-5" />}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(true)}
              >
                <Link className="w-4 h-4 mr-2" /> View Discount
              </Button>
            }
          />
        )}

        {availabilityError && (
          <AlertSummaryCard
            title="ERROR"
            value={availabilityError}
            variant="danger"
            className="mb-0"
          />
        )}

        <div className="min-w-0">
          {isCancelled ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center border border-dashed border-border rounded-lg bg-muted/20">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Ban className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                This plan has been cancelled
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Production items and ingredient details are no longer available
                for a cancelled plan.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="menu" className="min-w-0">
              <TabsList className="mb-4 w-full grid grid-cols-2">
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>

              <TabsContent value="menu" className="min-w-0">
                <div className="flex flex-col gap-3 min-w-0">
                  {plan.menus?.map((menu, idx) => {
                    const disc = menu.discount || {};
                    const menuHasDiscount = disc.discountPercentage > 0;
                    const menuIngredients = (menu.ingredientsDetail ?? []).map(
                      formatIngredientRow,
                    );

                    const summary = {
                      quantity: menu.quantityPlanned,
                      originalPrice: menu.effectiveSellingPrice,
                      costPerPortion: menu.costPerPortion,
                      estimatedProfit: menu.estimatedProfit,
                      ...(menuHasDiscount
                        ? {
                            discountPercent: disc.discountPercentage,
                            newPrice: disc.discountedPrice,
                            newProfit:
                              menu.costPerPortion != null
                                ? (disc.discountedPrice - menu.costPerPortion) *
                                  menu.quantityPlanned
                                : null,
                          }
                        : {}),
                    };

                    // Badge kecukupan kuantitas bahan diambil langsung dari
                    // field `lowStock` backend, bukan dihitung ulang dari
                    // status expiry tiap bahan.
                    const badges = menu.lowStock
                      ? ["insufficient"]
                      : ["sufficient"];

                    return (
                      <PlanMenuAccordion
                        key={menu.menuId}
                        variant={isDraft ? "draft" : "active"}
                        menuName={menu.name}
                        badges={badges}
                        summary={summary}
                        ingredients={menuIngredients}
                        defaultOpen={idx === 0}
                      />
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="min-w-0">
                <PlanInventoryAccordion
                  inventoryList={plan.inventoryList}
                  defaultOpen
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* ── Footer Actions ────────────────────────────────────── */}
      <div className="p-4 border-t border-border bg-muted/10 flex flex-wrap items-center justify-end gap-3">
        {isDraft && (
          <>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={reject}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#4E6A3E] hover:bg-[#4E6A3E]/90 text-white"
              onClick={approve}
              disabled={
                isMutating || !plan.readyToApprove || plan.checkResultStale
              }
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept
            </Button>
          </>
        )}

        {isActive && (
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmStopOpen(true)}
          >
            <StopCircle className="w-4 h-4 mr-2" /> Stop Plan
          </Button>
        )}
      </div>

      {/* Stop Confirm Dialog */}
      <Dialog open={confirmStopOpen} onOpenChange={setConfirmStopOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Production Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop this plan? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStopOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                stop({
                  reason: "Manually stopped by admin",
                  stoppedBy: "Admin",
                }).then((result) => {
                  if (result?.ok) {
                    setConfirmStopOpen(false);
                  }
                })
              }
              disabled={isMutating}
            >
              Confirm Stop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        plan={plan}
        planId={planId}
        editPromo={editPromo}
        onApply={() => refetch()}
      />

      <DiscountDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        planId={planId}
        promo={promoGroup}
        onEdit={handleEditDiscount}
        onDelete={() => refetch()}
      />
    </div>
  );
}
