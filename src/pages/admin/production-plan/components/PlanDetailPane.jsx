import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Printer,
  Edit,
  CheckCircle,
  StopCircle,
  Lightbulb,
  Link,
} from "lucide-react";

import StatusBadge from "@/components/shared/StatusBadge";
import AlertSummaryCard from "@/components/shared/AlertSummaryCard";
import PlanMenuAccordion from "@/components/shared/PlanMenuAccordion";
import { Button } from "@/components/ui/button";
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
  if (plan.status === "active") return "active";
  if (plan.status === "completed") return "completed";
  if (plan.status === "stopped" || plan.status === "cancelled")
    return "stopped";
  if (!plan.readyToApprove || plan.hasUnsafeBatch) return "low stock";
  return "in-stock";
}

function getInitials(name) {
  if (!name) return "";
  const words = name.split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")} ${
    [
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
    ][date.getMonth()]
  } ${date.getFullYear()}`;
}

function mapMenuIngredients(menu, isDraft) {
  const details = isDraft
    ? menu?.ingredientsDetail
    : menu?.committedIngredientsDetail;
  if (!details?.length) return [];
  return details.map((ing) => {
    let status = "safe";
    if (ing.hasUnsafeBatch) status = "unsafe";

    const available = isDraft ? ing.availableQuantity : ing.quantityAvailable;

    return {
      name: ing.nameInventory,
      needed: `${ing.quantityNeeded ?? 0} ${ing.unit || ""}`.trim(),
      available: `${available ?? 0} ${ing.unit || ""}`.trim(),
      status,
      expired: ing.nearestExpiry ? formatDate(ing.nearestExpiry) : "-/-/-",
    };
  });
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-24 gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        <p className="text-sm">Loading plan details...</p>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const badgeVariant = deriveBadgeVariant(plan);
  const isDraft = plan.status === "draft";
  const isActive = plan.status === "active";
  const totalTarget =
    plan.menus?.reduce((sum, menu) => sum + (menu.quantityPlanned || 0), 0) ||
    0;

  return (
    // h-full sengaja dilepas: section pembungkus di PlanHistoryView tidak lagi
    // memberi tinggi pasti (kiri sekarang sticky, kanan mengikuti tinggi
    // konten & halaman yang scroll). overflow-hidden aman dipertahankan di
    // sini hanya untuk clipping sudut rounded, karena tinggi card sekarang
    // selalu mengikuti kontennya sendiri (tidak pernah dipaksa kecil).
    <div className="flex flex-col bg-card rounded-lg border border-border shadow-sm overflow-hidden min-w-0">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="p-6 border-b border-border">
        {/* flex-wrap + min-w-0 di kiri: judul panjang tidak lagi mendorong
            tombol print/edit keluar layar di pane sempit */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-2xl font-bold font-heading text-foreground break-words">
                {plan.name}
              </h2>
              <StatusBadge variant={badgeVariant} />
            </div>
            <p className="text-muted-foreground text-sm">
              Plan your selling and estimate the flow.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        {/* flex-wrap + gap yang lebih kecil di mobile: 3 blok info tidak lagi
            memaksa scroll horizontal saat pane menyempit */}
        <div className="flex flex-wrap items-start gap-x-8 gap-y-3 mt-6">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted-foreground">Period</span>
            <span className="text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap">
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted-foreground">Created By</span>
            <span className="text-sm font-semibold truncate">
              Admin Production
            </span>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-muted-foreground">Total Target</span>
            <span className="text-sm font-semibold whitespace-nowrap">
              {totalTarget.toLocaleString("en-US")} units
            </span>
          </div>
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

        <div className="min-w-0">
          <h3 className="font-semibold text-lg mb-4">Production Items</h3>

          <div className="flex flex-col gap-3 min-w-0">
            {plan.menus?.map((menu, idx) => {
              const disc = menu.discount || {};
              const menuHasDiscount = disc.discountPercentage > 0;
              const menuIngredients = mapMenuIngredients(menu, isDraft);

              const summary = {
                quantity: menu.quantityPlanned,
                originalPrice: menu.currentPrice || 25000,
                estimatedRevenue:
                  menu.quantityPlanned * (menu.currentPrice || 25000),
                estimatedProfit:
                  (menu.quantityPlanned * (menu.currentPrice || 25000)) / 2,
                ...(menuHasDiscount
                  ? {
                      discountPercent: disc.discountPercentage,
                      newPrice: disc.discountedPrice,
                      newProfit:
                        (menu.quantityPlanned * disc.discountedPrice) / 2,
                    }
                  : {}),
              };

              const hasUnsafe = menuIngredients.some(
                (ing) => ing.status !== "safe",
              );
              const badges = hasUnsafe ? ["insufficient"] : ["sufficient"];

              return (
                <PlanMenuAccordion
                  key={menu.menuId}
                  variant="active"
                  menuName={menu.name}
                  menuInitials={getInitials(menu.name)}
                  menuSubtitle="Beverage"
                  targetQty={menu.quantityPlanned}
                  badges={badges}
                  summary={summary}
                  ingredients={menuIngredients}
                  defaultOpen={idx === 0}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer Actions ────────────────────────────────────── */}
      {/* flex-wrap: di layar sempit tombol turun ke baris baru alih-alih
          terpotong; flex-col-reverse di mobile biar tombol primary di atas */}
      <div className="p-4 border-t border-border bg-muted/10 flex flex-wrap items-center justify-end gap-3">
        {isDraft && (
          <>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={reject}
              disabled={isMutating}
            >
              Reject
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
