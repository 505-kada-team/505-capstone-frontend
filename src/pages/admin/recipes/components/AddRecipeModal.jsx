<<<<<<< Updated upstream
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMenuSchema } from '@/schemas/menuSchema';
import { getInventoryList, createMenu } from '@/services/api';
import { UploadCloud, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AddRecipeModal({ isOpen, onClose, onSuccess }) {
  const [inventories, setInventories] = useState([]);
  const [isLoadingInv, setIsLoadingInv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const form = useForm({
    resolver: zodResolver(createMenuSchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
      sellingPrice: '',
      ingredients: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  const fetchInventories = async () => {
    setIsLoadingInv(true);
    try {
      // Mengambil data inventory penuh untuk mendapatkan lastCostBatch
      const res = await getInventoryList({ limit: 1000 });
      if (res.data.success) {
        setInventories(res.data.data);
      }
    } catch {
      toast.error('Gagal mengambil daftar inventory');
    } finally {
      setIsLoadingInv(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      form.reset();
      setPreviewImage(null);
      setTimeout(() => fetchInventories(), 0);
=======
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
>>>>>>> Stashed changes
    }
  }, [isOpen, form]);

  const onSubmit = async (data) => {
<<<<<<< Updated upstream
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        sellingPrice: Number(data.sellingPrice),
        ingredients: data.ingredients.map((item) => ({
          inventoryId: item.inventoryId,
          quantityNeeded: Number(item.quantityNeeded),
        })),
      };

      const res = await createMenu(payload);
      if (res.data.success) {
        toast.success(res.data.message);
=======
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
    try {
      const res = await createRecipe({ ...data, ingredients: resolved });
      if (res.success) {
        toast.success(res.message);
>>>>>>> Stashed changes
        onSuccess();
        onClose();
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e) => {
          if (e.field.startsWith('ingredients')) {
            form.setError('ingredients', { message: e.message });
          } else {
            form.setError(e.field, { message: e.message });
          }
        });
      } else {
        toast.error('Gagal menyimpan resep');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kalkulasi Modal per Resep secara live
  const calculateTotalCost = () => {
    const currentIngredients = form.watch('ingredients');
    return currentIngredients.reduce((total, item) => {
      const inv = inventories.find((i) => i._id === item.inventoryId);
      const qty = Number(item.quantityNeeded) || 0;
      if (inv && inv.lastCostBatch) {
        return total + inv.lastCostBatch * qty;
      }
      return total;
    }, 0);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChangeFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Mock upload: set URL sementara dan simpan ke form (simulate upload success)
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    // Kita set dummy URL ke form karena backend contract mengharapkan URL string, bukan file object
    form.setValue('image', 'https://cdn.example.com/mock-upload/' + file.name, { shouldValidate: true });
    toast.success('Gambar berhasil ditambahkan (Mock)');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-bold font-heading text-foreground">Add New Recipe</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto lg:overflow-hidden p-6 min-h-0 flex flex-col">
<<<<<<< Updated upstream
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 min-h-0">
              {/* Left Column: General Information (6 cols) */}
              <div className="lg:col-span-6 space-y-5 lg:overflow-y-auto lg:min-h-0 lg:pr-2 custom-scrollbar">
                {/* Recipe Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipe Name</label>
                  <Input placeholder="e.g. Iced Cafe Latte" className="h-10 text-sm" {...form.register('name')} />
                  {form.formState.errors.name && <p className="text-destructive text-xs font-medium">{form.formState.errors.name.message}</p>}
                </div>

                {/* Price & Cost Summary (Grid) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost Estimate</label>
                    <div className="h-10 flex items-center bg-muted/35 px-3 rounded-lg border border-border/40 font-mono text-sm text-foreground/80">
                      <span className="text-muted-foreground mr-1">Rp</span>
                      <span className="font-semibold text-sm">{calculateTotalCost().toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selling Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">Rp</span>
                      <Input
                        type="number"
                        placeholder="0"
                        step="1"
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="pl-8 h-10 font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        {...form.register('sellingPrice', { valueAsNumber: true })}
                      />
                    </div>
                    {form.formState.errors.sellingPrice && <p className="text-destructive text-xs font-medium">{form.formState.errors.sellingPrice.message}</p>}
                  </div>
                </div>

                {/* Recipe Picture & Description — side by side 50/50 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Drag and drop image upload area */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipe Picture</label>
                    <div
                      className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center relative transition-all h-28 ${
                        dragActive ? 'border-accent bg-accent/5' : 'border-border bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/30'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {previewImage ? (
                        <div className="relative w-full h-full flex justify-center items-center">
                          <img src={previewImage} alt="Preview" className="max-h-full object-contain rounded-lg shadow-sm" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-1 -right-1 rounded-full h-8 w-8 p-0 shadow-md hover:scale-105 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(null);
                              form.setValue('image', '', { shouldValidate: true });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleChangeFile} />
                          <UploadCloud className="w-8 h-8 text-muted-foreground mb-1.5 opacity-60" />
                          <p className="text-sm font-semibold text-foreground">Upload Picture</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">PNG or JPG, up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                    <Textarea placeholder="Add descriptions, notes, or serving suggestions..." className="resize-none bg-muted/10 h-28 text-xs placeholder:text-[12px] placeholder:text-muted-foreground" {...form.register('description')} />
                    {form.formState.errors.description && <p className="text-destructive text-xs font-medium">{form.formState.errors.description.message}</p>}
                  </div>
                </div>
              </div>

              {/* Right Column: Ingredients (6 cols) */}
              <div className="lg:col-span-6 flex flex-col h-full min-h-[400px] lg:min-h-0 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 border-border">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingredients</label>
                  <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full font-mono text-muted-foreground">
                    {fields.length} item{fields.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Scrollable list of ingredients */}
                <div className="flex-1 lg:h-[1px] space-y-3 min-h-[300px] lg:min-h-0 overflow-y-auto pr-2 custom-scrollbar border rounded-xl p-3 bg-muted/5 border-border/80">
                  {fields.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                      <span className="text-3xl mb-3 opacity-60">☕</span>
                      <p className="text-sm font-semibold text-foreground">No Ingredients Added</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">Add inventory items (espresso, milk, syrup, etc.) to calculate the recipe cost.</p>
                    </div>
                  ) : (
                    fields.map((field, index) => {
                      const watchInvId = form.watch(`ingredients.${index}.inventoryId`);
                      const selectedInv = inventories.find((i) => i._id === watchInvId);

                      return (
                        <div key={field.id} className="flex gap-2.5 items-start bg-background p-2.5 rounded-lg border shadow-xs relative group">
                          {/* Ingredient Select */}
                          <div className="flex-1">
                            <Select disabled={isLoadingInv} onValueChange={(val) => form.setValue(`ingredients.${index}.inventoryId`, val, { shouldValidate: true })} value={watchInvId || ''}>
                              <SelectTrigger className="w-full bg-muted/10 h-10">
                                <SelectValue placeholder="Choose Ingredient" />
                              </SelectTrigger>
                              <SelectContent>
                                {inventories
                                  .filter((i) => i.status === 'active')
                                  .map((inv) => (
                                    <SelectItem key={inv._id} value={inv._id}>
                                      {inv.nameInventory} ({inv.category === 'packaging' ? 'Pck' : 'Ing'})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.ingredients?.[index]?.inventoryId && <p className="text-destructive text-[10px] font-semibold mt-1">{form.formState.errors.ingredients[index].inventoryId.message}</p>}
                          </div>

                          {/* Quantity and Unit in one unified input block */}
                          <div className="w-32 relative">
                            <Input
                              type="number"
                              placeholder="Qty"
                              step="0.01"
                              onWheel={(e) => e.currentTarget.blur()}
                              onKeyDown={(e) => {
                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              className="h-8 pr-12 font-mono text-sm bg-muted/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              {...form.register(`ingredients.${index}.quantityNeeded`, {
                                valueAsNumber: true,
                              })}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground/80 pointer-events-none">{selectedInv ? selectedInv.unit : '-'}</div>
                          </div>

                          {/* Delete Action */}
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

                {/* Footer of the right column: Add button */}
                <div className="mt-4 pt-3 border-t flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="self-start text-[#F97316] hover:text-[#F97316]/90 hover:bg-[#F97316]/5 border-[#F97316]/25 font-semibold text-xs py-1.5 h-auto"
                    onClick={() => append({ inventoryId: '', quantityNeeded: '' })}
                  >
                    + Add Ingredient
                  </Button>

                  {form.formState.errors.ingredients && !Array.isArray(form.formState.errors.ingredients) && <p className="text-destructive text-xs font-semibold mt-1">{form.formState.errors.ingredients.message}</p>}
                  {form.formState.errors.ingredients?.root && <p className="text-destructive text-xs font-semibold mt-1">{form.formState.errors.ingredients.root.message}</p>}
                </div>
              </div>
            </div>
=======
            <RecipeFormFields
              formState={formState}
              inventoryOptions={inventoryOptions}
              isLoadingInv={isLoadingInv}
              mode="create"
            />
>>>>>>> Stashed changes
          </div>

          {/* Action Footer */}
          <DialogFooter className="p-6 border-t bg-muted/15 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="outline" className="h-10 text-sm font-semibold px-5" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#F97316] hover:bg-[#F97316]/90 text-white h-10 text-sm font-semibold px-6 shadow-sm shadow-[#F97316]/20 transition-all active:scale-[0.98]" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
