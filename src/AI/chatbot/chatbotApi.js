import {
  getInventoryList,
  getInventoryDetail,
  getMenuList,
  getMenuDetail,
  getPlanList,
  getPlanDetail,
  getSellingActiveList,
  getSellingHistory,
  getPlanReportList,
  getHistoryUsage,
  getHistorySubInventory,
} from "@/services/api";

export const DATA_SOURCE_LABELS = {
  inventory: "Inventory — stok bahan baku & packaging saat ini (ringkasan, tanpa detail batch)",
  inventoryBatches: "Detail batch inventory per item — termasuk tanggal expired & status tiap batch (active/depleted/expired)",
  menu: "Menu — daftar menu, harga jual, estimasi margin (ringkasan, tanpa resep)",
  menuIngredients: "Resep lengkap tiap menu — bahan apa saja dan takarannya per porsi",
  plans: "Production plan — rencana produksi draft & active (ringkasan)",
  activePlanDetail: "Detail lengkap plan yang sedang active — termasuk checkResult, committedIngredients, dan diskon per menu",
  activeSelling: "Plan aktif — sisa stok porsi & harga yang berlaku sekarang",
  sellingHistory: "Riwayat penjualan — transaksi yang sudah tercatat",
  planReports: "Laporan kerugian/kerusakan (menu atau bahan baku)",
  historyUsage: "Riwayat pemakaian stok (COGS / pemotongan bahan baku)",
  historySubInventory: "Riwayat pembelian batch inventory (restock) — tanpa info expired/status",
};

const FETCHERS = {
  inventory: async () => (await getInventoryList()).data,

  inventoryBatches: async () => {
    const list = (await getInventoryList()).data ?? [];
    const details = await Promise.all(
      list.map((item) => getInventoryDetail(item._id).then((res) => res.data))
    );
    return details.map((d) => ({
      inventoryId: d._id,
      name: d.name,
      itemCode: d.itemCode,
      batches: d.batches,
    }));
  },

  menu: async () => (await getMenuList()).data,

  menuIngredients: async () => {
    const list = (await getMenuList()).data ?? [];
    const details = await Promise.all(
      list.map((item) => getMenuDetail(item._id).then((res) => res.data))
    );
    return details.map((d) => ({
      menuId: d._id,
      name: d.name,
      ingredients: d.ingredients,
    }));
  },

  plans: async () => (await getPlanList()).data,

  activePlanDetail: async () => {
    const activeList = (await getPlanList({ status: "active" })).data ?? [];
    const active = activeList[0];
    if (!active) return null;
    return (await getPlanDetail(active._id)).data;
  },

  activeSelling: async () => (await getSellingActiveList()).data,
  sellingHistory: async () => (await getSellingHistory()).data,
  planReports: async () => (await getPlanReportList()).data,
  historyUsage: async () => (await getHistoryUsage()).data,
  historySubInventory: async () => (await getHistorySubInventory()).data,
};

export async function fetchSources(keys = []) {
  const validKeys = keys.filter((key) => key in FETCHERS);

  const entries = await Promise.all(
    validKeys.map(async (key) => [key, await FETCHERS[key]()])
  );

  return Object.fromEntries(entries);
}