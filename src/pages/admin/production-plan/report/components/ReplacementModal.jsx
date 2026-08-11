import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addInventoryReplacement, getPlanDetail } from '@/services/api';

export default function ReplacementModal({ open, report, onClose, onRefresh }) {
  const [replacementQuantity, setReplacementQuantity] = useState('');
  const [varianceNote, setVarianceNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && report?.planId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      getPlanDetail(report.planId)
        .then(res => setPlanStatus(res.data?.data?.status))
        .catch(() => setPlanStatus('unknown'))
        .finally(() => setIsLoading(false));
    }
  }, [open, report]);

  if (!report) return null;

  const isPlanActive = planStatus === 'active';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replacementQuantity || isNaN(replacementQuantity) || Number(replacementQuantity) <= 0) {
      toast.error('Kuantitas pengganti harus lebih besar dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        replacementQuantity: Number(replacementQuantity),
        varianceNote,
        // Mock requirement for API C4
        availableUntil: new Date().toISOString()
      };
      
      const res = await addInventoryReplacement(report._id, payload);
      if (res.data?.success) {
        toast.success('Penggantian stok berhasil ditarik');
        onRefresh();
        onClose();
      }
    } catch {
      toast.error('Gagal menarik stok pengganti');
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
            Tentukan berapa kuantitas stok yang ingin ditarik dari gudang (Inventory) untuk mengganti bahan baku yang rusak/hilang ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="bg-orange-50 text-orange-800 p-3 rounded-md text-sm">
            <div className="font-semibold mb-1">Informasi Kerugian:</div>
            Terdapat kehilangan/kerusakan sebanyak <span className="font-bold">{report.quantityLost}</span> porsi/unit.
          </div>

          {!isLoading && !isPlanActive && planStatus !== null && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mb-2">
              <span className="font-semibold block">Plan Tidak Aktif</span>
              Plan induk untuk laporan ini tidak berstatus aktif (saat ini: {planStatus}). Anda tidak dapat menarik stok pengganti untuk plan yang sudah selesai atau berhenti.
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="replacementQuantity">Kuantitas Pengganti yang Ditarik</Label>
            <Input
              id="replacementQuantity"
              type="number"
              placeholder={`Disarankan minimal: ${report.quantityLost}`}
              value={replacementQuantity}
              onChange={(e) => setReplacementQuantity(e.target.value)}
              required
              min="1"
              disabled={isLoading || !isPlanActive}
            />
            <p className="text-xs text-muted-foreground">Anda dapat menarik lebih sedikit atau lebih banyak dari jumlah yang rusak sesuai kebutuhan aktual.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="varianceNote">Catatan Varians (Opsional)</Label>
            <Textarea
              id="varianceNote"
              placeholder="Misal: Tarik lebih sedikit karena stok sisa di dapur masih cukup..."
              value={varianceNote}
              onChange={(e) => setVarianceNote(e.target.value)}
              disabled={isLoading || !isPlanActive}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || !isPlanActive}>
              Tarik Stok
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
