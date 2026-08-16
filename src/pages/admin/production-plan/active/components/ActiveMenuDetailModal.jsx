import { useState, useEffect, useCallback } from "react";
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
import { formatCurrency } from "@/lib/formatCurrency";
import { ClipboardList, User, CalendarClock, Search } from "lucide-react";

import PlanInventoryAccordion from "@/components/shared/PlanInventoryAccordion";
import Pagination from "@/components/shared/Pagination";
import { getSellingHistory } from "@/services/api";

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
  const date = new Date(dateStr);
  const datePart = formatDate(dateStr);
  const timePart = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}

const TXN_LIMIT = 5;

export default function ActiveMenuDetailModal({
  isOpen,
  onClose,
  menuId,
  plan,
}) {
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

  const fetchTransactions = useCallback(
    async (page = 1) => {
      if (!plan?.id || !menuId) return;
      setTxnLoading(true);
      setTxnError(null);
      try {
        const params = {
          planId: plan.id,
          menuId,
          page,
          limit: TXN_LIMIT,
        };
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
    [plan, menuId, filterDate, filterStartTime, filterEndTime],
  );

  useEffect(() => {
    if (isOpen) {
      fetchTransactions(1);
    }
  }, [isOpen, fetchTransactions]);

  const handleFilterSubmit = () => {
    fetchTransactions(1);
  };

  const handlePageChange = (page) => {
    fetchTransactions(page);
  };

  if (!isOpen || !menuId || !plan) return null;

  const activeMenu = plan.menus?.find((m) => m.menuId === menuId);
  if (!activeMenu) return null;

  const soldQuantity = activeMenu.soldQuantity || 0;
  const plannedQuantity = activeMenu.quantityPlanned || 0;
  const remainingQuantity = activeMenu.remainingQuantity || 0;
  const lossQuantity = activeMenu.lossQuantity || 0;

  const effectiveSellingPrice =
    activeMenu.effectiveSellingPrice || activeMenu.frozenSellingPrice || 0;
  const sellingPrice =
    activeMenu.discount?.discountedPrice || effectiveSellingPrice;

  const costPerPortion = activeMenu.costPerPortion || 0;
  const recipeCost = costPerPortion;
  const profitPerUnit = sellingPrice - recipeCost;
  const actualProfit = soldQuantity * profitPerUnit;
  const targetProfit = plannedQuantity * profitPerUnit;
  const profitVariance = actualProfit - targetProfit;

  const disc = activeMenu.discount || {};
  const menuHasDiscount = disc.discountPercentage > 0;

  const estimatedProfit = activeMenu.estimatedProfit ?? null;

  const menuInventoryIds = new Set(
    (activeMenu.ingredientsDetail ?? []).map((ing) => ing.inventoryId),
  );
  const menuInventoryList = (plan.inventoryList ?? []).filter((inv) =>
    menuInventoryIds.has(inv.inventoryId),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-3xl mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#F97316]" />
            {activeMenu.name}
          </DialogTitle>
        </DialogHeader>

        <div className="border-t border-border pt-4 space-y-4">
          <div className="text-xs text-muted-foreground font-medium">
            Plan Period:{" "}
            <span className="text-foreground">
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </span>
          </div>

          {/* ── Top Info Cards ──────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Planned
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {plannedQuantity}{" "}
                <span className="text-xs font-normal">pcs</span>
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Sold
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {soldQuantity}{" "}
                <span className="text-xs font-normal">pcs</span>
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Remaining
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {remainingQuantity}{" "}
                <span className="text-xs font-normal">pcs</span>
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Loss
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {lossQuantity}{" "}
                <span className="text-xs font-normal">pcs</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Selling Price
              </div>
              <div className="text-base font-bold font-mono mt-1 text-green-700 flex flex-col justify-end">
                {menuHasDiscount ? (
                  <>
                    <span>{formatCurrency(sellingPrice)}</span>
                    <span className="text-xs text-muted-foreground line-through font-normal">
                      {formatCurrency(effectiveSellingPrice)}
                    </span>
                  </>
                ) : (
                  <span>{formatCurrency(sellingPrice)}</span>
                )}
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Cost / Portion
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {formatCurrency(costPerPortion)}
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Discount
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {menuHasDiscount ? (
                  <span className="text-[#F97316]">
                    {disc.discountPercentage}%{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({disc.reason || "Discount"})
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Tabs ────────────────────────────────────────────── */}
          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="mb-4 w-full grid grid-cols-2">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            </TabsList>

            {/* ── Tab Inventory ──────────────────────────────────── */}
            <TabsContent value="inventory" className="min-w-0">
              <PlanInventoryAccordion
                inventoryList={menuInventoryList}
                defaultOpen
              />
            </TabsContent>

            {/* ── Tab Transaksi ──────────────────────────────────── */}
            <TabsContent value="transactions" className="min-w-0">
              {/* Filter bar */}
              <div className="flex flex-wrap items-end gap-2 mb-4 p-3 border border-border rounded-lg bg-muted/10">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="h-8 w-[150px] text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={filterStartTime}
                    onChange={(e) => setFilterStartTime(e.target.value)}
                    className="h-8 w-[120px] text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={filterEndTime}
                    onChange={(e) => setFilterEndTime(e.target.value)}
                    className="h-8 w-[120px] text-xs"
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

              {/* Transaction list */}
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
                  No transactions for this menu yet
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
                                                              ? formatDate(
                                                                  batch.expired,
                                                                )
                                                              : "-/-/-"}
                                                          </td>
                                                        </tr>
                                                      ),
                                                    )}
                                                    {(!ing.batches ||
                                                      ing.batches.length ===
                                                        0) && (
                                                      <tr>
                                                        <td
                                                          colSpan={3}
                                                          className="py-3 text-center text-muted-foreground"
                                                        >
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

          {/* ── Profit Summary ──────────────────────────────────── */}
          <div className="border border-border bg-secondary/10 dark:bg-muted/30 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-1.5">
              Profit Summary
            </h4>
            {estimatedProfit != null && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">
                  Estimated Profit
                </span>
                <span className="font-mono font-bold text-[#4E6A3E]">
                  {formatCurrency(estimatedProfit)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">
                Actual Profit
              </span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(actualProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">
                Discount Target Profit
              </span>
              <span className="font-mono font-bold text-[#4E6A3E]">
                {formatCurrency(targetProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-dashed border-border pt-2 font-bold">
              <span className="text-foreground">Profit Variance</span>
              <span
                className={`font-mono ${
                  profitVariance < 0 ? "text-[#C4441F]" : "text-green-700"
                }`}
              >
                {profitVariance < 0 ? "-" : ""}
                {formatCurrency(Math.abs(profitVariance))}
              </span>
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
      </DialogContent>
    </Dialog>
  );
}
