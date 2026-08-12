import { useEffect } from "react";
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
import { useCreateMenu } from "@/hooks/menu/useCreateMenu";
import { useInventoryOptions } from "@/hooks/inventory/useInventoryOptions";
import RecipeFormFields from "./RecipeFormFields";
import { resolveIngredientsForSubmit } from "@/lib/inventoryUnit";

export default function AddRecipeModal({ isOpen, onClose, onSuccess }) {
  const formState = useRecipeForm();
  const {
    inventoryOptions,
    isLoading: isLoadingInv,
    fetchInventoryOptions,
  } = useInventoryOptions();
  const { createRecipe, isSubmitting } = useCreateMenu();

  useEffect(() => {
    if (isOpen) {
      formState.reset();
      fetchInventoryOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onSubmit = async (data) => {
    // 1. Validasi unit bahan & konversi satuan
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

    // 2. Kirim data yang sudah di‑resolve
    try {
      const res = await createRecipe({ ...data, ingredients: resolved });
      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      }
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors) {
        // Menampilkan error spesifik ke field yang sesuai
        apiErrors.forEach((e) => {
          const field = e.field.startsWith("ingredients")
            ? e.field // langsung gunakan nama field dari server, misal `ingredients.0.inventoryId`
            : e.field;
          formState.form.setError(field, { message: e.message });
        });
      } else {
        toast.error("Gagal menyimpan resep");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-bold font-heading text-foreground">
            Add New Recipe
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={formState.form.handleSubmit(onSubmit)}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto lg:overflow-hidden p-6 min-h-0 flex flex-col">
            <RecipeFormFields
              formState={formState}
              inventoryOptions={inventoryOptions}
              isLoadingInv={isLoadingInv}
              mode="create"
            />
          </div>

          <DialogFooter className="p-6 border-t bg-muted/15 flex justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              className="h-10 text-sm font-semibold px-5"
              onClick={onClose}
              disabled={isSubmitting}
            >
            <Button
              type="button"
              variant="outline"
              className="h-10 text-sm font-semibold px-5"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white h-10 text-sm font-semibold px-6 shadow-sm shadow-[#F97316]/20 transition-all active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
