import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { planApi } from "@/services/plan/plan.api";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  discountFormSchema,
  firstZodErrorMessage,
} from "@/schemas/plan.schema";

const DEFAULT_GLOBAL_PERCENT = "15";

/**
 * State + submit logic untuk form diskon (DiscountModal). Set diskon di
 * backend adalah operasi PER-MENU (A9 - PUT .../menus/:menuId/discount),
 * tapi UI-nya memungkinkan admin apply 1 aturan (reason/periode/persentase)
 * ke BEBERAPA menu sekaligus -- makanya submit() memecahnya jadi banyak
 * request paralel (Promise.all), termasuk hapus diskon dari menu yang
 * di-uncheck saat mode edit.
 *
 * Komponen DiscountModal jadi murni presentasi: baca state & panggil
 * handler dari hook ini, tidak menyimpan logic form sendiri.
 */
export function usePlanDiscountForm({
  isOpen,
  plan,
  editPromo,
  initialSelectedMenuId,
  onApplied,
}) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [mode, setMode] = useState("sama_rata");
  const [globalPercent, setGlobalPercent] = useState(DEFAULT_GLOBAL_PERCENT);
  const [selectedMenus, setSelectedMenus] = useState({});
  const [menuPercents, setMenuPercents] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset/isi form tiap kali modal dibuka -- perilaku sama seperti
  // implementasi awal (useEffect di komponen), cuma dipindah ke sini.
  useEffect(() => {
    if (!isOpen) return;

    if (editPromo) {
      setReason(editPromo.reason);
      setDate({
        from: new Date(editPromo.startDate),
        to: new Date(editPromo.endDate),
      });
      const uniquePercents = new Set(
        editPromo.menus.map((m) => m.discountPercentage),
      );
      if (uniquePercents.size === 1) {
        setMode("sama_rata");
        setGlobalPercent(String(Array.from(uniquePercents)[0]));
      } else {
        setMode("beda_per_menu");
      }
      const sel = {};
      const perc = {};
      editPromo.menus.forEach((m) => {
        sel[m.menuId] = true;
        perc[m.menuId] = String(m.discountPercentage);
      });
      setSelectedMenus(sel);
      setMenuPercents(perc);
    } else {
      setReason("");
      setDate({ from: undefined, to: undefined });
      setMode("sama_rata");
      setGlobalPercent(DEFAULT_GLOBAL_PERCENT);
      if (initialSelectedMenuId) {
        setSelectedMenus({ [initialSelectedMenuId]: true });
        setMenuPercents({ [initialSelectedMenuId]: DEFAULT_GLOBAL_PERCENT });
      } else {
        setSelectedMenus({});
        setMenuPercents({});
      }
    }
  }, [isOpen, editPromo, initialSelectedMenuId]);

  const allSelected =
    (plan?.menus?.length ?? 0) > 0 &&
    plan.menus.every((m) => selectedMenus[m.menuId]);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedMenus({});
      return;
    }
    const sel = {};
    plan?.menus?.forEach((m) => {
      sel[m.menuId] = true;
    });
    setSelectedMenus(sel);
  }, [allSelected, plan]);

  const toggleMenu = useCallback((menuId) => {
    setSelectedMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  }, []);

  const setMenuPercent = useCallback((menuId, value) => {
    setMenuPercents((prev) => ({ ...prev, [menuId]: value }));
  }, []);

  const submit = useCallback(async () => {
    if (!plan?._id) return false;

    const selectedMenuIds = Object.keys(selectedMenus).filter(
      (id) => selectedMenus[id],
    );
    const parsed = discountFormSchema.safeParse({
      reason,
      startDate: date?.from,
      endDate: date?.to,
      selectedMenuIds,
    });
    if (!parsed.success) {
      toast.error(firstZodErrorMessage(parsed.error));
      return false;
    }

    setIsSubmitting(true);
    try {
      const planId = plan._id;
      const startDate = date.from.toISOString();
      const endDate = date.to.toISOString();
      const requests = [];

      if (editPromo) {
        const oldMenuIds = editPromo.menus.map((m) => m.menuId);
        const removedMenuIds = oldMenuIds.filter((id) => !selectedMenus[id]);
        removedMenuIds.forEach((menuId) =>
          requests.push(planApi.removeDiscount(planId, menuId)),
        );
      }

      selectedMenuIds.forEach((menuId) => {
        const discountPercentage =
          mode === "sama_rata"
            ? Number(globalPercent)
            : Number(menuPercents[menuId] || globalPercent);
        requests.push(
          planApi.setDiscount(planId, menuId, {
            discountPercentage,
            reason,
            startDate,
            endDate,
          }),
        );
      });

      await Promise.all(requests);
      toast.success("Aturan diskon berhasil disimpan");
      onApplied?.();
      return true;
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Terjadi kesalahan saat menyimpan diskon"),
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    plan,
    selectedMenus,
    reason,
    date,
    editPromo,
    mode,
    globalPercent,
    menuPercents,
    onApplied,
  ]);

  return {
    reason,
    setReason,
    date,
    setDate,
    mode,
    setMode,
    globalPercent,
    setGlobalPercent,
    selectedMenus,
    toggleMenu,
    toggleSelectAll,
    allSelected,
    menuPercents,
    setMenuPercent,
    isSubmitting,
    submit,
  };
}

/**
 * Hapus 1 grup promo (bisa mencakup banyak menu sekaligus) dari
 * DiscountDetailModal. Sama seperti submit() di atas, dipecah jadi banyak
 * request DELETE paralel karena backend-nya per-menu.
 */
export function useDeletePlanPromo(planId, { onDeleted } = {}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePromo = useCallback(
    async (promo) => {
      if (!planId || !promo) return false;
      setIsDeleting(true);
      try {
        await Promise.all(
          promo.menus.map((m) => planApi.removeDiscount(planId, m.menuId)),
        );
        toast.success("Promo berhasil dihapus");
        onDeleted?.();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Gagal menghapus diskon"));
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [planId, onDeleted],
  );

  return { isDeleting, deletePromo };
}
