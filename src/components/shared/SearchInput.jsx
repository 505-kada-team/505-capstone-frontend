/**
 * SearchInput.jsx — components/shared/
 *
 * Input pencarian dengan ikon kaca pembesar di kiri.
 * Wrapper tipis di atas komponen Input shadcn.
 *
 * Props:
 *   placeholder : string (opsional)
 *   value       : string
 *   onChange    : (value: string) => void
 *   className   : string (opsional)
 *   id          : string (opsional) — untuk aksesibilitas & testing
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function SearchInput({ placeholder = 'Search...', value, onChange, className, id }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={15}
        strokeWidth={2}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <Input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 h-9"
      />
    </div>
  );
}
