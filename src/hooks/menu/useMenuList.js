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
  initialStatus = "all",
  initialSort = "newest",
} = {}) {
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
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
      // Map status to includeDeleted
      const apiParams = { ...params };
      if (apiParams.status === 'all' || apiParams.status === 'archived') {
        apiParams.includeDeleted = true;
      } else {
        apiParams.includeDeleted = false;
      }
      delete apiParams.status; // Remove status from apiParams just in case

      const res = await menuApi.list(toGetMenusParams(apiParams));
      if (res.success) {
        let fetchedData = (res.data ?? []).map(mapMenuListItem);
        
        // If they explicitly want ONLY archived, and backend returned all, we might need to client-side filter
        // But since we can't reliably paginate that, we'll just show what the backend returns.
        // Actually, we can filter it here, though it might reduce items per page.
        if (params.status === 'archived') {
          fetchedData = fetchedData.filter(item => item.status !== 'active');
        }

        setRawRecipes(fetchedData);
        setPagination(mapPagination(res.pagination ?? res.meta?.pagination));
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Gagal memuat resep",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hanya search & status yang trigger request baru ke backend.
  useEffect(() => {
    setPageState(1);
    const timeoutId = setTimeout(() => {
      fetchList({ page: 1, limit: DEFAULT_LIMIT, search, status });
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const goToPage = useCallback(
    (newPage) => {
      if (newPage < 1 || (pagination && newPage > pagination.totalPage)) return;
      setPageState(newPage);
      fetchList({
        page: newPage,
        limit: DEFAULT_LIMIT,
        search,
        status,
      });
    },
    [pagination, search, status, fetchList],
  );

  const refetch = useCallback(
    () => fetchList({ page, limit: DEFAULT_LIMIT, search, status }),
    [page, search, status, fetchList],
  );

  const recipes = useMemo(() => {
    // Jika tidak ada sort yang cocok, default ke "newest"
    const sorter = SORTERS[sort] ?? SORTERS.newest;
    return [...rawRecipes].sort(sorter);
  }, [rawRecipes, sort]);

  return {
    recipes,
    pagination,
    isLoading,
    error,
    filters: { search, status, sort },
    setSearch,
    setStatus,
    setSort,
    goToPage,
    refetch,
  };
}
