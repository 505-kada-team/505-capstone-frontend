import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlert } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import FormSelect from '@/components/shared/FormSelect';

import { createInventory } from '@/services/api';
import { createInventorySchema } from '@/schemas/inventorySchema';

const UNIT_OPTIONS = [
  { value: 'gr',  label: 'gr' },
  { value: 'kg',  label: 'kg' },
  { value: 'ml',  label: 'ml' },
  { value: 'l',   label: 'l' },
  { value: 'pcs', label: 'pcs' },
];

export default function AddInventoryModal({ open, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createInventorySchema),
    defaultValues: { nameInventory: '', category: '', unit: '', description: '' },
  });

  useEffect(() => {
    if (!open) {
      reset();
      // eslint-disable-next-line
      setServerError('');
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setServerError('');
    try {
      await createInventory(data);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Gagal menyimpan inventory. Coba lagi.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-[425px] p-6" id="add-inventory-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-semibold">Add New Inventory Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Item Name */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-name" className="text-sm font-medium">
              Item Name
            </Label>
            <Input
              id="inv-name"
              placeholder="Enter item name"
              aria-invalid={!!errors.nameInventory}
              {...register('nameInventory')}
            />
            {errors.nameInventory && (
              <p className="text-xs text-destructive">{errors.nameInventory.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category (Radio Group) */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-2 mt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ingredients" id="cat-ingredient" />
                      <Label htmlFor="cat-ingredient" className="font-normal text-sm cursor-pointer">
                        Ingredient
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="packaging" id="cat-packaging" />
                      <Label htmlFor="cat-packaging" className="font-normal text-sm cursor-pointer">
                        Packaging
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            {/* Unit (Select) */}
            <div>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    id="inv-unit"
                    label="Unit"
                    placeholder="Select unit"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={UNIT_OPTIONS}
                    error={errors.unit?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="inv-description"
              placeholder="Add optional description..."
              rows={4}
              {...register('description')}
              className="resize-none"
            />
          </div>

          {/* Server error */}
          {serverError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
              <TriangleAlert size={15} className="text-destructive shrink-0" />
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <div className="flex w-full justify-end gap-3 pt-2">
            <Button
              id="add-inventory-cancel"
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="px-6"
            >
              Batal
            </Button>
            <Button
              id="add-inventory-submit"
              type="submit"
              disabled={submitting}
              className="px-6"
            >
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
