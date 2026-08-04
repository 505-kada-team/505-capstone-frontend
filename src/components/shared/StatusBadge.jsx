/**
 * StatusBadge.jsx — components/shared/
 *
 * Badge multi-warna berdasarkan DESIGN_v1.md Section 2.
 * Warna status TIDAK boleh diubah tanpa diskusi tim (langsung terhubung ke API contract).
 *
 * Props:
 *   variant  : string — salah satu dari key di variantMap
 *   label    : string (opsional) — override label default
 *   className: string (opsional) — class tambahan
 *
 * Supported variants:
 *   Inventory status  : 'active' | 'deleted'
 *   SubInventory status: 'depleted' | 'expired' | 'deleted'
 *   Category          : 'ingredients' | 'packaging'
 *   Batch safety      : 'safe' | 'unsafe'
 */

import { cn } from '@/lib/utils';

const variantMap = {
  // ── Inventory / SubInventory status ─────────────────────
  active: {
    label: 'Aktif',
    className: 'bg-[#4E6A3E]/20 text-[#4E6A3E] border border-[#4E6A3E]/40 dark:bg-[#4E6A3E]/15 dark:text-[#86C060]',
  },
  depleted: {
    label: 'Habis',
    className: 'bg-[#8A7256]/20 text-[#8A7256] border border-[#8A7256]/40 dark:bg-[#8A7256]/15 dark:text-[#B89B76]',
  },
  expired: {
    label: 'Kadaluarsa',
    className: 'bg-[#C4441F]/15 text-[#C4441F] border border-[#C4441F]/40 dark:bg-[#C4441F]/10 dark:text-[#E07055]',
  },
  deleted: {
    label: 'Diarsipkan',
    className: 'bg-muted text-muted-foreground border border-border',
  },

  // ── Kategori inventory ───────────────────────────────────
  ingredients: {
    label: 'Ingredient',
    // Oranye = aksen brand (bukan status warning), sesuai DESIGN_v1.md
    className: 'bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/40',
  },
  packaging: {
    label: 'Packaging',
    className: 'bg-muted text-muted-foreground border border-border',
  },

  // ── Batch safety status (check-availability & deduct) ────
  safe: {
    label: 'Aman',
    className: 'bg-[#4E6A3E]/20 text-[#4E6A3E] border border-[#4E6A3E]/40 dark:bg-[#4E6A3E]/15 dark:text-[#86C060]',
  },
  unsafe: {
    // #B45309 = warna warning TERPISAH dari orange brand — lihat DESIGN_v1.md keputusan final
    label: 'Berisiko',
    className: 'bg-[#B45309]/15 text-[#B45309] border border-[#B45309]/40 dark:bg-[#B45309]/10 dark:text-[#D4810A]',
  },
};

export default function StatusBadge({ variant, label: labelOverride, className }) {
  const config = variantMap[variant] ?? variantMap.deleted;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
        config.className,
        className,
      )}
    >
      {labelOverride ?? config.label}
    </span>
  );
}
