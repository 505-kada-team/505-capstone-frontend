import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Calendar as CalendarIcon, Coffee } from "lucide-react";
import { format } from "date-fns";
import { useDeletePlanPromo } from "@/hooks/plan/usePlanDiscount";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog"; // reuse existing component

export default function DiscountDetailModal({
  isOpen,
  onClose,
  planId,
  promo,
  onEdit,
  onDelete, // callback to refresh parent data
}) {
  const { isDeleting, deletePromo } = useDeletePlanPromo(planId, {
    onDeleted: () => {
      // only refresh data, do NOT close here
      onDelete?.();
    },
  });

  const [deletingMenuId, setDeletingMenuId] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);

  if (!isOpen || !promo) return null;

  const handleDeleteMenu = (menu) => {
    setMenuToDelete(menu);
  };

  const confirmDeleteMenu = async () => {
    if (!menuToDelete) return;
    setDeletingMenuId(menuToDelete.menuId);
    try {
      await deletePromo(menuToDelete.menuId);
      toast.success(`Discount for "${menuToDelete.name}" removed.`);
      setMenuToDelete(null);
    } catch {
      toast.error("Failed to remove discount for this menu.");
    } finally {
      setDeletingMenuId(null);
    }
  };

  const handleDeleteAll = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    const menuIds = promo.menus.map((m) => m.menuId);
    if (menuIds.length === 0) {
      toast.info("No discounts to delete.");
      setShowDeleteAllConfirm(false);
      return;
    }

    try {
      await deletePromo(menuIds);
      toast.success("All discounts deleted.");
      setShowDeleteAllConfirm(false);
      onClose(); // close modal only after successful delete all
    } catch {
      toast.error("Failed to delete all discounts.");
      setShowDeleteAllConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Discount Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* Main Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                General Information
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Promo Name
                  </span>
                  <p className="font-semibold text-sm">{promo.reason}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Period</span>
                  <div className="flex items-center text-sm font-medium gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    {format(new Date(promo.startDate), "d MMM yyyy")} –{" "}
                    {format(new Date(promo.endDate), "d MMM yyyy")}
                  </div>
                </div>
              </div>
            </div>

            {/* Discounted Menus */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                  Discounted Menus
                </h4>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-semibold">
                  {promo.menus.length} Menus
                </span>
              </div>

              <div className="border rounded-xl max-h-60 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs text-muted-foreground sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Menu Name</th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        Original Price
                      </th>
                      <th className="px-4 py-2.5 font-medium text-center">
                        Discount
                      </th>
                      <th className="px-4 py-2.5 font-medium text-right">
                        Promo Price
                      </th>
                      <th className="px-4 py-2.5 font-medium text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {promo.menus.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-muted-foreground"
                        >
                          No menus with discount.
                        </td>
                      </tr>
                    ) : (
                      promo.menus.map((menu) => (
                        <tr key={menu.menuId} className="bg-background">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                                <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                              {menu.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                            Rp {menu.originalPrice?.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-md text-xs">
                              {menu.discountPercentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            Rp {menu.discountedPrice?.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              disabled={
                                isDeleting || deletingMenuId === menu.menuId
                              }
                              onClick={() => handleDeleteMenu(menu)}
                            >
                              {deletingMenuId === menu.menuId ? (
                                "Removing..."
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleDeleteAll}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All Discounts
            </Button>
            <Button
              type="button"
              onClick={() => {
                onClose();
                onEdit(promo);
              }}
              disabled={isDeleting}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deleting a single menu */}
      <ConfirmDialog
        open={!!menuToDelete}
        onClose={() => setMenuToDelete(null)}
        onConfirm={confirmDeleteMenu}
        title="Delete menu discount?"
        description={`Remove discount for "${menuToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deletingMenuId !== null}
        variant="destructive"
      />

      {/* Confirmation dialog for deleting all discounts */}
      <ConfirmDialog
        open={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={confirmDeleteAll}
        title="Delete all discounts?"
        description="This will remove the discount from all menus in this promo."
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        loading={isDeleting}
        variant="destructive"
      />
    </>
  );
}
