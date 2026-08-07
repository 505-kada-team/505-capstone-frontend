import { create } from 'zustand';

// Bentuk item: { id, name, image, price, discountPrice, qty }
export const useCartStore = create((set, get) => ({
  items: [],

  addItem: (produk) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === produk.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === produk.id ? { ...item, qty: item.qty + 1 } : item
          ),
        };
      }
      return { items: [...state.items, { ...produk, qty: 1 }] };
    }),

  incrementItem: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      ),
    })),

  decrementItem: (id) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === id);
      if (existing && existing.qty <= 1) {
        return { items: state.items.filter((item) => item.id !== id) };
      }
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        ),
      };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce((sum, item) => {
      const price = item.discountPrice ?? item.price;
      return sum + price * item.qty;
    }, 0);
  },
}));