import { useState, useCallback } from "react";
import { menuApi } from "@/services/menu/menu.api";
import {
  toCreateMenuPayload,
  mapMenuDetail,
} from "@/services/menu/menu.mapper";

export function useCreateMenu() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRecipe = useCallback(async (formValues) => {
    setIsSubmitting(true);
    try {
      const payload = toCreateMenuPayload(formValues);
      const res = await menuApi.create(payload);
      return {
        success: res.success,
        message: res.message,
        data: mapMenuDetail(res.data),
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { createRecipe, isSubmitting };
}
