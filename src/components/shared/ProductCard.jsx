import { Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatCurrency";
import { useProductStore } from "@/stores/productStore";

/**
 * Kartu produk di grid kasir.
 *
 * - `trueStock` = stok asli dari productStore (baru berkurang saat
 *   checkout, lihat productStore.js) — INI yang dipakai buat nentuin
 *   card abu-abu/sold-out. Sengaja BUKAN dikurangi qty di cart, biar
 *   card nggak keburu abu-abu cuma gara-gara lagi ditaruh di cart.
 * - `remainingStock` (trueStock - qty di cart) cuma dipakai buat teks
 *   "Sisa X" (real-time feedback) dan buat nge-disable tombol "+"
 *   (biar nggak bisa nambah ngelewatin stok asli), TIDAK dipakai buat
 *   nge-grey-in card.
 * - Kalau qty di cart > 0, stepper tetap tampil walau remainingStock
 *   sudah 0 (biar user masih bisa kurangi/hapus dari cart).
 */
export default function ProductCard({
  produk,
  qty = 0,
  onAdd,
  onIncrement,
  onDecrement,
}) {
  const trueStock = useProductStore(
    (state) => state.stockById[produk.id] ?? produk.stockRemaining,
  );

  const hasStockCount = trueStock != null;
  const remainingStock = hasStockCount ? Math.max(trueStock - qty, 0) : null;
  const isSoldOut = !produk.isAvailable || (hasStockCount && trueStock <= 0);
  const isAddBlocked =
    !produk.isAvailable || (hasStockCount && remainingStock <= 0);

  return (
    <Card
      className={`overflow-hidden rounded-lg p-0 ${isSoldOut ? "opacity-50" : ""}`}
    >
      <div className="relative">
        {produk.image ? (
          <img
            src={produk.image}
            alt={produk.name}
            className="block h-28 w-full object-cover"
          />
        ) : (
          <div className="flex h-28 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
            No Image
          </div>
        )}

        {produk.discountPrice != null && (
          <Badge className="absolute right-2 top-2 bg-red-600 text-white hover:bg-red-600">
            {produk.discountPercent}%
          </Badge>
        )}
      </div>

      <CardContent className="p-3">
        <p className="truncate text-xs font-medium text-foreground">
          {produk.name}
        </p>

        <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xs">
          <span
            className={
              produk.discountPrice != null ? "text-accent" : "text-foreground"
            }
          >
            {formatCurrency(produk.discountPrice ?? produk.price)}
          </span>
          {produk.discountPrice != null && (
            <span className="text-muted-foreground text-[11px] line-through">
              {formatCurrency(produk.price)}
            </span>
          )}
        </div>

        {/* Baris stok — selalu ada, tinggi tetap. Angka ikut real-time qty di cart. */}
        <p className="mt-1 h-4 text-right text-[11px] text-muted-foreground">
          {hasStockCount
            ? isAddBlocked
              ? "Out of Stock"
              : `Remaining ${remainingStock}`
            : "\u00A0"}
        </p>

        <div className="mt-2">
          {qty > 0 ? (
            <div className="flex items-center justify-between rounded-md bg-accent/10 p-1">
              <button
                type="button"
                onClick={() => onDecrement(produk.id)}
                aria-label={`Kurangi ${produk.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-accent shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <span className="font-mono text-xs text-foreground">{qty}</span>
              <button
                type="button"
                onClick={() => onIncrement(produk.id)}
                disabled={isAddBlocked}
                aria-label={`Tambah ${produk.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-accent shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          ) : isSoldOut ? (
            <Button
              disabled
              className="w-full rounded-md bg-accent text-accent-foreground"
            >
              Add
            </Button>
          ) : (
            <Button
              onClick={() => onAdd(produk)}
              className="w-full rounded-md bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-orange-500/40"
            >
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
