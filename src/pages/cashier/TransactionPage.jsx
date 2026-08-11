import { useEffect, useMemo, useState } from "react";
import { Loader2, SearchX, PackageX, AlertCircle } from 'lucide-react';

import SearchInput from "@/components/shared/SearchInput";
import ProductCard from "@/components/shared/ProductCard";
import CartPanel from "@/components/shared/CartPanel";
import { useCartStore } from "@/stores/cartStore";
import { useProductStore } from "@/stores/productStore";
import { getActiveSellingPlans, createSale } from "@/services/cashierApi";
import { useAuth } from "@/context/AuthContext";

export default function TransaksiPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);

  const products = useProductStore((state) => state.products);
  const setProducts = useProductStore((state) => state.setProducts);
  const stockById = useProductStore((state) => state.stockById);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const products = await getActiveSellingPlans();
      setProducts(products);
    } catch (error) {
      console.error("[ACTIVE SELLING ERROR]", error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase();

    return products.filter((produk) =>
      produk.name?.toLowerCase().includes(keyword),
    );
  }, [products, search]);

  const sortedProducts = useMemo(() => {
    const isOutOfStock = (produk) =>
      !produk.isAvailable ||
      (stockById[produk.id] != null && stockById[produk.id] <= 0);

    return [...filteredProducts].sort(
      (a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b)),
    );
  }, [filteredProducts, stockById]);

  const cartQtyById = useMemo(
    () => Object.fromEntries(items.map((item) => [item.id, item.qty])),
    [items],
  );

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleCheckout = async () => {
    if (items.length === 0 || isCheckingOut) return;

    try {
      setIsCheckingOut(true);
      setError(null);

      const payload = {
        planId: items[0].planId,
        items: items.map((item) => ({
          menuId: item.menuId,
          quantitySold: item.qty,
        })),
      };

      await createSale(payload);

      clearCart();
      await fetchProducts();
    } catch (error) {
      console.error("[CREATE SALE ERROR]", error);
      setError(error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm">Loading menu...</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm">Failed to load menu.</p>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-[420px_1fr] gap-6">
      <CartPanel
        cashierName={user?.name}
        date={today}
        items={items}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
        onCancel={clearCart}
        total={getTotal()}
      />

      <div className="flex h-full flex-col overflow-hidden">
        <SearchInput
          placeholder="Search Menu..."
          value={search}
          onChange={setSearch}
        />

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          {products.length === 0 ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center gap-2 text-center">
                <PackageX className="h-5 w-5 text-muted-foreground" />
                <p className="text-base font-semibold text-foreground">
                  No menu available
                </p>
                <p className="text-sm text-muted-foreground">
                  There are currently no menus available from an active plan.
                </p>
              </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center gap-2 text-center">
              <SearchX className="h-5 w-5 text-muted-foreground" />
              <p className="text-base font-semibold text-foreground">
                No menu found
              </p>
              <p className="text-sm text-muted-foreground">
                Try searching with a different keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {sortedProducts.map((produk) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
