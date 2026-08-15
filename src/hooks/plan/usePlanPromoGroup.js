import { useMemo } from "react";

/**
 * Mengelompokkan diskon dari daftar menu plan menjadi satu objek promo group.
 * Diasumsikan hanya ada satu grup diskon per plan.
 *
 * @param {Array} menus - array menu dari detail plan
 * @returns {Object|null} promo group dengan struktur:
 *   {
 *     menuId: string,          // menuId pertama yang memiliki diskon (untuk delete)
 *     reason: string,
 *     startDate: string,
 *     endDate: string,
 *     menus: Array<{
 *       menuId: string,
 *       name: string,
 *       originalPrice: number,
 *       discountPercentage: number,
 *       discountedPrice: number
 *     }>
 *   }
 */
export function usePlanPromoGroup(menus) {
  return useMemo(() => {
    if (!menus || !Array.isArray(menus)) return null;

    const menusWithDiscount = menus.filter((menu) => menu.discount);
    if (menusWithDiscount.length === 0) return null;

    const firstDiscount = menusWithDiscount[0].discount;

    const promoMenus = menusWithDiscount.map((menu) => ({
      menuId: menu.menuId,
      name: menu.name,
      originalPrice: menu.effectiveSellingPrice,
      discountPercentage: menu.discount.discountPercentage,
      discountedPrice: menu.discount.discountedPrice,
    }));

    return {
      menuId: menusWithDiscount[0].menuId, // dipakai untuk delete single menu
      reason: firstDiscount.reason,
      startDate: firstDiscount.startDate,
      endDate: firstDiscount.endDate,
      menus: promoMenus,
    };
  }, [menus]);
}
