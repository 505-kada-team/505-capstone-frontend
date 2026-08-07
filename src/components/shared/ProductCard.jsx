import { Minus, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/FormatCurrency';

/**
 * Kartu produk di grid kasir.
 * - Sold out (kondisi data) -> disabled tapi tetap tampil + alasan (DESIGN.md section 5).
 * - Sudah ada di keranjang -> tampil qty stepper, bukan tombol Add.
 */
export default function ProductCard({ produk, qty = 0, onAdd, onIncrement, onDecrement }) {
  const isSoldOut = !produk.isAvailable;
  const hasDiscount = produk.discountPrice != null;

  return (
    <Card className={`overflow-hidden rounded-lg ${isSoldOut ? 'opacity-50' : ''}`}>
      <div className="relative">
        <img src={produk.image} alt={produk.name} className="h-32 w-full object-cover" />

        {hasDiscount && (
          <Badge className="absolute right-2 top-2 bg-accent text-white hover:bg-accent">
            {produk.discountPercent}%
          </Badge>
        )}

        {!isSoldOut && produk.stockRemaining != null && produk.stockRemaining <= 10 && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Sisa {produk.stockRemaining}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <p className="truncate text-sm font-medium text-foreground">{produk.name}</p>

        <div className="mt-1 flex items-baseline gap-2 font-mono text-sm">
          <span className={hasDiscount ? 'text-accent' : 'text-foreground'}>
            {formatCurrency(produk.discountPrice ?? produk.price)}
          </span>
          {hasDiscount && (
            <span className="text-muted-foreground text-xs line-through">
              {formatCurrency(produk.price)}
            </span>
          )}
        </div>

        <div className="mt-3">
          {isSoldOut ? (
            <>
              <Button disabled variant="outline" className="w-full rounded-md">
                Add
              </Button>
              <p className="text-muted-foreground mt-1 text-xs">Stok habis</p>
            </>
          ) : qty > 0 ? (
            <div className="border-accent flex items-center justify-center gap-4 rounded-md border">
              <button
                type="button"
                onClick={() => onDecrement(produk.id)}
                aria-label={`Kurangi ${produk.name}`}
                className="text-accent p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                <Minus size={16} strokeWidth={2} />
              </button>
              <span className="font-mono text-sm">{qty}</span>
              <button
                type="button"
                onClick={() => onIncrement(produk.id)}
                aria-label={`Tambah ${produk.name}`}
                className="text-accent p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                <Plus size={16} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <Button
              onClick={() => onAdd(produk)}
              variant="outline"
              className="border-accent text-accent hover:bg-accent w-full rounded-md hover:text-white focus-visible:ring-2 focus-visible:ring-orange-500/40"
            >
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
