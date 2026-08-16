import { useState, useEffect, useCallback } from "react";
import { setMenuDiscount } from "@/services/plan/plan.api";
import { toast } from "sonner";

// --------------------------------------------------------------
// Hook untuk form diskon banyak menu (DiscountModal)
// --------------------------------------------------------------
export function usePlanDiscountForm({
  isOpen,
  plan,
  planId, // ⬅️ tambahkan
  editPromo,
  initialSelectedMenuId,
  onApplied,
}) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(null);
  const [mode, setMode] = useState("sama_rata");
  const [globalPercent, setGlobalPercent] = useState("");
  const [selectedMenus, setSelectedMenus] = useState({});
  const [menuPercents, setMenuPercents] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form saat modal dibuka / editPromo berubah
  useEffect(() => {
    if (!isOpen) return;

    if (editPromo) {
      setReason(editPromo.reason || "");
      setDate({
        from: new Date(editPromo.startDate),
        to: new Date(editPromo.endDate),
      });
      setMode("beda_per_menu");
      setGlobalPercent(String(editPromo.discountPercentage || ""));
      const menuId = editPromo.menuId || initialSelectedMenuId;
      setSelectedMenus({ [menuId]: true });
      setMenuPercents({ [menuId]: String(editPromo.discountPercentage || "") });
    } else {
      // Mode tambah baru
      setReason("");
      setDate(null);
      setMode("sama_rata");
      setGlobalPercent("");
      setSelectedMenus({});
      setMenuPercents({});
    }
  }, [isOpen, editPromo, initialSelectedMenuId]);

  const toggleMenu = useCallback((menuId) => {
    setSelectedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!plan?.menus?.length) return;
    const allSelected = plan.menus.every((m) => selectedMenus[m.menuId]);
    const nextSelected = {};
    plan.menus.forEach((m) => {
      nextSelected[m.menuId] = !allSelected;
    });
    setSelectedMenus(nextSelected);
  }, [plan, selectedMenus]);

  const setMenuPercent = useCallback((menuId, value) => {
    setMenuPercents((prev) => ({
      ...prev,
      [menuId]: value,
    }));
  }, []);

  const allSelected =
    plan?.menus?.length > 0 && plan.menus.every((m) => selectedMenus[m.menuId]);

  const submit = useCallback(async () => {
    if (!plan?.menus?.length) return false;

    // Validasi dasar
    if (!reason.trim()) return false;
    if (!date?.from || !date?.to) return false;

    // Validasi H+1 (Minimal besok)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const fromDate = new Date(date.from);
    fromDate.setHours(0, 0, 0, 0);

    const planStart = plan?.startDate ? new Date(plan.startDate) : null;
    if (planStart) {
      planStart.setHours(0, 0, 0, 0);
    }
    const minAllowed = planStart && planStart > tomorrow ? planStart : tomorrow;

    if (fromDate < minAllowed) {
      toast.error(
        "Tanggal mulai diskon minimal harus H+1 dari hari set diskon (mulai besok) dan berada dalam masa aktif plan"
      );
      return false;
    }

    // Kumpulkan menu yang dipilih
    const menusToProcess = plan.menus.filter((m) => selectedMenus[m.menuId]);
    if (menusToProcess.length === 0) return false;

    // Tentukan persentase per menu
    const percentMap = {};
    for (const menu of menusToProcess) {
      if (mode === "sama_rata") {
        const pct = Number(globalPercent);
        if (!pct || pct < 1 || pct > 100) return false;
        percentMap[menu.menuId] = pct;
      } else {
        const pct = Number(menuPercents[menu.menuId]);
        if (!pct || pct < 1 || pct > 100) return false;
        percentMap[menu.menuId] = pct;
      }
    }

    setIsSubmitting(true);
    try {
      // Panggil endpoint A9 untuk setiap menu terpilih
      await Promise.all(
        menusToProcess.map((menu) =>
          setMenuDiscount(planId, menu.menuId, {
            discountPercentage: percentMap[menu.menuId],
            startDate: date.from.toISOString(),
            endDate: date.to.toISOString(),
            reason: reason.trim(),
          }),
        ),
      );

      onApplied?.();
      return true;
    } catch (err) {
      console.error("Gagal menyimpan diskon:", err);
      console.error("Status:", err.response?.status);
      console.error("Response data:", err.response?.data);
      const errMsg = err.response?.data?.message || err.message || "Gagal menyimpan diskon";
      toast.error(errMsg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    plan,
    planId,
    reason,
    date,
    mode,
    globalPercent,
    menuPercents,
    selectedMenus,
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
