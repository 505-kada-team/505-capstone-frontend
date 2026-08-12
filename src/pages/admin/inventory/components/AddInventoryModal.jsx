import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useInventoryMutations } from "@/hooks/inventory/useInventoryMutations";
import { createInventorySchema } from "@/schemas/inventorySchema";

const CATEGORY_OPTIONS = [
  { value: "ingredients", label: "Ingredients" },
  { value: "packaging", label: "Packaging" },
];

const UNIT_OPTIONS = [
  { value: "gr", label: "Gram (gr)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "pcs", label: "Pieces (pcs)" },
];

export default function AddInventoryModal({ open, onClose, onSuccess }) {
  const { createInventory, isCreating, createError, resetCreateError } =
    useInventoryMutations();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createInventorySchema),
    defaultValues: {
      name: "",
      itemCode: "",
      category: "ingredients",
      unit: "gr",
      description: "",
    },
  });

  const selectedCategory = watch("category");

  useEffect(() => {
    if (open) {
      reset();
      resetCreateError();
    }
  }, [open, reset, resetCreateError]);

  const onSubmit = async (data) => {
    try {
      await createInventory(data);
      onSuccess?.();
      onClose();
    } catch {
      // createError sudah di-set di dalam hook
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" id="add-inventory-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-semibold">
            Add New Inventory Item
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Item Name */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-name" className="text-sm font-medium">
              Item Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inv-name"
              placeholder="Contoh: Bubuk Kopi Arabica"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Item Code */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-code" className="text-sm font-medium">
              Item Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inv-code"
              placeholder="Contoh: ING-KOP-001"
              aria-invalid={!!errors.itemCode}
              {...register("itemCode")}
            />
            {errors.itemCode && (
              <p className="text-xs text-destructive">
                {errors.itemCode.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Kategori <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(val) => setValue("category", val)}
              >
                <SelectTrigger aria-invalid={!!errors.category}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Satuan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("unit")}
                onValueChange={(val) => setValue("unit", val)}
              >
                <SelectTrigger aria-invalid={!!errors.unit}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-xs text-destructive">
                  {errors.unit.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-desc" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="inv-desc"
              placeholder="Deskripsi singkat tentang item ini..."
              rows={3}
              {...register("description")}
              className="resize-none"
            />
          </div>

          {/* Server error */}
          {createError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
              <TriangleAlert size={15} className="text-destructive shrink-0" />
              <p className="text-sm text-destructive">{createError}</p>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              id="add-inventory-cancel"
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              id="add-inventory-submit"
              type="submit"
              disabled={isCreating}
              className="bg-[#F97316] text-white hover:bg-[#F97316]/90"
            >
              {isCreating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
