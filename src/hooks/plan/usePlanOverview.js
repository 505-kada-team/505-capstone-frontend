import { useCallback, useMemo } from "react";
import { usePlanList } from "./usePlanList";
import { usePlanDetail } from "./usePlanDetail";

/**
 * View-model untuk halaman "Active Plan": gabungan daftar plan (buat
 * riwayat + deteksi plan active) dan detail plan active-nya (buat tracking
 * per-menu + aksi stop).
 *
 * Ini komposisi dari 2 hook yang lebih kecil (usePlanList + usePlanDetail),
 * bukan implementasi fetch baru -- supaya logic "cari plan berstatus
 * active lalu fetch detailnya" tidak diulang di tiap halaman yang butuh.
 *
 * `limit: 100` dipakai (bukan default backend 10) supaya plan active tidak
 * "hilang" kalau posisinya di luar halaman pertama daftar riwayat. Kalau
 * nanti UI riwayat butuh pagination betulan, pisahkan lagi query list-nya.
 */
export function useActivePlanOverview() {
  const {
    plans,
    isLoading: isListLoading,
    refetch: refetchList,
  } = usePlanList({ limit: 100 });

  const activePlanId = useMemo(
    () => plans.find((p) => p.status === "active")?._id ?? null,
    [plans],
  );

  const {
    plan: activePlanDetail,
    isLoading: isDetailLoading,
    isMutating: isStopping,
    stop,
    refetch: refetchDetail,
  } = usePlanDetail(activePlanId, { onMutationSuccess: refetchList });

  const refetch = useCallback(() => {
    refetchList();
    if (activePlanId) refetchDetail();
  }, [refetchList, refetchDetail, activePlanId]);

  return {
    plans,
    activePlanDetail,
    isLoading: isListLoading || (!!activePlanId && isDetailLoading),
    isStopping,
    stopActivePlan: stop,
    refetch,
  };
}
