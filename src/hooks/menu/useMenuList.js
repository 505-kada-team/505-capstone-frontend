import { useState, useEffect, useMemo, useCallback } from "react";
import { menuApi } from "@/services/menu/menu.api";
import {
  mapMenuListItem,
  mapPagination,
  toGetMenusParams,
} from "@/services/menu/menu.mapper";

const DEFAULT_LIMIT = 12;

// Sort client-side saja — backend belum terima param `sort`.
const SORTERS = {
  // Tambahkan urutan berdasarkan waktu (Terbaru ke Terlama)
  newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  // (Opsional) Terlama ke Terbaru
  oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),

  name_asc: (a, b) => a.name.localeCompare(b.name),
  name_desc: (a, b) => b.name.localeCompare(a.name),
  cost_high: (a, b) =>
    (b.currentCostEstimate ?? -Infinity) - (a.currentCostEstimate ?? -Infinity),
  cost_low: (a, b) =>
    (a.currentCostEstimate ?? Infinity) - (b.currentCostEstimate ?? Infinity),
};

export function useMenuList({
  initialSearch = "",
  initialIncludeDeleted = false,
  // Ubah default sort menjadi "newest" agar otomatis menampilkan yang terbaru di awal
  initialSort = "newest",
} = {}) {
  const [search, setSearch] = useState(initialSearch);
  const [includeDeleted, setIncludeDeleted] = useState(initialIncludeDeleted);
  const [sort, setSort] = useState(initialSort);
  const [page, setPageState] = useState(1);

  const [rawRecipes, setRawRecipes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchList = useCallback(async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await menuApi.list(toGetMenusParams(params));
      console.log("API response:", res);
      if (res.success) {
        setRawRecipes((res.data ?? []).map(mapMenuListItem));
        setPagination(mapPagination(res.meta?.pagination));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Gagal memuat resep",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hanya search & includeDeleted yang trigger request baru ke backend.
  useEffect(() => {
    const delay = setTimeout(
      () => {
        setPageState(1);
        fetchList({ page: 1, limit: DEFAULT_LIMIT, search, includeDeleted });
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, includeDeleted]);

  const goToPage = useCallback(
    (newPage) => {
      if (newPage < 1 || (pagination && newPage > pagination.totalPage)) return;
      setPageState(newPage);
      fetchList({
        page: newPage,
        limit: DEFAULT_LIMIT,
        search,
        includeDeleted,
      });
    },
    [pagination, search, includeDeleted, fetchList],
  );

  const refetch = useCallback(
    () => fetchList({ page, limit: DEFAULT_LIMIT, search, includeDeleted }),
    [page, search, includeDeleted, fetchList],
  );

  const recipes = useMemo(() => {
    // Jika tidak ada sort yang cocok, default ke "newest"
    const sorter = SORTERS[sort] ?? SORTERS.newest;
    return [...rawRecipes].sort(sorter);
  }, [rawRecipes, sort]);

  return {
    recipes,
    pagination,
    filters: { search, includeDeleted, sort, page, limit: DEFAULT_LIMIT },
    isLoading,
    error,
    setSearch,
    setIncludeDeleted,
    setSort,
    setPage: goToPage,
    refetch,
  };
}
