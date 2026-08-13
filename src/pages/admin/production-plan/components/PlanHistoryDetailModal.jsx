import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { planApi } from "@/services/plan/plan.api";
import { mapPlanDetail, mapPlanReportList } from "@/services/plan/plan.mapper";
import { getSellingHistory } from "@/services/api";
import { formatCurrency } from "@/lib/formatCurrency";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  ClipboardList,
  TriangleAlert,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export default function PlanHistoryDetailModal({ isOpen, onClose, planId }) {
  const [plan, setPlan] = useState(null);
  const [reports, setReports] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const fetchPlanData = useCallback(async () => {
    if (!planId) return;
    setIsLoading(true);
    try {
      const envelope = await planApi.detail(planId);
      setPlan(mapPlanDetail(envelope.data));
    } catch (err) {
      console.error("Failed to load plan details:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load plan details",
      );
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [planId, onClose]);

  const fetchReports = useCallback(async () => {
    if (!planId) return;
    setIsLoadingReports(true);
    try {
      const envelope = await planApi.listReports({ planId });
      const raw = envelope.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setReports(mapPlanReportList(list));
    } catch (err) {
      console.error("Failed to load plan reports:", err);
    } finally {
      setIsLoadingReports(false);
    }
  }, [planId]);

  const fetchSalesHistory = useCallback(async () => {
    if (!planId) return;
    setIsLoadingSales(true);
    try {
      const res = await getSellingHistory({ planId });
      const raw = res.data;
      const list = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
          ? raw
          : [];
      setSalesHistory(list);
    } catch (err) {
      console.error("Failed to load sales history:", err);
    } finally {
      setIsLoadingSales(false);
    }
  }, [planId]);

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlanData();
      fetchReports();
      fetchSalesHistory();
    }
  }, [isOpen, planId, fetchPlanData, fetchReports, fetchSalesHistory]);

  if (!isOpen || !planId) return null;

  // Format Date Range Helper
  const formatPeriod = (start, end) => {
    if (!start || !end) return "—";
    const opt = { day: "2-digit", month: "short", year: "numeric" };
    return `${new Date(start).toLocaleDateString("en-US", opt)} - ${new Date(
      end,
    ).toLocaleDateString("en-US", opt)}`;
  };

  const getMenuSalesAnalysis = (menu) => {
    const normalPrice =
      menu.frozenSellingPrice || menu.effectiveSellingPrice || 25000;
    const sales = salesHistory.filter((s) => s.menuId === menu.menuId);

    const normalSales = sales.filter((s) => !s.discountApplied);
    const promoSales = sales.filter((s) => s.discountApplied);

    const normalQty = normalSales.reduce(
      (sum, s) => sum + (s.quantitySold || 0),
      0,
    );
    const promoQty = promoSales.reduce(
      (sum, s) => sum + (s.quantitySold || 0),
      0,
    );

    const discountedPrice =
      menu.discount?.discountPercentage > 0
        ? menu.discount.discountedPrice
        : null;

    const normalRev = normalQty * normalPrice;
    const promoRev = promoSales.reduce(
      (sum, s) =>
        sum +
        (s.quantitySold || 0) * (s.priceUsed || discountedPrice || normalPrice),
      0,
    );
    const totalActualRevenue = normalRev + promoRev;

    return {
      normalPrice,
      normalQty,
      promoQty,
      discountedPrice,
      normalRev,
      promoRev,
      totalActualRevenue,
    };
  };

  // Calculate top sales metrics
  const menus = plan?.menus || [];
  const menusWithAnalysis = menus.map((m) => {
    const analysis = getMenuSalesAnalysis(m);
    return {
      ...m,
      analysis,
    };
  });

  const totalEstimatedRevenue = menusWithAnalysis.reduce((sum, m) => {
    const price = m.analysis.normalPrice;
    return sum + (m.quantityPlanned || 0) * price;
  }, 0);

  const totalActualRevenue = menusWithAnalysis.reduce((sum, m) => {
    return sum + m.analysis.totalActualRevenue;
  }, 0);

  const totalRevenueVariance = totalActualRevenue - totalEstimatedRevenue;

  // Helper to format remaining quantities
  const getRemainingStatusList = () => {
    return menus.map((m) => {
      const remaining =
        (m.quantityPlanned || 0) -
        (m.soldQuantity || 0) -
        (m.lossQuantity || 0);
      return {
        name: m.name,
        remaining,
        isSoldOut: remaining <= 0,
      };
    });
  };

  const remainingStatusList = getRemainingStatusList();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
        {isLoading || !plan ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading plan history details...</p>
          </div>
        ) : (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle className="text-lg font-bold text-foreground font-heading flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#F97316]" />
                  {plan.name}
                </span>
                <StatusBadge
                  variant={
                    plan.status === "completed" ? "completed" : "stopped"
                  }
                />
              </DialogTitle>
            </DialogHeader>

            <div className="border-t border-border pt-4 mt-2 space-y-6">
              <div className="text-xs text-muted-foreground font-medium">
                Plan Period:{" "}
                <span className="text-foreground">
                  {formatPeriod(plan.startDate, plan.endDate)}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Sales Details
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[640px]">
                      <thead className="bg-muted text-muted-foreground text-xs uppercase">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Menu Name</th>
                          <th className="px-4 py-2.5 font-medium text-right">
                            Planned
                          </th>
                          <th className="px-4 py-2.5 font-medium text-right">
                            Price
                          </th>
                          <th className="px-4 py-2.5 font-medium text-right hidden sm:table-cell">
                            Est. Revenue
                          </th>
                          <th className="px-4 py-2.5 font-medium text-right">
                            Sold
                          </th>
                          <th className="px-4 py-2.5 font-medium text-right">
                            Actual Rev
                          </th>
                          <th className="px-4 py-2.5 font-medium text-right">
                            Variance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-normal">
                        {menusWithAnalysis.map((m) => {
                          const estRev =
                            (m.quantityPlanned || 0) * m.analysis.normalPrice;
                          const actRev = m.analysis.totalActualRevenue;
                          const variance = actRev - estRev;

                          return (
                            <tr
                              key={m.menuId}
                              className="bg-background hover:bg-muted/10"
                            >
                              <td className="px-4 py-3 font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  <span className="truncate">{m.name}</span>
                                  {m.discount?.discountPercentage > 0 && (
                                    <span className="text-[10px] font-semibold text-[#F97316] bg-[#F97316]/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                                      {m.discount.discountPercentage}% Off
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs">
                                {m.quantityPlanned}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs">
                                <div>
                                  {formatCurrency(m.analysis.normalPrice)}
                                </div>
                                {m.analysis.discountedPrice && (
                                  <div className="text-[10px] text-[#F97316] font-semibold mt-0.5">
                                    Promo:{" "}
                                    {formatCurrency(m.analysis.discountedPrice)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs hidden sm:table-cell">
                                {formatCurrency(estRev)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs">
                                <div>{m.soldQuantity}</div>
                                {m.analysis.discountedPrice && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    ({m.analysis.normalQty}N/{m.analysis.promoQty}P)
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs text-foreground font-semibold">
                                <div>{formatCurrency(actRev)}</div>
                                {m.analysis.discountedPrice && (
                                  <div className="text-[10px] text-green-700 font-normal mt-0.5">
                                    (P: {formatCurrency(m.analysis.promoRev)})
                                  </div>
                                )}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-mono text-xs font-semibold ${
                                  variance < 0
                                    ? "text-[#C4441F]"
                                    : "text-green-700"
                                }`}
                              >
                                {variance < 0 ? "-" : ""}
                                {formatCurrency(Math.abs(variance))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Incidents & Reports Section */}
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Incidents & Plan Reports
                </h3>
                {isLoadingReports ? (
                  <div className="py-6 flex justify-center text-xs text-muted-foreground animate-pulse">
                    Loading reports...
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-1">
                    No incidents or loss reports submitted for this plan.
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left min-w-[520px]">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase">
                          <tr>
                            <th className="px-4 py-2 font-medium">
                              Time
                            </th>
                            <th className="px-4 py-2 font-medium">Type & Item</th>
                            <th className="px-4 py-2 font-medium text-right">
                              Qty
                            </th>
                            <th className="px-4 py-2 font-medium text-center">
                              Status
                            </th>
                            <th className="px-4 py-2 font-medium">
                              Resolution
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-normal">
                          {reports.map((rep) => {
                            const dateObj = new Date(rep.incidentAt);
                            const dateStr = dateObj.toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                            });
                            const timeStr = dateObj.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });

                            return (
                              <tr
                                key={rep._id}
                                className="bg-background hover:bg-muted/10 text-xs"
                              >
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-mono">{dateStr}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {timeStr}
                                  </span>
                                  {rep.isLateReport && (
                                    <span className="inline-flex text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.2 rounded w-max mt-0.5">
                                      Late
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold capitalize text-foreground">
                                    {rep.category}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                                    {rep.nameRef || rep.refId}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold">
                                {rep.quantityLost}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="capitalize">
                                  <StatusBadge variant={rep.status} />
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-[11px]">
                                  {rep.status === "pending" && (
                                    <span className="text-muted-foreground italic flex items-center gap-1">
                                      <TriangleAlert className="w-3.5 h-3.5 text-amber-500" />
                                      Awaiting admin review
                                    </span>
                                  )}
                                  {rep.status === "rejected" && (
                                    <div className="flex flex-col text-[#C4441F]">
                                      <span className="font-semibold flex items-center gap-1">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        Rejected
                                      </span>
                                      {rep.adminNote && (
                                        <span className="text-[10px] text-muted-foreground italic">
                                          Note: {rep.adminNote}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {rep.status === "approved" && (
                                    <div className="flex flex-col text-green-700">
                                      <span className="font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                        Approved
                                      </span>
                                      {rep.category === "ingredient" ? (
                                        rep.replacementDeducted ? (
                                          <span className="text-[10px] text-muted-foreground font-mono">
                                            Replaced: {rep.replacementQuantity}{" "}
                                            units (Cost:{" "}
                                            {formatCurrency(
                                              rep.replacementCost,
                                            )}
                                            )
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-[#B45309] font-semibold">
                                            Pending replacement stock
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground">
                                          Est. Cost Loss:{" "}
                                          {formatCurrency(
                                            rep.valuation?.costLoss,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}
              </div>

              {/* Ingredients Detail Section (for non-draft plans) */}
              {!plan.isDraft && menusWithAnalysis.some(
                (m) => m.committedIngredientsDetail?.length > 0
              ) && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Committed Ingredients Detail
                  </h3>
                  <div className="space-y-4">
                    {menusWithAnalysis.map((m) => {
                      const details = m.committedIngredientsDetail;
                      if (!details || details.length === 0) return null;
                      return (
                        <div key={m.menuId} className="border rounded-lg overflow-hidden">
                          <div className="px-4 py-2 bg-muted/40 border-b">
                            <span className="text-xs font-semibold text-foreground">{m.name}</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left min-w-[500px]">
                              <thead className="bg-muted text-muted-foreground text-xs uppercase">
                                <tr>
                                  <th className="px-4 py-2 font-medium">Item Name</th>
                                  <th className="px-4 py-2 font-medium text-right">Qty Needed</th>
                                  <th className="px-4 py-2 font-medium text-right">Available</th>
                                  <th className="px-4 py-2 font-medium text-right">Pool Shared</th>
                                  <th className="px-4 py-2 font-medium text-center">Unsafe</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y font-normal">
                                {details.map((d, idx) => (
                                  <tr key={idx} className="bg-background hover:bg-muted/10">
                                    <td className="px-4 py-2 font-medium text-foreground">
                                      {d.nameInventory}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-xs">
                                      {d.quantityNeeded} {d.unit}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-xs">
                                      {d.quantityAvailable ?? d.availableQuantity ?? 0} {d.unit}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-xs">
                                      {d.poolShared ? "Yes" : "No"}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      {d.hasUnsafeBatch ? (
                                        <span className="text-[10px] font-semibold text-[#C4441F] bg-[#C4441F]/10 px-1.5 py-0.5 rounded">
                                          Yes
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground">No</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lower Section (Status Summaries & Financial Summaries) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border">
                {/* Left: Status Summaries */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Sales Status
                    </h4>
                    <div className="space-y-1.5 pl-1">
                      {remainingStatusList.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="font-medium text-foreground">
                            {m.name}
                          </span>
                          <span
                            className={`font-mono font-semibold px-2 py-0.5 rounded-full ${
                              m.isSoldOut
                                ? "bg-red-50 text-[#C4441F] dark:bg-red-950/20"
                                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                            }`}
                          >
                            {m.isSoldOut
                              ? "Sold Out"
                              : `${m.remaining} pcs remaining`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Inventory Status
                    </h4>
                    <div className="pl-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground font-body">
                          Incident Replacements
                        </span>
                        <span
                          className={`font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                            plan.hasPendingLossReplacement
                              ? "bg-red-50 text-[#C4441F] dark:bg-red-950/20"
                              : "bg-green-50 text-[#4E6A3E] dark:bg-green-950/20"
                          }`}
                        >
                          {plan.hasPendingLossReplacement
                            ? "Pending Replacement"
                            : "Sufficient / Replaced"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Sales Revenue Summary */}
                <div className="border border-border bg-secondary/10 dark:bg-muted/30 rounded-lg p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-1.5">
                    Sales Summary
                  </h4>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">
                      Estimated Revenue
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(totalEstimatedRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">
                      Actual Revenue
                    </span>
                    <span className="font-mono font-bold text-[#4E6A3E]">
                      {formatCurrency(totalActualRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-dashed border-border pt-2 font-bold">
                    <span className="text-foreground">Revenue Variance</span>
                    <span
                      className={`font-mono ${
                        totalRevenueVariance < 0
                          ? "text-[#C4441F]"
                          : "text-green-700"
                      }`}
                    >
                      {totalRevenueVariance < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(totalRevenueVariance))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                className="h-9 px-4 font-semibold shadow-xs"
                onClick={onClose}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
