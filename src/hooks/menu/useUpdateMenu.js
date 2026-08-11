import { useState, useCallback } from "react";
import { menuApi } from "@/services/menu/menu.api";
import {
  toUpdateMenuPayload,
  mapMenuUpdateResult,
} from "@/services/menu/menu.mapper";

export function useUpdateMenu() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRecipe = useCallback(async (id, changes) => {
    setIsUpdating(true);
    try {
      const payload = toUpdateMenuPayload(changes);
      const res = await menuApi.update(id, payload);
      // updateMenu() backend sengaja hanya balikin field terbatas
      // (id, name, sellingPrice, updatedAt) — bukan detail lengkap.
      return {
        success: res.success,
        message: res.message,
        data: mapMenuUpdateResult(res.data),
      };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { updateRecipe, isUpdating };
}
