import { useMemo, useState } from 'react';
import SearchInput from '@/components/shared/SearchInput';
import ProductCard from '@/components/shared/ProductCard';
import CartPanel from '@/components/shared/CartPanel';
import { useCartStore } from '@/stores/cartStore';
import { mockProducts } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';

export default function TransaksiPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);

  // TODO: ganti mockProducts dengan getProducts() dari services/api.js begitu backend siap
  const filteredProducts = useMemo(
    () => mockProducts.filter((produk) => produk.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const cartQtyById = useMemo(() => Object.fromEntries(items.map((item) => [item.id, item.qty])), [items]);

  const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handleCheckout = () => {
    // TODO: panggil createTransaction() dari services/api.js, lalu redirect/tampilkan struk
    clearCart();
  };

  return (
    <div className="grid grid-cols-[360px_1fr] gap-6">
      <CartPanel
        cashierName={user?.name}
        date={today}
        items={items}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
        onCancel={clearCart}
        total={getTotal()}
      />

      <div>
        <SearchInput placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="mt-6 grid grid-cols-4 gap-4">
          {filteredProducts.map((produk) => (
            <ProductCard
              key={produk.id}
              produk={produk}
              qty={cartQtyById[produk.id] || 0}
              onAdd={addItem}
              onIncrement={incrementItem}
              onDecrement={decrementItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
