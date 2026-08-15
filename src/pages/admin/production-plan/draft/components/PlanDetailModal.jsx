import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Link, PlusCircle, Lightbulb } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import AlertSummaryCard from "@/components/shared/AlertSummaryCard";
import PlanMenuAccordion from "@/components/shared/PlanMenuAccordion";
import DiscountModal from "./DiscountModal";
import DiscountDetailModal from "./DiscountDetailModal";
import { usePlanDetail } from "@/hooks/plan/usePlanDetail";
import { usePlanPromoGroup } from "@/hooks/plan/usePlanPromoGroup";
import { useDeletePlanPromo } from "@/hooks/plan/usePlanDiscount";

export default function PlanDetailModal({ isOpen, onClose, planId }) {
  const { plan, isLoading, isMutating, approve, reject, refetch } =
    usePlanDetail(isOpen ? planId : null, { onMutationSuccess: onClose });

  const promoGroup = usePlanPromoGroup(plan?.menus);
  const hasDiscount = !!promoGroup;

  const { isDeleting, deletePromo } = useDeletePlanPromo(planId, {
    onDeleted: refetch,
  });

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editPromo, setEditPromo] = useState(null);

  // Extract info from plan
  const { hasUnsafeBatch, menus } = plan || {};

  const dateRangeStr = useMemo(() => {
    if (!plan || !plan.startDate || !plan.duration) return "";
    try {
      const startMs = new Date(plan.startDate).getTime();
      if (isNaN(startMs)) return "";
      const endIso = new Date(
        startMs + (plan.duration - 1) * 24 * 60 * 60 * 1000,
      ).toISOString();
      return `${formatDate(plan.startDate)} - ${formatDate(endIso)}`;
    } catch {
      return "";
    }
  }, [plan]);

  const mappedIngredients = mapIngredientsFromPlan(plan);

  const displayMenus = menus || [];

  const handleEditDiscount = (promo) => {
    setEditPromo(promo);
    setIsDetailModalOpen(false);
    setIsDiscountModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          {isLoading || !plan ? (
            <div className="py-24 text-center text-muted-foreground">
              Loading detail plan...
            </div>
          ) : (
            <>
              <DialogHeader className="mb-4 text-left">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl font-bold font-heading">
                    {plan.name || "Plan Name"}
                  </DialogTitle>
                  <StatusBadge variant="low stock" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {dateRangeStr}
                </p>
              </DialogHeader>

              {/* Alert Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <AlertSummaryCard
                  title="INVENTORY STATUS"
                  value={hasUnsafeBatch ? "Unsafe" : "Safe"}
                  variant={hasUnsafeBatch ? "warning" : "success"}
                  icon={<TriangleAlert className="w-5 h-5" />}
                />
                {hasDiscount ? (
                  <AlertSummaryCard
                    title="TIPS"
                    value="Discount added"
                    variant="success"
                    icon={<Lightbulb className="w-5 h-5" />}
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDetailModalOpen(true)}
                      >
                        <Link className="w-4 h-4 mr-2" /> Lihat Diskon
                      </Button>
                    }
                  />
                ) : (
                  <AlertSummaryCard
                    title="TIPS"
                    value="Add discount"
                    variant="success"
                    icon={<Lightbulb className="w-5 h-5" />}
                    action={
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditPromo(null);
                          setIsDiscountModalOpen(true);
                        }}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" /> Tambah Diskon
                      </Button>
                    }
                  />
                )}
              </div>

              <div className="mb-2">
                <span className="font-semibold text-sm">Detail</span>
              </div>

              {/* Accordion List */}
              <div className="space-y-4 mb-6">
                {displayMenus?.map((menu, index) => {
                  const disc = menu.discount || {};
                  return (
                    <PlanMenuAccordion
                      key={menu.menuId}
                      menuName={menu.name}
                      badges={hasUnsafeBatch ? ["kurang"] : []}
                      defaultOpen={index === 0}
                      summary={{
                        quantity: menu.quantityPlanned,
                        originalPrice: menu.currentPrice,
                        estimatedProfit:
                          menu.currentPrice * menu.quantityPlanned, // Simplified estimation
                        ...(disc.discountPercentage > 0
                          ? {
                              discountPercent: disc.discountPercentage,
                              newPrice: disc.discountedPrice,
                              newProfit:
                                disc.discountedPrice * menu.quantityPlanned,
                            }
                          : {}),
                      }}
                      ingredients={index === 0 ? mappedIngredients : []} // Attach checkResult to the first menu
                    />
                  );
                })}
              </div>

              <DialogFooter className="flex justify-between items-center sm:justify-between w-full mt-4">
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={reject}
                  disabled={isMutating}
                >
                  Remove
                </Button>
                <Button
                  className="bg-[#2D241E] hover:bg-[#2D241E]/90 text-primary-foreground"
                  onClick={approve}
                  disabled={isMutating}
                >
                  {isMutating ? "Processing..." : "Accept"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        plan={plan}
        planId={planId}
        editPromo={editPromo}
        onApply={refetch}
      />

      <DiscountDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        promo={promoGroup}
        planId={planId}
        onEdit={handleEditDiscount}
        onDelete={() => deletePromo(promoGroup)}
      />
    </>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "xx/xx/xxxx";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function mapIngredientsFromPlan(plan) {
  if (!plan) return [];
  const checkResult = plan.checkResult;
  if (!checkResult) return [];
  return checkResult.map((cr) => {
    const worstBatch =
      cr.eligibleBatches?.find((b) => b.batchSafetyStatus === "unsafe") ||
      cr.eligibleBatches?.[0] ||
      {};
    let status = "safe";
    if (!cr.sufficient)
      status = "insufficient"; // dulu: 'less' — bukan key valid, selalu fallback "Archived"
    else if (cr.hasUnsafeBatch) status = "unsafe";
    return {
      name: cr.nameInventory,
      needed: `${cr.quantityNeeded} ${cr.unit || "unit"}`,
      available: `${cr.availableQuantity} ${cr.unit || "unit"}`,
      shortage: cr.sufficient
        ? ""
        : `${cr.quantityNeeded - cr.availableQuantity} ${cr.unit || "unit"}`,
      expired: worstBatch.expired ? formatDate(worstBatch.expired) : "-/-/-",
      status,
    };
  });
}
