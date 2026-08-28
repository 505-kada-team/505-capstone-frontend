import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePlanDetail } from "@/hooks/plan/usePlanDetail";
import { useAddInventoryReplacement } from "@/hooks/report/useAddInventoryReplacement";

export default function ReplacementModal({ open, report, onClose, onRefresh }) {
  const [replacementQuantity, setReplacementQuantity] = useState("");
  const [varianceNote, setVarianceNote] = useState("");

  // ── Ambil detail plan untuk cek status ─────────────────────
  const planIdToFetch = open && report?.planId ? report.planId : null;
  const {
    plan: planDetail,
    isLoading: isLoadingPlan,
    error: planError,
  } = usePlanDetail(planIdToFetch);

  // ── Hook untuk submit stok pengganti ────────────────────────
  const reportId = open && report?.id ? report.id : null;
  const { addInventory, isAdding } = useAddInventoryReplacement(reportId);

  // Reset form saat modal ditutup
  useEffect(() => {
    if (!open) {
      setReplacementQuantity("");
      setVarianceNote("");
    }
  }, [open]);

  // Tampilkan error plan jika ada
  useEffect(() => {
    if (planError && open) {
      console.error("[PLAN DETAIL ERROR]", planError);
      toast.error(
        planError.response?.data?.message ?? "Gagal memuat status plan",
      );
    }
  }, [planError, open]);

  if (!report) return null;

  const planStatus = planDetail?.status ?? null;
  const isPlanActive = planStatus === "active";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!replacementQuantity || Number(replacementQuantity) <= 0) {
      toast.error("Kuantitas pengganti harus lebih besar dari 0");
      return;
    }

    if (!report.id) {
      toast.error("ID laporan tidak ditemukan");
      console.error(
        "[REPLACEMENT REPORT ERROR] report.id tidak tersedia",
        report,
      );
      return;
    }

    try {
      const payload = {
        replacementQuantity: Number(replacementQuantity),
        varianceNote: varianceNote.trim() || null,
      };

      await addInventory(payload);

      toast.success("Stok pengganti berhasil ditarik");
      await onRefresh?.();
      onClose();
    } catch (error) {
      console.error("[REPLACEMENT ERROR]", error);
      toast.error(
        error.response?.data?.details?.[0] ??
          error.response?.data?.message ??
          error.message ??
          "Gagal menarik stok pengganti",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[425px] max-h-[85vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>Tarik Stok Pengganti</DialogTitle>
          <DialogDescription>
            Tentukan berapa kuantitas stok yang ingin ditarik dari gudang
            (Inventory) untuk mengganti bahan baku yang rusak atau hilang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800">
            <div className="mb-1 font-semibold">Informasi Kerugian:</div>
            <p>
              {report.nameRef ?? "Ingredient"} mengalami kehilangan atau
              kerusakan sebanyak{" "}
              <span className="font-bold">{report.quantityLost}</span>.
            </p>
          </div>

          {isLoadingPlan && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Memeriksa status plan...
            </div>
          )}

          {!isLoadingPlan && !isPlanActive && planStatus !== null && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              <span className="block font-semibold">Plan Tidak Aktif</span>
              Plan induk untuk laporan ini tidak berstatus aktif
              {planStatus !== "unknown" ? ` (saat ini: ${planStatus})` : ""}.
              Anda tidak dapat menarik stok pengganti untuk plan yang sudah
              selesai atau berhenti.
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="replacementQuantity">
              Kuantitas Pengganti yang Ditarik
            </Label>

            <Input
              id="replacementQuantity"
              type="number"
              min="1"
              required
              placeholder={`Referensi jumlah rusak: ${report.quantityLost}`}
              value={replacementQuantity}
              onChange={(e) => setReplacementQuantity(e.target.value)}
              disabled={isLoadingPlan || !isPlanActive || isAdding}
            />

            <p className="text-xs text-muted-foreground">
              Kuantitas pengganti tidak wajib sama dengan jumlah yang rusak.
              Sesuaikan dengan kebutuhan aktual.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="varianceNote">Catatan Varians (Opsional)</Label>

            <Textarea
              id="varianceNote"
              placeholder="Misal: tarik lebih sedikit karena stok sisa di dapur masih cukup..."
              value={varianceNote}
              onChange={(e) => setVarianceNote(e.target.value)}
              disabled={isLoadingPlan || !isPlanActive || isAdding}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isAdding}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={
                isAdding ||
                isLoadingPlan ||
                !isPlanActive ||
                !replacementQuantity
              }
            >
              {isAdding ? "Memproses..." : "Tarik Stok"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
