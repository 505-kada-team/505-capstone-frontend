import { useState, useCallback } from "react";
import { menuApi } from "@/services/menu/menu.api";
import {
  mapMenuDropdownItem,
  toGetMenuDropdownParams,
} from "@/services/menu/menu.mapper";

/** Dipakai modul lain (Selling/Production Plan) untuk pilih menu ringkas. */
export function useMenuDropdown() {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await menuApi.dropdown(
        toGetMenuDropdownParams({ search: query }),
      );
      if (res.success) setOptions((res.data ?? []).map(mapMenuDropdownItem));
    } catch (err) {
      setError(err?.response?.data?.message || "Gagal memuat daftar menu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { options, isLoading, error, search };
}
