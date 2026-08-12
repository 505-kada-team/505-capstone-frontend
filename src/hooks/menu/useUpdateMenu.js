import { useState, useCallback } from "react";
import { menuApi } from "@/services/menu/menu.api";
import {
  toUpdateMenuPayload,
  mapMenuUpdateResult,
} from "@/services/menu/menu.mapper";

export function useUpdateMenu() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRecipe = useCallback(async (id, changes, imageFile) => {
    setIsUpdating(true);
    try {
      const payload = toUpdateMenuPayload(changes);
      const res = await menuApi.update(id, payload, imageFile); // teruskan file
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
