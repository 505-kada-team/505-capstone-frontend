/**
 * StatusBadge.jsx — components/shared/
 *
 * Badge multi-warna berdasarkan DESIGN_v1.md Section 2.
 * Warna status TIDAK boleh diubah tanpa diskusi tim (langsung terhubung ke API contract).
 *
 * Semua label English-only per keputusan tim (lihat catatan produksi plan).
 *
 * Props:
 *   variant  : string — salah satu dari key di variantMap
 *   label    : string (opsional) — override label default
 *   className: string (opsional) — class tambahan
 *
 * Supported variants:
 *   Inventory status     : 'active' | 'deleted'
 *   SubInventory status   : 'depleted' | 'expired' | 'deleted'
 *   Batch safety           : 'safe' | 'unsafe'
 *   Production Plan status : 'in-stock' | 'low stock' | 'completed' | 'stopped'
 *   Ingredient/menu row    : 'sufficient' | 'insufficient'
 *
 * PENTING: kalau caller mengirim variant yang TIDAK ada di list di atas,
 * komponen ini akan fallback ke 'deleted' (label "Archived") DAN
 * mencetak console.warn di dev mode. Kalau kamu lihat badge "Archived"
 * yang nggak masuk akal di suatu tempat, cek console — itu tandanya
 * ada typo/mismatch variant string di caller-nya, bukan status archived
 * beneran.
 */

import { cn } from "@/lib/utils";

const variantMap = {
  // ── Inventory / SubInventory status ─────────────────────
  active: {
    label: "Active",
    className:
      "bg-[#4E6A3E]/20 text-[#4E6A3E] border border-[#4E6A3E]/40 dark:bg-[#4E6A3E]/15 dark:text-[#86C060]",
  },
  depleted: {
    label: "Depleted",
    className:
      "bg-[#8A7256]/20 text-[#8A7256] border border-[#8A7256]/40 dark:bg-[#8A7256]/15 dark:text-[#B89B76]",
  },
  expired: {
    label: "Expired",
    className:
      "bg-[#C4441F]/15 text-[#C4441F] border border-[#C4441F]/40 dark:bg-[#C4441F]/10 dark:text-[#E07055]",
  },
  deleted: {
    label: "Deleted",
    className: "bg-muted text-muted-foreground border border-border",
  },

  // ── Batch safety status (check-availability & deduct) ────
  safe: {
    label: "Safe",
    className:
      "bg-[#4E6A3E]/20 text-[#4E6A3E] border border-[#4E6A3E]/40 dark:bg-[#4E6A3E]/15 dark:text-[#86C060]",
  },
  unsafe: {
    // #B45309 = warna warning TERPISAH dari orange brand — lihat DESIGN_v1.md keputusan final
    label: "Unsafe",
    className:
      "bg-[#B45309]/15 text-[#B45309] border border-[#B45309]/40 dark:bg-[#B45309]/10 dark:text-[#D4810A]",
  },

  // ── Production Plan status ──────────────────────────────
  "in-stock": {
    // Draft + readyToApprove: true + hasUnsafeBatch: false
    label: "In Stock",
    className:
      "bg-[#4E6A3E]/20 text-[#4E6A3E] border border-[#4E6A3E]/40 dark:bg-[#4E6A3E]/15 dark:text-[#86C060]",
  },
  "low stock": {
    // Draft + !readyToApprove OR hasUnsafeBatch: true
    label: "Low Stock",
    className:
      "bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30 dark:bg-[#F97316]/10 dark:text-[#F97316]",
  },
  completed: {
    // Plan selesai durasi (status: 'completed')
    label: "Completed",
    className: "bg-muted text-muted-foreground border border-border",
  },
  stopped: {
    // Plan dihentikan paksa (status: 'stopped' | 'cancelled')
    label: "Stopped",
    className: "bg-muted text-muted-foreground border border-border",
  },

  // ── Ingredient / menu-row aggregate status (Requirements table) ─
  sufficient: {
    label: "Sufficient",
    className:
      "bg-[#4E6A3E]/20 text-[#4E6A3E] border border-[#4E6A3E]/40 dark:bg-[#4E6A3E]/15 dark:text-[#86C060]",
  },
  insufficient: {
    label: "Insufficient",
    className:
      "bg-[#C4441F]/15 text-[#C4441F] border border-[#C4441F]/40 dark:bg-[#C4441F]/10 dark:text-[#E07055]",
  },
};

export default function StatusBadge({
  variant,
  label: labelOverride,
  className,
}) {
  const config = variantMap[variant];

  if (!config && import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      `[StatusBadge] Unknown variant "${variant}" — falling back to "Archived". ` +
        `This is almost always a typo in the caller, not an intentional archived state.`,
    );
  }

  const resolved = config ?? variantMap.deleted;

  return (
    <span
      className={cn(
        // leading-none + items-center di sini + parent flex items-center
        // = badge selalu center secara vertikal terhadap sibling-nya
        "inline-flex items-center leading-none px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
        resolved.className,
        className,
      )}
    >
      {labelOverride ?? resolved.label}
    </span>
  );
}
