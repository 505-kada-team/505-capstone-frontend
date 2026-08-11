import { create } from 'zustand';

/**
 * Stok "asli" produk — terpisah dari cartStore.
 *
 * Kenapa perlu ini: kalau stok cuma dihitung sebagai
 * `stockRemaining - qtyDiCart` (kayak sebelumnya), produk langsung
 * kelihatan abu-abu/sold-out begitu user nambahin ke cart sampai
 * pas — padahal belum tentu jadi dibeli (masih bisa dibatalkan).
 *
 * Store ini nyimpen stok yang BENERAN berkurang, dan cuma berkurang
 * saat checkout beneran terjadi (lihat `decrementStock`, dipanggil dari
 * TransaksiPage.jsx `handleCheckout`). Card di grid produk baru abu-abu
 * & pindah ke baris terakhir setelah stok di sini nyampe 0 — bukan
 * cuma gara-gara ada di cart.
 *
 * ⚠️ Ini state lokal client (reset kalau reload), bukan pengganti
 * validasi stok di backend. TODO: begitu createTransaction() beneran
 * manggil API, cek juga apakah backend balikin stok terbaru supaya
 * store ini bisa di-sync ulang (misal setelah checkout sukses).
 */

export const useProductStore = create((set) => ({
  products: [],
  stockById: {},

  setProducts: (products) => set({
    products,
    stockById: Object.fromEntries(products.map((product) => [product.id, product.stock])),
  }),

  decrementStock: (productId, qty) => set((state) => ({
    stockById: {
      ...state.stockById,
      [productId]: Math.max(0, (state.stockById[productId] ?? 0) - qty),
    },
  })),

  clearProducts: () => set({ products: [], stockById: {} }),
}));