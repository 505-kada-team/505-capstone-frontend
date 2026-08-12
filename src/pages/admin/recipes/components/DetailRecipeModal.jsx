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
      <DialogContent className="w-full sm:max-w-xl mx-auto">
        {isLoading || !recipe ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-foreground font-heading">
                {recipe.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {!recipe.costComplete && (
                <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-md flex items-start gap-3">
                  <TriangleAlert className="text-warning w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-warning font-medium">
                    {recipe.warning ||
                      "Some ingredients are inactive or do not have a batch price. Cost estimate cannot be fully calculated."}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  DESCRIPTION
                </h4>
                <p className="text-sm text-foreground">
                  {recipe.description || "No description."}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  INGREDIENTS
                </h4>
                {ingredients.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 font-medium">Ingredient</th>
                          <th className="px-4 py-2 font-medium text-right">
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
                                <span className="ml-2 text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">
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
                  <p className="text-sm text-muted-foreground italic">
                    No ingredients.
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  PACKAGING
                </h4>
                {packaging.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 font-medium">Packaging Item</th>
                          <th className="px-4 py-2 font-medium text-right">
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
                                <span className="ml-2 text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">
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
                  <p className="text-sm text-muted-foreground italic">
                    No packaging items.
                  </p>
                )}
              </div>

              <div className="bg-secondary/20 dark:bg-muted p-4 rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">
                    Cost Estimate
                  </span>
                  <span className="font-mono text-foreground">
                    {recipe.costComplete
                      ? formatCurrency(recipe.currentCostEstimate)
                      : "Rp -"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-foreground">Selling Price</span>
                  <span className="font-mono text-foreground">
                    {formatCurrency(recipe.sellingPrice)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 h-10 text-sm font-semibold px-5"
                onClick={() => onArchive(recipe.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white h-10 text-sm font-semibold px-6 shadow-sm"
                onClick={() => onEdit(recipe.id)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
