import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/FormatCurrency';

/**
 * Panel keranjang di sisi kiri halaman transaksi kasir.
 * Menerima data & handler lewat props (tidak ada state/fetch di sini).
 */
export default function CartPanel({ cashierName, date, items, onRemoveItem, onCheckout, onCancel, total }) {
  const isEmpty = items.length === 0;

  return (
    <div className="flex h-full flex-col rounded-lg border border-neutral-200 p-6">
      <div>
        <p className="text-lg font-semibold text-foreground">Cashier: {cashierName}</p>
        <p className="text-muted-foreground text-xs">{date}</p>
      </div>

      <div className="mt-6 flex-1 divide-y divide-neutral-100 overflow-y-auto">
        {isEmpty ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Belum ada item, pilih produk di sebelah kanan.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="font-mono text-accent w-4">{item.qty}</span>
              <p className="flex-1 truncate text-foreground">{item.name}</p>
              <p className="font-mono text-accent">
                {formatCurrency((item.discountPrice ?? item.price) * item.qty)}
              </p>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                aria-label={`Hapus ${item.name} dari keranjang`}
                className="text-muted-foreground hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">Total</p>
          <p className="font-mono text-accent text-lg font-semibold">{formatCurrency(total)}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-md" onClick={onCancel} disabled={isEmpty}>
            Batal
          </Button>
          <Button
            className="bg-accent hover:bg-accent/90 flex-1 rounded-md text-white"
            onClick={onCheckout}
            disabled={isEmpty}
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
