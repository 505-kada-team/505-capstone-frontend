/**
 * FormSelect.jsx — components/shared/
 *
 * Komponen select generik untuk FORM — bukan filter toolbar.
 * Wraps shadcn Select dengan Label + pesan error, konsisten di semua halaman.
 * Dipakai bersama react-hook-form via props value + onValueChange.
 *
 * Props:
 *   id            : string — untuk aria label association
 *   label         : string (opsional) — label di atas select
 *   required      : boolean (opsional) — tampilkan asterisk merah
 *   placeholder   : string (opsional) — teks placeholder di trigger
 *   value         : string — nilai yang dipilih
 *   onValueChange : (value: string) => void
 *   options       : Array<{ value: string, label: string }> — daftar pilihan
 *   error         : string (opsional) — pesan error di bawah select
 *   disabled      : boolean (opsional)
 *   className     : string (opsional) — class untuk wrapper div
 *
 * Penggunaan dengan react-hook-form + Controller:
 *   <Controller
 *     name="category"
 *     control={control}
 *     render={({ field }) => (
 *       <FormSelect
 *         id="inv-category"
 *         label="Kategori"
 *         required
 *         placeholder="Pilih kategori"
 *         value={field.value}
 *         onValueChange={field.onChange}
 *         options={CATEGORY_OPTIONS}
 *         error={errors.category?.message}
 *       />
 *     )}
 *   />
 */

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FormSelect({
  id,
  label,
  required = false,
  placeholder,
  value,
  onValueChange,
  options = [],
  error,
  disabled = false,
  className,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}

      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className="w-full h-8"
          aria-invalid={!!error}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Error inline — terikat ke 1 field, sesuai DESIGN_v1.md 5b */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
