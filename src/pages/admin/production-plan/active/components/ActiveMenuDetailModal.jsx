import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatCurrency";
import { ClipboardList } from "lucide-react";

// Daftar unit yang dianggap packaging
const PACKAGING_UNITS = ["pcs"];

export default function ActiveMenuDetailModal({
  isOpen,
  onClose,
  menuId,
  plan,
}) {
  if (!isOpen || !menuId) return null;

  const activeMenuStats = plan?.menus?.find((m) => m.menuId === menuId);

  // Fallback jika data menu tidak ditemukan
  if (!activeMenuStats) {
    return null; // atau tampilkan dialog kosong
  }

  const soldQuantity = activeMenuStats?.soldQuantity || 0;
  const plannedQuantity = activeMenuStats?.quantityPlanned || 0;

  // Harga jual: diskon (jika ada) atau harga normal
  const sellingPrice =
    activeMenuStats?.discount?.discountedPrice ||
    activeMenuStats?.effectiveSellingPrice ||
    activeMenuStats?.frozenSellingPrice ||
    0;

  const details = activeMenuStats?.committedIngredientsDetail || [];

  const ingredientsOnly = details.filter(
    (item) => !PACKAGING_UNITS.includes(item.unit?.toLowerCase()),
  );
  const packagingOnly = details.filter((item) =>
    PACKAGING_UNITS.includes(item.unit?.toLowerCase()),
  );

  const processItem = (item) => {
    const perPorsi =
      plannedQuantity > 0 ? item.quantityNeeded / plannedQuantity : 0;
    const totalQty = perPorsi * soldQuantity;
    const avgCost = item.unitCost || 0;
    const totalCost = avgCost * totalQty;
    return { ...item, perPorsi, totalQty, avgCost, totalCost };
  };

  const processedIngredients = ingredientsOnly.map(processItem);
  const processedPackaging = packagingOnly.map(processItem);

  const recipeCost = [...processedIngredients, ...processedPackaging].reduce(
    (sum, item) => sum + item.perPorsi * item.avgCost,
    0,
  );

  const profitPerUnit = sellingPrice - recipeCost;
  const actualProfit = soldQuantity * profitPerUnit;
  const targetProfit = plannedQuantity * profitPerUnit;
  const profitVariance = actualProfit - targetProfit;

  const formatPeriod = (start, end) => {
    if (!start || !end) return "—";
    const opt = { day: "2-digit", month: "short", year: "numeric" };
    return `${new Date(start).toLocaleDateString("en-US", opt)} - ${new Date(
      end,
    ).toLocaleDateString("en-US", opt)}`;
  };

  const formatQty = (value) =>
    Number(value).toLocaleString("id-ID", { maximumFractionDigits: 2 });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#F97316]" />
            {activeMenuStats.name}
          </DialogTitle>
        </DialogHeader>

        <div className="border-t border-border pt-4 space-y-6">
          <div className="text-xs text-muted-foreground font-medium">
            Plan Period:{" "}
            <span className="text-foreground">
              {formatPeriod(plan?.startDate, plan?.endDate)}
            </span>
          </div>

          {/* Top Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Planned Stock
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {plannedQuantity}{" "}
                <span className="text-xs font-normal">pcs</span>
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Sold Quantity
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {soldQuantity} <span className="text-xs font-normal">pcs</span>
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Recipe Cost
              </div>
              <div className="text-base font-bold font-mono mt-1 text-foreground">
                {formatCurrency(recipeCost)}
              </div>
            </div>
            <div className="border border-border rounded-lg p-3 bg-muted/10">
              <div className="text-xs text-muted-foreground font-medium">
                Selling Price
              </div>
              <div className="text-base font-bold font-mono mt-1 text-green-700 flex flex-col justify-end">
                {activeMenuStats?.discount?.discountPercentage > 0 ? (
                  <>
                    <span>{formatCurrency(sellingPrice)}</span>
                    <span className="text-xs text-muted-foreground line-through font-normal">
                      {formatCurrency(
                        activeMenuStats.effectiveSellingPrice ||
                          activeMenuStats.frozenSellingPrice,
                      )}
                    </span>
                  </>
                ) : (
                  <span>{formatCurrency(sellingPrice)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Ingredient & Packaging Tables */}
          <div className="space-y-6">
            {/* Ingredients section */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Ingredients
              </h3>
              {processedIngredients.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 font-medium">Item Name</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Qty/Unit
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Total
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Cost/Unit
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-normal">
                      {processedIngredients.map((item, idx) => (
                        <tr
                          key={idx}
                          className="bg-background hover:bg-muted/10"
                        >
                          <td className="px-4 py-2 font-medium text-foreground">
                            {item.nameInventory}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs">
                            {formatQty(item.perPorsi)} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs">
                            {formatQty(item.totalQty)} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs">
                            {formatCurrency(item.avgCost)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs text-foreground font-semibold">
                            {formatCurrency(item.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic pl-1">
                  No ingredients in recipe.
                </p>
              )}
            </div>

            {/* Packaging section */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Packaging
              </h3>
              {processedPackaging.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2 font-medium">Item Name</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Qty/Unit
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Total
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Cost/Unit
                        </th>
                        <th className="px-4 py-2 font-medium text-right">
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-normal">
                      {processedPackaging.map((item, idx) => (
                        <tr
                          key={idx}
                          className="bg-background hover:bg-muted/10"
                        >
                          <td className="px-4 py-2 font-medium text-foreground">
                            {item.nameInventory}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs">
                            {formatQty(item.perPorsi)} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs">
                            {formatQty(item.totalQty)} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs">
                            {formatCurrency(item.avgCost)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-xs text-foreground font-semibold">
                            {formatCurrency(item.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic pl-1">
                  No packaging in recipe.
                </p>
              )}
            </div>

            {/* Profit Summary card */}
            <div className="border border-border bg-secondary/10 dark:bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-1.5">
                Profit Summary
              </h4>
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
                  Target Profit
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
