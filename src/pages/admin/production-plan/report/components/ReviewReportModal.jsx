import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { reviewPlanReport } from '@/services/api';

export default function ReviewReportModal({ open, report, onClose, onRefresh, readOnly = false }) {
  const [adminNote, setAdminNote] = useState(report?.adminNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!report) return null;

  const handleReview = async (decision) => {
    setIsSubmitting(true);
    try {
      const res = await reviewPlanReport(report._id, { decision, adminNote });
      if (res.data?.success) {
        toast.success(`Laporan berhasil di-${decision === 'approved' ? 'setujui' : 'tolak'}`);
        onRefresh();
        onClose();
      }
    } catch {
      toast.error('Gagal memproses laporan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMenu = report.category === 'menu';
  const val = report.valuation;

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
  const formatTime = (dateStr) => new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{readOnly ? 'Detail Laporan Insiden' : 'Review Laporan Insiden'}</DialogTitle>
          <DialogDescription>
            {readOnly ? 'Tinjau detail kejadian laporan insiden ini.' : 'Tinjau detail kejadian dan berikan keputusan.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-muted-foreground block mb-1">Pelapor</span>
              {report.reportedBy} ({report.reportedByRole})
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block mb-1">Waktu Kejadian</span>
              {formatTime(report.incidentAt)}
            </div>
          </div>

          <div className="bg-muted/30 p-3 rounded-md grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-muted-foreground block mb-1">Kategori / Item</span>
              <span className="capitalize">{report.category}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block mb-1">Kuantitas Rusak</span>
              <span className="text-destructive font-semibold">{report.quantityLost}</span>
            </div>
          </div>

          <div>
            <span className="font-semibold text-muted-foreground block mb-1">Alasan Insiden</span>
            <p className="text-foreground">{report.reason || '-'}</p>
          </div>

          {isMenu && val && (
            <div className="border border-border rounded-md p-3 flex flex-col gap-2">
              <span className="font-semibold mb-1">Valuasi Kerugian (Estimasi)</span>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cost Bahan (Cost Loss):</span>
                <span className="font-semibold">{formatRupiah(val.costLoss)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Potensi Pendapatan:</span>
                <span className="font-semibold text-orange-600">{formatRupiah(val.lostRevenueEstimate)}</span>
              </div>
            </div>
          )}

          <div className="grid gap-2 mt-2">
            <Label htmlFor="adminNote">Catatan Admin {readOnly ? '' : '(Opsional)'}</Label>
            {readOnly ? (
              <p className="text-foreground bg-muted/20 p-2 rounded-md border border-border min-h-10">
                {report.adminNote || '-'}
              </p>
            ) : (
              <Textarea
                id="adminNote"
                placeholder="Tambahkan catatan untuk pelapor..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {readOnly ? (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Tutup
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button variant="destructive" onClick={() => handleReview('rejected')} disabled={isSubmitting}>
                Reject
              </Button>
              <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleReview('approved')} disabled={isSubmitting}>
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
