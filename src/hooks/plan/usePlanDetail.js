import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { planApi } from "@/services/plan/plan.api";
import { mapPlanDetail } from "@/services/plan/plan.mapper";
import { getApiErrorMessage } from "@/lib/apiError";

/**
 * Data + lifecycle untuk 1 Plan: detail (A3) dan aksi-aksi yang mengubah
 * status/bagiannya (A5 refreshAvailability, A6 approve, A7 stop, A8 cancel,
 * A9 setDiscount, A10 removeDiscount).
 *
 * Digabung dalam 1 hook karena semuanya berbagi 1 alasan untuk berubah:
 * "state plan ini berubah di backend -> refetch detail supaya UI selalu
 * sinkron dengan backend". Kita TIDAK meng-update state secara optimis di
 * client (mis. langsung set status: 'active' setelah approve), karena
 * banyak field turunan (frozenSellingPrice, committedIngredients, dst) baru
 * benar-benar valid setelah dihitung ulang di backend.
 *
 * @param {string|null|undefined} planId - null/undefined -> hook idle, plan = null.
 * @param {{ onMutationSuccess?: () => void }} [options] onMutationSuccess
 * dipanggil setelah aksi berhasil (mis. untuk refresh list plan di komponen induk).
 */
export function usePlanDetail(planId, { onMutationSuccess } = {}) {
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMutating, setIsMutating] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!planId) {
      setPlan(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const envelope = await planApi.detail(planId);
      setPlan(mapPlanDetail(envelope.data));
    } catch (err) {
      setError(err);
      toast.error(getApiErrorMessage(err, "Gagal memuat detail plan"));
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /**
   * Bungkus 1 pemanggilan aksi plan.api: tampilkan toast sukses/gagal,
   * refetch detail (default: true) supaya semua field turunan ikut fresh,
   * lalu beri tahu pemanggil lewat onMutationSuccess.
   */
  const runMutation = useCallback(
    async (fn, { successMessage, refetchAfter = true } = {}) => {
      setIsMutating(true);
      try {
        const envelope = await fn();
        toast.success(envelope?.message || successMessage);
        if (refetchAfter) await fetchDetail();
        onMutationSuccess?.();
        return { ok: true, data: envelope?.data };
      } catch (err) {
        toast.error(getApiErrorMessage(err));
        return { ok: false, error: err };
      } finally {
        setIsMutating(false);
      }
    },
    [fetchDetail, onMutationSuccess],
  );

  const approve = useCallback(
    () =>
      runMutation(() => planApi.approve(planId), {
        successMessage: "Plan disetujui",
      }),
    [planId, runMutation],
  );

  /** A8 - cancel draft. Dinamai `reject` di sini karena itu istilah yang dipakai UI (tombol Reject). */
  const reject = useCallback(
    () =>
      runMutation(() => planApi.cancel(planId), {
        successMessage: "Draft plan dibatalkan",
      }),
    [planId, runMutation],
  );

  const stop = useCallback(
    (payload) =>
      runMutation(() => planApi.stop(planId, payload), {
        successMessage: "Plan dihentikan",
      }),
    [planId, runMutation],
  );

  const refreshAvailability = useCallback(
    () =>
      runMutation(() => planApi.refreshAvailability(planId), {
        successMessage: "Simulasi ketersediaan di-refresh",
      }),
    [planId, runMutation],
  );

  const setDiscount = useCallback(
    (menuId, payload) =>
      runMutation(() => planApi.setDiscount(planId, menuId, payload), {
        successMessage: "Diskon disimpan",
      }),
    [planId, runMutation],
  );

  const removeDiscount = useCallback(
    (menuId) =>
      runMutation(() => planApi.removeDiscount(planId, menuId), {
        successMessage: "Diskon dihapus",
      }),
    [planId, runMutation],
  );

  return {
    plan,
    isLoading,
    error,
    isMutating,
    refetch: fetchDetail,
    approve,
    reject,
    stop,
    refreshAvailability,
    setDiscount,
    removeDiscount,
  };
}
