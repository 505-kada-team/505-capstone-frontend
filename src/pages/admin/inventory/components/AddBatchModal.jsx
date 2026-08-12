import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useBatchMutations } from "@/hooks/inventory/useBatchMutations";
import { addSubInventorySchema } from "@/schemas/inventorySchema";

// parentInventory datang dari mapInventoryDetail(), jadi field-nya
// `id`, `name`, `category`, `unit` — bukan `_id`/`nameInventory`.
export default function AddBatchModal({
  open,
  onClose,
  parentInventory,
  onSuccess,
}) {
  const { addBatch, isAddingBatch, addBatchError, resetAddBatchError } =
    useBatchMutations();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addSubInventorySchema),
    defaultValues: {
      quantity: "",
      costPrices: "",
      expired: "",
      inDate: new Date().toISOString(),
    },
  });

  const isPackaging = parentInventory?.category === "packaging";

  useEffect(() => {
    if (open) {
      reset();
      resetAddBatchError();
      setValue("inDate", new Date().toISOString());
      if (isPackaging) {
        setValue("expired", null);
      }
    }
  }, [open, reset, isPackaging, setValue, resetAddBatchError]);

  const onSubmit = async (data) => {
    if (parentInventory?.category === "ingredients" && !data.expired) {
      setError("expired", {
        message: "Kadaluarsa wajib diisi untuk kategori ingredients",
      });
      return;
    }

    try {
      await addBatch(parentInventory.id, data);
      onSuccess?.();
      onClose();
    } catch {
      // addBatchError sudah di-set di dalam hook
    }
  };

  if (!parentInventory) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-[425px] p-6" id="add-batch-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-semibold">
            Add New Inventory Batch
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Readonly Item Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nama Item</Label>
            <Input
              value={parentInventory.name}
              disabled
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="inline-block w-3 h-3 rounded-full border border-current opacity-50 flex items-center justify-center text-[8px]">
                i
              </span>
              Kategori:{" "}
              {parentInventory.category === "packaging"
                ? "Packaging"
                : "Ingredient"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-1.5 relative">
              <Label htmlFor="batch-qty" className="text-sm font-medium">
                Jumlah <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="batch-qty"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  aria-invalid={!!errors.quantity}
                  {...register("quantity")}
                  className="pr-12"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-sm text-muted-foreground font-mono">
                    {parentInventory.unit}
                  </span>
                </div>
              </div>
              {errors.quantity && (
                <p className="text-xs text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Cost Price */}
            <div className="space-y-1.5 relative">
              <Label htmlFor="batch-cost" className="text-sm font-medium">
                Harga per Unit <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-sm text-muted-foreground font-mono">
                    Rp
                  </span>
                </div>
                <Input
                  id="batch-cost"
                  type="number"
                  step="any"
                  placeholder="0"
                  aria-invalid={!!errors.costPrices}
                  {...register("costPrices")}
                  className="pl-9"
                />
              </div>
              {errors.costPrices && (
                <p className="text-xs text-destructive">
                  {errors.costPrices.message}
                </p>
              )}
            </div>
          </div>

          {/* Expired Date */}
          <div className="space-y-1.5">
            <Label htmlFor="batch-expired" className="text-sm font-medium">
              Kadaluarsa{" "}
              {parentInventory.category === "ingredients" && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Input
              id="batch-expired"
              type="date"
              disabled={isPackaging}
              aria-invalid={!!errors.expired}
              {...register("expired")}
              onChange={(e) => {
                register("expired").onChange(e);
                if (e.target.value) clearErrors("expired");
              }}
              value={isPackaging ? "" : undefined}
              className={isPackaging ? "bg-muted text-muted-foreground" : ""}
              placeholder={isPackaging ? "—" : ""}
            />
            {isPackaging && (
              <p className="text-xs text-muted-foreground italic">
                Item packaging tidak memerlukan tanggal kadaluarsa.
              </p>
            )}
            {errors.expired && !isPackaging && (
              <p className="text-xs text-destructive">
                {errors.expired.message}
              </p>
            )}
          </div>

          {/* Server error */}
          {addBatchError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
              <TriangleAlert size={15} className="text-destructive shrink-0" />
              <p className="text-sm text-destructive">{addBatchError}</p>
            </div>
          )}

          <div className="flex w-full justify-end gap-3 pt-2">
            <Button
              id="add-batch-cancel"
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isAddingBatch}
              className="px-6"
            >
              Batal
            </Button>
            <Button
              id="add-batch-submit"
              type="submit"
              disabled={isAddingBatch}
              className="px-6 bg-[#F97316] text-white hover:bg-[#F97316]/90"
            >
              {isAddingBatch ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
