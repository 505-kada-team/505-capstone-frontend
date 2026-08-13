import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMenuDetail } from "@/hooks/menu/useMenuDetail";
import { formatCurrency } from "@/lib/formatCurrency";
import { TriangleAlert, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export default function ActiveMenuDetailModal({
  isOpen,
  onClose,
  menuId,
  plan,
}) {
  const { recipe, isLoading, error } = useMenuDetail(menuId, {
    enabled: isOpen && !!menuId,
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
      onClose?.();
    }
  }, [error, onClose]);

  if (!isOpen || !menuId) return null;

  // Find matching menu in the active plan to get planning & sales stats
  const activeMenuStats = plan?.menus?.find((m) => m.menuId === menuId);
  const soldQuantity = activeMenuStats?.soldQuantity || 0;
  const plannedQuantity = activeMenuStats?.quantityPlanned || 0;
  const sellingPrice = activeMenuStats?.currentPrice || activeMenuStats?.frozenSellingPrice || 0;

  // Helper: calculate weighted average cost from menu's committed ingredients detail
  const getWeightedAvgCost = (inventoryId) => {
    const details = activeMenuStats?.committedIngredientsDetail;
    if (!details) return 0;
    const item = details.find((ci) => ci.inventoryId === inventoryId);
    if (!item) return 0;
    // Use unitCost directly if available
    if (item.unitCost) return item.unitCost;
    // Fallback: use costContribution / quantityNeeded if both exist
    if (item.costContribution && item.quantityNeeded) {
      return item.costContribution / item.quantityNeeded;
    }
    return 0;
  };

  // Process ingredients list
  const getProcessedIngredients = () => {
    if (!recipe?.ingredients) return [];
    return recipe.ingredients.map((item) => {
      // Get weighted average cost from plan's committed batches
      let avgCost = getWeightedAvgCost(item.inventoryId);
      // Fallback to recipe's current cost per unit if not committed or 0
      if (avgCost === 0) {
        avgCost = item.currentCostPerUnit || 0;
      }
      
      const totalQty = item.quantityNeeded * soldQuantity;
      const totalCost = totalQty * avgCost;

      return {
        ...item,
        avgCost,
        totalQty,
        totalCost,
      };
    });
  };

  const processedIngredients = getProcessedIngredients();
  const ingredientsOnly = processedIngredients.filter(
    (item) => item.category === "ingredients"
  );
  const packagingOnly = processedIngredients.filter(
    (item) => item.category === "packaging"
  );

  // Modal Recipe Cost: Sum of ingredient costs per portion
  const recipeCost = processedIngredients.reduce(
    (sum, item) => sum + item.quantityNeeded * item.avgCost,
    0
  );

  // Financial summary calculations
  const profitPerUnit = sellingPrice - recipeCost;
  const actualProfit = soldQuantity * profitPerUnit;
  const targetProfit = plannedQuantity * profitPerUnit;
  const profitVariance = actualProfit - targetProfit;

  // Format Date Helper
  const formatPeriod = (start, end) => {
    if (!start || !end) return "—";
    const opt = { day: "2-digit", month: "short", year: "numeric" };
    return `${new Date(start).toLocaleDateString("en-US", opt)} - ${new Date(
      end
    ).toLocaleDateString("en-US", opt)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl mx-auto max-h-[85vh] overflow-y-auto">
        {isLoading || !recipe ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading menu metrics...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#F97316]" />
                {recipe.name}
              </DialogTitle>
            </DialogHeader>

            <div className="border-t border-border pt-4 mt-2 space-y-6">
              <div className="text-xs text-muted-foreground font-medium">
                Plan Period:{" "}
                <span className="text-foreground">
                  {formatPeriod(plan?.startDate, plan?.endDate)}
                </span>
              </div>

              {/* Top Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <div className="text-xs text-muted-foreground font-medium">Planned Stock</div>
                <div className="text-base font-bold font-mono mt-1 text-foreground">
                  {plannedQuantity} <span className="text-xs font-normal">pcs</span>
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <div className="text-xs text-muted-foreground font-medium">Sold Quantity</div>
                <div className="text-base font-bold font-mono mt-1 text-foreground">
                  {soldQuantity} <span className="text-xs font-normal">pcs</span>
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <div className="text-xs text-muted-foreground font-medium">Recipe Cost</div>
                <div className="text-base font-bold font-mono mt-1 text-foreground">
                  {formatCurrency(recipeCost)}
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <div className="text-xs text-muted-foreground font-medium">Selling Price</div>
                <div className="text-base font-bold font-mono mt-1 text-green-700 flex flex-col justify-end">
                  {activeMenuStats?.discount?.discountPercentage > 0 ? (
                    <>
                      <span>{formatCurrency(activeMenuStats.discount.discountedPrice)}</span>
                      <span className="text-xs text-muted-foreground line-through font-normal">
                        {formatCurrency(activeMenuStats.frozenSellingPrice || activeMenuStats.effectiveSellingPrice || sellingPrice)}
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
                {ingredientsOnly.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground text-xs uppercase">
                        <tr>
                          <th className="px-4 py-2 font-medium">Item Name</th>
                          <th className="px-4 py-2 font-medium text-right">Qty/Unit</th>
                          <th className="px-4 py-2 font-medium text-right">Total</th>
                          <th className="px-4 py-2 font-medium text-right">Cost/Unit</th>
                          <th className="px-4 py-2 font-medium text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-normal">
                        {ingredientsOnly.map((item, idx) => (
                          <tr key={idx} className="bg-background hover:bg-muted/10">
                            <td className="px-4 py-2 font-medium text-foreground">
                              {item.nameInventory}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-xs">
                              {item.quantityNeeded} {item.unit}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-xs">
                              {item.totalQty.toLocaleString("id-ID")} {item.unit}
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
                {packagingOnly.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground text-xs uppercase">
                        <tr>
                          <th className="px-4 py-2 font-medium">Item Name</th>
                          <th className="px-4 py-2 font-medium text-right">Qty/Unit</th>
                          <th className="px-4 py-2 font-medium text-right">Total</th>
                          <th className="px-4 py-2 font-medium text-right">Cost/Unit</th>
                          <th className="px-4 py-2 font-medium text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-normal">
                        {packagingOnly.map((item, idx) => (
                          <tr key={idx} className="bg-background hover:bg-muted/10">
                            <td className="px-4 py-2 font-medium text-foreground">
                              {item.nameInventory}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-xs">
                              {item.quantityNeeded} {item.unit}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-xs">
                              {item.totalQty.toLocaleString("id-ID")} {item.unit}
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
                  <span className="text-muted-foreground font-medium">Actual Profit</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(actualProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Target Profit</span>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
