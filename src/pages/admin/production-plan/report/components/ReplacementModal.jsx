import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { planApi } from '@/services/plan/plan.api';

export default function ReplacementModal({ open, report, onClose, onRefresh }) {
  const [replacementQuantity, setReplacementQuantity] = useState('');
  const [varianceNote, setVarianceNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !report?.planId) return;

    setIsLoading(true);
    setPlanStatus(null);

    planApi.detail(report.planId)
      .then((res) => {
        console.log('[PLAN DETAIL RESPONSE]', res);
        setPlanStatus(res.data?.status ?? null);
      })
      .catch((error) => {
        console.error('[PLAN DETAIL ERROR]', error);
        console.error('[PLAN DETAIL RESPONSE ERROR]', error.response?.data);
        setPlanStatus('unknown');
      })
      .finally(() => setIsLoading(false));
  }, [open, report?.planId]);

  useEffect(() => {
    if (!open) {
      setReplacementQuantity('');
      setVarianceNote('');
      setPlanStatus(null);
    }
  }, [open]);

  if (!report) return null;

  const isPlanActive = planStatus === 'active';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!replacementQuantity || Number(replacementQuantity) <= 0) {
      toast.error('Kuantitas pengganti harus lebih besar dari 0');
      return;
    }

    if (!report.id) {
      toast.error('ID laporan tidak ditemukan');
      console.error('[REPLACEMENT REPORT ERROR] report.id tidak tersedia', report);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        replacementQuantity: Number(replacementQuantity),
        varianceNote: varianceNote.trim() || null,
      };

      console.log('[REPLACEMENT REPORT]', { reportId: report.id, payload });

      const res = await planApi.addReportInventory(report.id, payload);

      console.log('[REPLACEMENT RESPONSE]', res);

      if (res.success) {
        toast.success(res.message ?? 'Stok pengganti berhasil ditarik');
        await onRefresh();
        onClose();
      }
    } catch (error) {
      console.error('[REPLACEMENT ERROR]', error);
      console.error('[REPLACEMENT RESPONSE ERROR]', error.response?.data);
      console.error('[REPLACEMENT DETAILS]', error.response?.data?.details);

      toast.error(
        error.response?.data?.details?.[0] ??
        error.response?.data?.message ??
        'Gagal menarik stok pengganti'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tarik Stok Pengganti</DialogTitle>
          <DialogDescription>
            Tentukan berapa kuantitas stok yang ingin ditarik dari gudang (Inventory) untuk mengganti bahan baku yang rusak atau hilang.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800">
            <div className="mb-1 font-semibold">Informasi Kerugian:</div>
            <p>
              {report.nameRef ?? 'Ingredient'} mengalami kehilangan atau kerusakan sebanyak{' '}
              <span className="font-bold">{report.quantityLost}</span>.
            </p>
          </div>

          {isLoading && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Memeriksa status plan...
            </div>
          )}

          {!isLoading && !isPlanActive && planStatus !== null && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              <span className="block font-semibold">Plan Tidak Aktif</span>
              Plan induk untuk laporan ini tidak berstatus aktif
              {planStatus !== 'unknown' ? ` (saat ini: ${planStatus})` : ''}. Anda tidak dapat menarik stok pengganti untuk plan yang sudah selesai atau berhenti.
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="replacementQuantity">Kuantitas Pengganti yang Ditarik</Label>

            <Input
              id="replacementQuantity"
              type="number"
              min="1"
              required
              placeholder={`Referensi jumlah rusak: ${report.quantityLost}`}
              value={replacementQuantity}
              onChange={(e) => setReplacementQuantity(e.target.value)}
              disabled={isLoading || !isPlanActive || isSubmitting}
            />

            <p className="text-xs text-muted-foreground">
              Kuantitas pengganti tidak wajib sama dengan jumlah yang rusak. Sesuaikan dengan kebutuhan aktual.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="varianceNote">Catatan Varians (Opsional)</Label>

            <Textarea
              id="varianceNote"
              placeholder="Misal: tarik lebih sedikit karena stok sisa di dapur masih cukup..."
              value={varianceNote}
              onChange={(e) => setVarianceNote(e.target.value)}
              disabled={isLoading || !isPlanActive || isSubmitting}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>

            <Button type="submit" disabled={isSubmitting || isLoading || !isPlanActive || !replacementQuantity}>
              {isSubmitting ? 'Memproses...' : 'Tarik Stok'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}