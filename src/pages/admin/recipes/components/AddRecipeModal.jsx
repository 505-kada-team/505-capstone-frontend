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

    const onSubmit = async (data) => {
      const { resolved, errors } = resolveIngredientsForSubmit(
        data.ingredients,
        inventoryOptions,
      );

      if (errors.length > 0) {
        errors.forEach((error) =>
          formState.form.setError(`ingredients.${error.index}.quantityNeeded`, {
            message: error.message,
          }),
        );

        toast.error("Some ingredients have an unrecognized unit. Please check again.");
        return;
      }

      try {
        const res = await createRecipe(
          { ...data, ingredients: resolved },
          formState.imageFile,
        );

        if (res.success) {
          toast.success(res.message);
          onSuccess();
          onClose();
        }
      } catch (err) {
        const status = err?.response?.status;
        const response = err?.response?.data;
        const apiErrors = response?.errors;

        console.error("[CREATE RECIPE ERROR]", response);

        if (status === 409) {
          formState.form.setError("name", {
            type: "server",
            message: `A recipe with the name "${data.name}" already exists`
          });
          return;
        }

        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((error) => {
            if (!error?.field) return;

            formState.form.setError(error.field, {
              type: "server",
              message: error.message,
            });
          });
          return;
        }

        toast.error(response?.message ?? "Failed to save recipe");
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
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 px-6 text-sm font-semibold bg-accent text-white hover:bg-accent/90"
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
