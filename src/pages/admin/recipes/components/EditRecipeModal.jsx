import { useMemo, useEffect } from "react";
import {
  toDisplayQuantity,
  resolveIngredientsForSubmit,
} from "@/lib/inventoryUnit";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRecipeForm } from "@/hooks/menu/useRecipeForm";
import { useMenuDetail } from "@/hooks/menu/useMenuDetail";
import { useUpdateMenu } from "@/hooks/menu/useUpdateMenu";
import { useInventoryOptions } from "@/hooks/inventory/useInventoryOptions";
import RecipeFormFields from "./RecipeFormFields";

export default function EditRecipeModal({
  isOpen,
  onClose,
  recipeId,
  onSuccess,
}) {
  const { recipe, isLoading: isLoadingRecipe } = useMenuDetail(recipeId, {
    enabled: isOpen,
  });
  const {
    inventoryOptions,
    isLoading: isLoadingInv,
    fetchInventoryOptions,
  } = useInventoryOptions();
  const { updateRecipe, isUpdating } = useUpdateMenu();

  // recipe.ingredients dari mapMenuDetail sudah punya `unit`/`category` per
  // baris (buildCostBreakdown backend), jadi konversi tampilan tidak perlu
  // nunggu inventoryOptions selesai fetch — langsung pakai data recipe.
  const initialValues = useMemo(() => {
    if (!recipe) return undefined;
    return {
      name: recipe.name,
      description: recipe.description,
      image: recipe.image ?? undefined,
      sellingPrice: recipe.sellingPrice,
      ingredients: recipe.ingredients.map((ing) => ({
        inventoryId: ing.inventoryId,
        quantityNeeded: toDisplayQuantity({
          unit: ing.unit,
          category: ing.category,
          amount: ing.quantityNeeded,
        }),
      })),
    };
  }, [recipe]);

  const formState = useRecipeForm(initialValues);

  useEffect(() => {
    if (isOpen) fetchInventoryOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onSubmit = async (data) => {
    try {
      const { resolved, errors } = resolveIngredientsForSubmit(
        data.ingredients,
        inventoryOptions,
      );
      if (errors.length > 0) {
        errors.forEach((e) =>
          formState.form.setError(`ingredients.${e.index}.quantityNeeded`, {
            message: e.message,
          }),
        );
        toast.error("Ada bahan dengan unit yang tidak dikenali, cek kembali.");
        return;
      }

      const res = await updateRecipe(recipeId, {
        ...data,
        ingredients: resolved,
      });
      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      }
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        apiErrors.forEach((e) => {
          const field = e.field.startsWith("ingredients")
            ? "ingredients"
            : e.field;
          formState.form.setError(field, { message: e.message });
        });
      } else {
        console.error("EditRecipeModal onSubmit error:", err);
        toast.error("Gagal memperbarui resep");
      }
    }
  };

  const onInvalid = (errors) => {
    // Fallback supaya submit yang diblok oleh validasi RHF/Zod tidak diam
    // total — ini biasanya penyebab "tombol save tidak bekerja tanpa error".
    console.warn("Form validation blocked submit:", errors);
    toast.error("Ada isian yang belum valid, cek kembali form-nya.");
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-bold font-heading text-foreground">
            Edit Recipe
          </DialogTitle>
        </DialogHeader>

        {isLoadingRecipe || !recipe ? (
          <div className="py-16 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <form
            onSubmit={formState.form.handleSubmit(onSubmit, onInvalid)}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto lg:overflow-hidden p-6 min-h-0 flex flex-col">
              <RecipeFormFields
                formState={formState}
                inventoryOptions={inventoryOptions}
                isLoadingInv={isLoadingInv}
                mode="edit"
              />
            </div>

            <DialogFooter className="p-6 border-t bg-muted/15 flex justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                className="h-10 text-sm font-semibold px-5"
                onClick={onClose}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white h-10 text-sm font-semibold px-6 shadow-sm shadow-[#F97316]/20 transition-all active:scale-[0.98]"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}