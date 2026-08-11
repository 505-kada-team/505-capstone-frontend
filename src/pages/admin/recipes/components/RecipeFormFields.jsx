import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UploadCloud, Trash2 } from "lucide-react";

export default function RecipeFormFields({
  formState,
  inventories,
  isLoadingInv,
}) {
  const {
    form,
    fields,
    append,
    remove,
    previewImage,
    dragActive,
    calculateTotalCost,
    handleDrag,
    handleDrop,
    handleChangeFile,
    clearImage,
  } = formState;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 min-h-0">
      <div className="lg:col-span-6 space-y-5 lg:overflow-y-auto lg:min-h-0 lg:pr-2 custom-scrollbar">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recipe Name
          </label>
          <Input
            placeholder="e.g. Iced Cafe Latte"
            className="h-10 text-sm"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-xs font-medium">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cost Estimate
            </label>
            <div className="h-10 flex items-center bg-muted/35 px-3 rounded-lg border border-border/40 font-mono text-sm text-foreground/80">
              <span className="text-muted-foreground mr-1">Rp</span>
              <span className="font-semibold text-sm">
                {calculateTotalCost(inventories).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Selling Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                Rp
              </span>
              <Input
                type="number"
                placeholder="0"
                step="1"
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                }}
                className="pl-8 h-10 font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                {...form.register("sellingPrice", { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.sellingPrice && (
              <p className="text-destructive text-xs font-medium">
                {form.formState.errors.sellingPrice.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recipe Picture
            </label>
            <div
              className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center relative transition-all h-28 ${
                dragActive
                  ? "border-accent bg-accent/5"
                  : "border-border bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {previewImage ? (
                <div className="relative w-full h-full flex justify-center items-center">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-full object-contain rounded-lg shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-1 -right-1 rounded-full h-8 w-8 p-0 shadow-md hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleChangeFile}
                  />
                  <UploadCloud className="w-8 h-8 text-muted-foreground mb-1.5 opacity-60" />
                  <p className="text-sm font-semibold text-foreground">
                    Upload Picture
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    PNG or JPG, up to 5MB
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <Textarea
              placeholder="Add descriptions, notes, or serving suggestions..."
              className="resize-none bg-muted/10 h-28 text-xs placeholder:text-[12px] placeholder:text-muted-foreground"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-xs font-medium">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 flex flex-col h-full min-h-[400px] lg:min-h-0 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 border-border">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Ingredients
          </label>
          <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground">
            {fields.length} item{fields.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex-1 lg:h-[1px] space-y-3 min-h-[300px] lg:min-h-0 overflow-y-auto pr-2 custom-scrollbar border rounded-xl p-3 bg-muted/5 border-border/80">
          {fields.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <span className="text-3xl mb-3 opacity-60">☕</span>
              <p className="text-sm font-semibold text-foreground">
                No Ingredients Added
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                Add inventory items (espresso, milk, syrup, etc.) to calculate
                the recipe cost.
              </p>
            </div>
          ) : (
            fields.map((field, index) => {
              const watchInvId = form.watch(`ingredients.${index}.inventoryId`);
              const selectedInv = inventories.find((i) => i._id === watchInvId);
              return (
                <div
                  key={field.id}
                  className="flex gap-2.5 items-start bg-background p-2.5 rounded-lg border shadow-xs relative group"
                >
                  <div className="flex-1">
                    <Select
                      disabled={isLoadingInv}
                      onValueChange={(val) =>
                        form.setValue(`ingredients.${index}.inventoryId`, val, {
                          shouldValidate: true,
                        })
                      }
                      value={watchInvId || ""}
                    >
                      <SelectTrigger className="w-full bg-muted/10 h-10">
                        <SelectValue placeholder="Choose Ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventories
                          .filter((i) => i.status === "active")
                          .map((inv) => (
                            <SelectItem key={inv._id} value={inv._id}>
                              {inv.nameInventory} (
                              {inv.category === "packaging" ? "Pck" : "Ing"})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.ingredients?.[index]
                      ?.inventoryId && (
                      <p className="text-destructive text-[10px] font-semibold mt-1">
                        {
                          form.formState.errors.ingredients[index].inventoryId
                            .message
                        }
                      </p>
                    )}
                  </div>

                  <div className="w-32 relative">
                    <Input
                      type="number"
                      placeholder="Qty"
                      step="0.01"
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (["-", "+", "e", "E"].includes(e.key))
                          e.preventDefault();
                      }}
                      className="h-8 pr-12 font-mono text-sm bg-muted/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      {...form.register(`ingredients.${index}.quantityNeeded`, {
                        valueAsNumber: true,
                      })}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground/80 pointer-events-none">
                      {selectedInv ? selectedInv.unit : "-"}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0 border border-transparent hover:border-destructive/20"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="self-start text-[#F97316] hover:text-[#F97316]/90 hover:bg-[#F97316]/5 border-[#F97316]/25 font-semibold text-xs py-1.5 h-auto"
            onClick={() => append({ inventoryId: "", quantityNeeded: "" })}
          >
            + Add Ingredient
          </Button>
          {form.formState.errors.ingredients &&
            !Array.isArray(form.formState.errors.ingredients) && (
              <p className="text-destructive text-xs font-semibold mt-1">
                {form.formState.errors.ingredients.message}
              </p>
            )}
          {form.formState.errors.ingredients?.root && (
            <p className="text-destructive text-xs font-semibold mt-1">
              {form.formState.errors.ingredients.root.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
