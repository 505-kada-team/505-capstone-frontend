import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { getSellingHistory } from "@/services/api";
import { formatCurrency } from "@/lib/formatCurrency";
import StatusBadge from "@/components/shared/StatusBadge";
import PlanInventoryAccordion from "@/components/shared/PlanInventoryAccordion";
import Pagination from "@/components/shared/Pagination";
import { ClipboardList, ShieldAlert, User, CalendarClock, Search } from "lucide-react";
import { toast } from "sonner";
import { usePlanDetail } from "@/hooks/plan/usePlanDetail";

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

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const datePart = formatDate(dateStr);
  const date = new Date(dateStr);
  const timePart = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}

function formatPeriod(start, end) {
  if (!start || !end) return "—";
  const opt = { day: "2-digit", month: "short", year: "numeric" };
  return `${new Date(start).toLocaleDateString("en-US", opt)} - ${new Date(end).toLocaleDateString("en-US", opt)}`;
}

const TXN_LIMIT = 5;

export default function PlanHistoryDetailModal({ isOpen, onClose, planId }) {
  const {
    plan,
    isLoading,
    error: planError,
  } = usePlanDetail(isOpen ? planId : null);

  const [salesHistory, setSalesHistory] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState(null);
  const [txnPagination, setTxnPagination] = useState({
    totalData: 0,
    totalPage: 0,
    currentPage: 1,
  });

  const [filterDate, setFilterDate] = useState("");
  const [filterStartTime, setFilterStartTime] = useState("");
  const [filterEndTime, setFilterEndTime] = useState("");

  useEffect(() => {
    if (planError && isOpen) {
      toast.error(
        planError?.response?.data?.message ||
          planError?.message ||
          "Failed to load plan details",
      );
      onClose();
    }
  }, [planError, isOpen, onClose]);

  const fetchSalesHistory = useCallback(async () => {
    if (!planId) return;
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
    }
  }, [planId]);

  const fetchTransactions = useCallback(
    async (page = 1) => {
      if (!planId) return;
      setTxnLoading(true);
      setTxnError(null);
      try {
        const params = { planId, page, limit: TXN_LIMIT };
        if (filterDate) params.date = filterDate;
        if (filterStartTime) params.startTime = `${filterDate}T${filterStartTime}:00`;
        if (filterEndTime) params.endTime = `${filterDate}T${filterEndTime}:00`;

        const res = await getSellingHistory(params);
        const body = res.data?.data;
        setTransactions(body?.data ?? []);
        setTxnPagination(body?.pagination ?? { totalData: 0, totalPage: 0, currentPage: 1 });
      } catch (err) {
        setTxnError(
          err?.response?.data?.message || "Failed to load transactions",
        );
      } finally {
        setTxnLoading(false);
      }
    },
    [planId, filterDate, filterStartTime, filterEndTime],
  );

  useEffect(() => {
    if (isOpen && planId) {
      fetchSalesHistory();
      fetchTransactions(1);
    }
  }, [isOpen, planId, fetchSalesHistory, fetchTransactions]);

  const handleFilterSubmit = () => {
    fetchTransactions(1);
  };

  const handlePageChange = (page) => {
    fetchTransactions(page);
  };

  if (!isOpen || !planId) return null;

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

  const menus = plan?.menus || [];
  const menusWithAnalysis = menus.map((m) => ({
    ...m,
    analysis: getMenuSalesAnalysis(m),
  }));

  const totalEstimatedRevenue = menusWithAnalysis.reduce((sum, m) => {
    return sum + (m.quantityPlanned || 0) * m.analysis.normalPrice;
  }, 0);

  const totalActualRevenue = menusWithAnalysis.reduce(
    (sum, m) => sum + m.analysis.totalActualRevenue,
    0,
  );

  const totalRevenueVariance = totalActualRevenue - totalEstimatedRevenue;

  const remainingStatusList = menus.map((m) => {
    const remaining =
      (m.quantityPlanned || 0) - (m.soldQuantity || 0) - (m.lossQuantity || 0);
    return {
      name: m.name,
      remaining,
      isSoldOut: remaining <= 0,
    };
  });

  const isCancelled = plan?.status === "cancelled";

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
                    plan.status === "completed"
                      ? "completed"
                      : plan.status === "cancelled"
                        ? "cancelled"
                        : "stopped"
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

              {/* ── Plan Info (approved/stopped) ─────────────────── */}
              {(plan.approvedBy || plan.stoppedBy || plan.stopReason) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {plan.approvedBy && (
                    <div className="border border-border rounded-lg p-3 bg-muted/10">
                      <div className="text-xs text-muted-foreground font-medium">
                        Approved By
                      </div>
                      <div className="text-sm font-semibold mt-1 text-foreground truncate">
                        {plan.approvedBy}
                      </div>
                      {plan.approvedAt && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {formatDateTime(plan.approvedAt)}
                        </div>
                      )}
                    </div>
                  )}
                  {plan.stoppedBy && (
                    <div className="border border-border rounded-lg p-3 bg-muted/10">
                      <div className="text-xs text-muted-foreground font-medium">
                        Stopped By
                      </div>
                      <div className="text-sm font-semibold mt-1 text-foreground truncate">
                        {plan.stoppedBy}
                      </div>
                      {plan.stoppedAt && (
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {formatDateTime(plan.stoppedAt)}
                        </div>
                      )}
                    </div>
                  )}
                  {plan.stopReason && (
                    <div className="border border-border rounded-lg p-3 bg-muted/10">
                      <div className="text-xs text-muted-foreground font-medium">
                        Stop Reason
                      </div>
                      <div className="text-sm font-semibold mt-1 text-foreground">
                        {plan.stopReason}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isCancelled ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    This plan has been cancelled
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Production items and ingredient details are no longer
                    available for a cancelled plan.
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Sales Details ─────────────────────────────── */}
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Sales Details
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[640px]">
                          <thead className="bg-muted text-muted-foreground text-xs uppercase">
                            <tr>
                              <th className="px-4 py-2.5 font-medium">
                                Menu Name
                              </th>
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
                                (m.quantityPlanned || 0) *
                                m.analysis.normalPrice;
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
                                        {formatCurrency(
                                          m.analysis.discountedPrice,
                                        )}
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
                                        ({m.analysis.normalQty}N/
                                        {m.analysis.promoQty}P)
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-xs text-foreground font-semibold">
                                    <div>{formatCurrency(actRev)}</div>
                                    {m.analysis.discountedPrice && (
                                      <div className="text-[10px] text-green-700 font-normal mt-0.5">
                                        (P:{" "}
                                        {formatCurrency(m.analysis.promoRev)})
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

                  {/* ── Tabs: Inventory + Transaksi ────────────────── */}
                  <Tabs defaultValue="inventory" className="w-full">
                    <TabsList className="mb-4 w-full grid grid-cols-2">
                      <TabsTrigger value="inventory">Inventory</TabsTrigger>
                      <TabsTrigger value="transactions">Transaksi</TabsTrigger>
                    </TabsList>

                    {/* ── Tab Inventory ──────────────────────────── */}
                    <TabsContent value="inventory" className="min-w-0">
                      <PlanInventoryAccordion
                        inventoryList={plan.inventoryList ?? []}
                        defaultOpen
                      />
                    </TabsContent>

                    {/* ── Tab Transaksi ──────────────────────────── */}
                    <TabsContent value="transactions" className="min-w-0">
                      {/* Filter bar */}
                      <div className="flex flex-wrap items-end gap-2 mb-4 p-3 border border-border rounded-lg bg-muted/10 w-full">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <label className="text-xs font-medium text-muted-foreground">
                            Date
                          </label>
                          <Input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="h-8 w-full text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <label className="text-xs font-medium text-muted-foreground">
                            Start Time
                          </label>
                          <Input
                            type="time"
                            value={filterStartTime}
                            onChange={(e) => setFilterStartTime(e.target.value)}
                            className="h-8 w-full text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <label className="text-xs font-medium text-muted-foreground">
                            End Time
                          </label>
                          <Input
                            type="time"
                            value={filterEndTime}
                            onChange={(e) => setFilterEndTime(e.target.value)}
                            className="h-8 w-full text-xs"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={handleFilterSubmit}
                        >
                          <Search className="w-3.5 h-3.5" />
                          Filter
                        </Button>
                      </div>

                      {txnLoading ? (
                        <div className="flex justify-center py-16 text-muted-foreground text-sm">
                          Loading transactions...
                        </div>
                      ) : txnError ? (
                        <div className="py-10 text-center text-sm text-[#C4441F] border border-dashed border-[#C4441F]/30 rounded-lg">
                          {txnError}
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                          No transactions for this plan yet
                        </div>
                      ) : (
                        <>
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full min-w-0"
                          >
                            {transactions.map((txn, txnIdx) => {
                              const menuItems = txn.items ?? [];
                              return (
                                <AccordionItem
                                  key={txn._id ?? txnIdx}
                                  value={`txn-${txnIdx}`}
                                  className="border rounded-lg mb-3 bg-card px-4 border-border data-[state=open]:border-border/80 min-w-0"
                                >
                                  <AccordionTrigger className="hover:no-underline py-3">
                                    <div className="flex items-center justify-between w-full pr-4 flex-wrap gap-y-1">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                                          <span className="font-medium truncate">
                                            {txn.cashierName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <CalendarClock className="w-3 h-3" />
                                          <span className="font-mono whitespace-nowrap">
                                            {formatDateTime(txn.soldAt)}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-sm font-mono font-semibold text-[#4E6A3E] shrink-0">
                                        {formatCurrency(txn.transactionRevenue)}
                                      </span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-3 min-w-0">
                                    <Accordion
                                      type="single"
                                      collapsible
                                      className="w-full min-w-0"
                                    >
                                      {menuItems.map((item, itemIdx) => (
                                        <AccordionItem
                                          key={`${txn._id}-${item.menuId}-${itemIdx}`}
                                          value={`txn-${txnIdx}-menu-${itemIdx}`}
                                          className="border rounded-lg mb-2 bg-muted/5 px-3 border-border data-[state=open]:border-border/80 min-w-0"
                                        >
                                          <AccordionTrigger className="hover:no-underline py-2.5">
                                            <div className="flex items-center justify-between w-full pr-3">
                                              <span className="font-semibold text-sm text-foreground truncate">
                                                {item.menuName}
                                              </span>
                                              <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">
                                                x{item.quantitySold} &middot;{" "}
                                                {formatCurrency(item.priceUsed)}
                                              </span>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="pb-2 min-w-0">
                                            <Accordion
                                              type="single"
                                              collapsible
                                              className="w-full min-w-0"
                                            >
                                              {(item.ingredientsUsed ?? []).map(
                                                (ing, ingIdx) => (
                                                  <AccordionItem
                                                    key={`${item.menuId}-${ing.inventoryId}-${ingIdx}`}
                                                    value={`txn-${txnIdx}-menu-${itemIdx}-ing-${ingIdx}`}
                                                    className="border rounded mb-1.5 bg-card px-3 border-border data-[state=open]:border-border/80 min-w-0"
                                                  >
                                                    <AccordionTrigger className="hover:no-underline py-2">
                                                      <span className="font-medium text-sm text-foreground truncate">
                                                        {ing.nameInventory}
                                                      </span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-2 min-w-0">
                                                      <div className="min-w-0 overflow-x-auto">
                                                        <table className="w-full text-xs text-left min-w-[380px]">
                                                          <thead className="text-muted-foreground uppercase border-b">
                                                            <tr>
                                                              <th className="py-1.5 font-medium">
                                                                Batch
                                                              </th>
                                                              <th className="py-1.5 font-medium text-center">
                                                                Qty Used
                                                              </th>
                                                              <th className="py-1.5 font-medium text-center">
                                                                Expired
                                                              </th>
                                                            </tr>
                                                          </thead>
                                                          <tbody className="divide-y">
                                                            {(ing.batches ?? []).map(
                                                              (batch, bIdx) => (
                                                                <tr
                                                                  key={`${ing.inventoryId}-${bIdx}`}
                                                                  className="hover:bg-muted/5"
                                                                >
                                                                  <td className="py-2 font-mono text-foreground">
                                                                    {batch.batchCode}
                                                                  </td>
                                                                  <td className="py-2 font-mono text-center">
                                                                    {batch.quantityUsed}
                                                                  </td>
                                                                  <td className="py-2 font-mono text-center">
                                                                    {batch.expired
                                                                      ? formatDate(batch.expired)
                                                                      : "-/-/-"}
                                                                  </td>
                                                                </tr>
                                                              ),
                                                            )}
                                                            {(!ing.batches || ing.batches.length === 0) && (
                                                              <tr>
                                                                <td colSpan={3} className="py-3 text-center text-muted-foreground">
                                                                  No batch data
                                                                </td>
                                                              </tr>
                                                            )}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    </AccordionContent>
                                                  </AccordionItem>
                                                ),
                                              )}
                                            </Accordion>
                                          </AccordionContent>
                                        </AccordionItem>
                                      ))}
                                    </Accordion>
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>

                          <div className="mt-2">
                            <Pagination
                              currentPage={txnPagination.currentPage}
                              totalPage={txnPagination.totalPage}
                              totalData={txnPagination.totalData}
                              limit={TXN_LIMIT}
                              onPageChange={handlePageChange}
                            />
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* ── Lower Section (Status & Financial) ─────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border">
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
                    </div>

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
                        <span className="text-foreground">
                          Revenue Variance
                        </span>
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
                </>
              )}
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
