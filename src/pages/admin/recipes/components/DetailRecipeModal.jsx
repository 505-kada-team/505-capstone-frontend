import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatCurrency";
import { TriangleAlert, Trash2, Edit2 } from "lucide-react";
import { useMenuDetail } from "@/hooks/menu/useMenuDetail";
import { toast } from "sonner";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function DetailRecipeModal({
  isOpen,
  onClose,
  recipeId,
  onArchive,
  onEdit,
}) {
  const { recipe, isLoading, error } = useMenuDetail(recipeId, {
    enabled: isOpen,
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
      onClose?.();
    }
  }, [error, onClose]);

  if (!isOpen) return null;

  const ingredients =
    recipe?.ingredients?.filter((item) => item.category === "ingredients") ||
    [];

  const packaging =
    recipe?.ingredients?.filter((item) => item.category === "packaging") || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-full max-w-xl max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-xl">
        {isLoading || !recipe ? (
          <div className="flex flex-col flex-1 overflow-hidden animate-pulse">
            <DialogHeader className="shrink-0 border-b px-6 py-5">
              <DialogTitle className="font-heading text-2xl font-bold text-foreground">
                <Skeleton className="h-8 w-48" />
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Table */}
              <div className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground border-b border-border">
                      <tr>
                        <th className="py-4 px-4 font-semibold"></th>
                        <th className="py-4 px-4 text-right font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="py-3 px-4"><Skeleton className="h-4 w-28 bg-muted/60" /></td>
                          <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto bg-muted/60" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t bg-muted/10 px-6 py-4 flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20 ml-auto" />
            </DialogFooter>
          </div>
        ) : (

          <>
            <DialogHeader className="shrink-0 border-b px-6 py-5">
              <DialogTitle className="font-heading text-2xl font-bold text-foreground">
                {recipe.name}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {!recipe.costComplete && (
                  <div className="flex items-start gap-3 rounded-r-md border-l-4 border-warning bg-warning/10 p-4">
                    <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />

                    <p className="text-sm font-medium text-warning">
                      {recipe.warning ||
                        "Some inactive ingredients do not yet have a batch price. The estimated cost cannot be fully calculated."}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </h4>

                  <p className="text-sm text-foreground">
                    {recipe.description || "No description."}
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ingredients
                  </h4>

                  {ingredients.length > 0 ? (
                    <div className="overflow-hidden rounded-md border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2 font-medium">
                              Ingredient
                            </th>

                            <th className="px-4 py-2 text-right font-medium">
                              Quantity
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y">
                          {ingredients.map((item, idx) => (
                            <tr key={idx} className="bg-background">
                              <td className="px-4 py-2">
                                {item.nameInventory}

                                {item.inventoryStatus === "deleted" && (
                                  <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-600">
                                    Deleted
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-2 text-right font-mono">
                                {item.quantityNeeded} {item.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No ingredients available.
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Packaging
                  </h4>

                  {packaging.length > 0 ? (
                    <div className="overflow-hidden rounded-md border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2 font-medium">
                              Packaging
                            </th>

                            <th className="px-4 py-2 text-right font-medium">
                              Quantity
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y">
                          {packaging.map((item, idx) => (
                            <tr key={idx} className="bg-background">
                              <td className="px-4 py-2">
                                {item.nameInventory}

                                {item.inventoryStatus === "deleted" && (
                                  <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-600">
                                    Deleted
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-2 text-right font-mono">
                                {item.quantityNeeded} {item.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No packaging available.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Selling Price
                      </p>

                      <p className="mt-1 font-mono text-base font-semibold text-foreground">
                        {formatCurrency(recipe.sellingPrice)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Estimated Cost
                      </p>

                      <p className="mt-1 font-mono text-base font-semibold text-foreground">
                        {recipe.costComplete && recipe.currentCostEstimate != null
                          ? formatCurrency(recipe.currentCostEstimate)
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Estimated Margin
                      </p>

                      <p className="mt-1 font-mono text-base font-semibold text-foreground">
                        {recipe.costComplete && recipe.marginEstimate != null
                          ? formatCurrency(recipe.marginEstimate)
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Margin
                      </p>

                      <p className="mt-1 font-mono text-base font-semibold text-foreground">
                        {recipe.costComplete && recipe.marginPercentage != null
                          ? `${recipe.marginPercentage.toFixed(2)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

           <DialogFooter className="shrink-0 border-t bg-background px-6 py-5">
              <div className="flex w-full justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-destructive px-4 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  onClick={() => onArchive(recipe.id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>

                <Button
                  size="sm"
                  className="h-9 bg-[#F97316] px-4 text-xs font-semibold text-white hover:bg-[#F97316]/90"
                  onClick={() => onEdit(recipe.id)}
                >
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}