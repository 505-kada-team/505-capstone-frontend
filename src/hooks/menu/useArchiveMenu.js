import { useState, useCallback } from "react";
import { menuApi } from "@/services/menu/menu.api";
import { mapMenuDeleteResult } from "@/services/menu/menu.mapper";

export function useArchiveMenu() {
  const [isArchiving, setIsArchiving] = useState(false);

  const archiveRecipe = useCallback(async (id) => {
    setIsArchiving(true);
    try {
      const res = await menuApi.remove(id);
      return {
        success: res.success,
        message: res.message,
        data: mapMenuDeleteResult(res.data),
      };
    } finally {
      setIsArchiving(false);
    }
  }, []);

  return { archiveRecipe, isArchiving };
}
