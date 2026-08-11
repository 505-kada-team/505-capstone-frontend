import { useState } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * SortDropdown.jsx — components/shared/
 *
 * Dropdown "Urutkan" generik — ikon trigger + daftar opsi sort dengan
 * checkmark di opsi aktif. Nggak tau apa-apa soal data yang di-sort;
 * itu tanggung jawab pemanggil lewat `options` + `value` + `onChange`.
 * Dipakai pertama kali di InvoicePage.jsx, tapi reusable buat halaman
 * lain yang butuh sort serupa (misal daftar produk di Admin).
 *
 * Props:
 *   options      : Array<{ value, label }> — daftar opsi sort
 *   value        : string — value opsi yang lagi aktif
 *   onChange     : (value: string) => void
 *   defaultValue : string (opsional) — value yang dianggap "default/netral".
 *                  Kalau `value` beda dari ini, ikon trigger jadi warna
 *                  accent sebagai indikator sort lagi aktif. Kalau tidak
 *                  diisi, ikon selalu netral (nggak ada state "aktif").
 *   label        : string (opsional) — aria-label tombol, default "Urutkan"
 */
export default function SortDropdown({ options, value, onChange, defaultValue, label = 'Urutkan' }) {
  const [open, setOpen] = useState(false);
  const isActive = defaultValue != null && value !== defaultValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md border focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40',
              isActive
                ? 'border-accent text-accent'
                : 'border-input text-muted-foreground hover:text-foreground'
            )}
          >
            <SlidersHorizontal size={20} strokeWidth={2} />
          </button>
        }
      />

      <PopoverContent align="end" className="w-56 rounded-md p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            {option.label}
            {value === option.value && <Check size={16} strokeWidth={2} className="text-accent" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}