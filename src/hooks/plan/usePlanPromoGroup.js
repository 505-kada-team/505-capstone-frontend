import { useMemo } from "react";

/**
 * Turunkan 1 "grup promo" dari plan.menus untuk ditampilkan di
 * DiscountDetailModal/AlertSummaryCard.
 *
 * Catatan desain: di data model, tiap menu punya slot `discount` yang
 * independen (bisa beda reason/periode per menu). UI saat ini menyatukan
 * semuanya jadi SATU kartu promo, diambil dari diskon menu PERTAMA yang
 * discountPercentage > 0 -- sama seperti perilaku asli di
 * PlanDetailPane/PlanDetailModal sebelum di-refactor. Kalau nanti produk
 * butuh multi-promo per plan, ganti hook ini jadi usePlanPromoGroups
 * (plural) yang group-by reason+periode, dan sesuaikan
 * DiscountDetailModal untuk menerima array.
 */
export function usePlanPromoGroup(menus) {
  return useMemo(() => {
    if (!menus) return null;
    const discountedMenus = menus.filter(
      (m) => m.discount?.discountPercentage > 0,
    );
    if (discountedMenus.length === 0) return null;

    const firstDiscount = discountedMenus[0].discount;
    return {
      reason: firstDiscount.reason || "Promo",
      startDate: firstDiscount.startDate,
      endDate: firstDiscount.endDate,
      menus: discountedMenus.map((m) => ({
        menuId: m.menuId,
        name: m.name,
        originalPrice: m.effectiveSellingPrice ?? m.frozenSellingPrice ?? 0,
        discountPercentage: m.discount.discountPercentage,
        discountedPrice: m.discount.discountedPrice ?? 0,
      })),
    };
  }, [menus]);
}
