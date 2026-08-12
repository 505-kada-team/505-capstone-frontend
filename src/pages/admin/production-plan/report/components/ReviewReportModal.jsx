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
        toast.success(`Report successfully ${decision === 'approved' ? 'approved' : 'rejected'}`);
        onRefresh();
        onClose();
      }
    } catch {
      toast.error('Failed to process report');
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
          <DialogTitle className="text-lg font-bold font-heading">
            {readOnly ? 'Incident Report Details' : 'Review Incident Report'}
          </DialogTitle>
          <DialogDescription>
            {readOnly ? 'Review the incident details of this report.' : 'Review the incident details and make a decision.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-muted-foreground block mb-1">Reporter</span>
              {report.reportedBy} ({report.reportedByRole})
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block mb-1">Incident Time</span>
              {formatTime(report.incidentAt)}
            </div>
          </div>

          <div className="bg-muted/30 p-3 rounded-md grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-muted-foreground block mb-1">Category / Item</span>
              <span className="capitalize">{report.category}</span>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground block mb-1">Quantity Lost</span>
              <span className="text-destructive font-semibold">{report.quantityLost}</span>
            </div>
          </div>

          <div>
            <span className="font-semibold text-muted-foreground block mb-1">Incident Reason</span>
            <p className="text-foreground">{report.reason || '-'}</p>
          </div>

          {isMenu && val && (
            <div className="border border-border rounded-md p-3 flex flex-col gap-2">
              <span className="font-semibold mb-1">Estimated Loss Valuation</span>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Material Cost (Cost Loss):</span>
                <span className="font-semibold">{formatRupiah(val.costLoss)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Potential Revenue:</span>
                <span className="font-semibold text-orange-600">{formatRupiah(val.lostRevenueEstimate)}</span>
              </div>
            </div>
          )}

          <div className="grid gap-2 mt-2">
            <Label htmlFor="adminNote">Admin Notes {readOnly ? '' : '(Optional)'}</Label>
            {readOnly ? (
              <p className="text-foreground bg-muted/20 p-2 rounded-md border border-border min-h-10">
                {report.adminNote || '-'}
              </p>
            ) : (
              <Textarea
                id="adminNote"
                placeholder="Add notes for the reporter..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {readOnly ? (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleReview('rejected')} disabled={isSubmitting}>
                Reject
              </Button>
              <Button className="bg-[#4E6A3E] hover:bg-[#4E6A3E]/90 text-white" onClick={() => handleReview('approved')} disabled={isSubmitting}>
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
