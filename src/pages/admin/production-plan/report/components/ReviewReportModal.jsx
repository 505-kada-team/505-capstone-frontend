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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-heading">
            {readOnly ? 'Incident Report Details' : 'Review Incident Report'}
          </DialogTitle>
          <DialogDescription>
            {readOnly ? 'Review the incident details of this report.' : 'Review the incident details and make a decision.'}
          </DialogDescription>
        </DialogHeader>

        <div className="border-t border-border pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* Left Column: Metadata & Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-muted-foreground block mb-0.5 text-xs uppercase tracking-wider">Reporter</span>
                <span className="text-foreground font-medium">{report.reportedBy}</span>
                <span className="text-xs text-muted-foreground block capitalize mt-0.5">({report.reportedByRole})</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground block mb-0.5 text-xs uppercase tracking-wider">Incident Time</span>
                <span className="text-foreground font-medium">{formatTime(report.incidentAt)}</span>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg grid grid-cols-2 gap-4 border border-border/50">
              <div>
                <span className="font-semibold text-muted-foreground block mb-0.5 text-xs uppercase tracking-wider">Category / Item</span>
                <span className="capitalize text-foreground font-medium">{report.category}</span>
                <span className="text-xs text-muted-foreground block truncate max-w-[130px] mt-0.5">{report.nameRef || report.refId}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground block mb-0.5 text-xs uppercase tracking-wider">Quantity Lost</span>
                <span className="text-destructive font-semibold text-base">{report.quantityLost} pcs</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Incident Reason</span>
              <p className="text-foreground bg-muted/10 p-2.5 rounded-lg border border-border/50 min-h-16 text-xs leading-relaxed">
                {report.reason || '-'}
              </p>
            </div>
          </div>

          {/* Right Column: Financial Valuation & Admin Notes */}
          <div className="space-y-4">
            {isMenu && val && (
              <div className="border border-border rounded-lg p-3 bg-secondary/10 dark:bg-muted/30 flex flex-col gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-foreground mb-1 border-b border-border pb-1">
                  Estimated Loss Valuation
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Material Cost (Cost Loss):</span>
                  <span className="font-semibold font-mono">{formatRupiah(val.costLoss)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Potential Revenue:</span>
                  <span className="font-semibold text-orange-600 font-mono">{formatRupiah(val.lostRevenueEstimate)}</span>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="adminNote" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                Admin Notes {readOnly ? '' : '(Optional)'}
              </Label>
              {readOnly ? (
                <p className="text-foreground bg-muted/20 p-3 rounded-lg border border-border min-h-24 text-xs leading-relaxed">
                  {report.adminNote || '-'}
                </p>
              ) : (
                <Textarea
                  id="adminNote"
                  placeholder="Add decision notes for the reporter..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="min-h-24 resize-none text-xs"
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {readOnly ? (
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          ) : (
            <>
              <Button variant="destructive" onClick={() => handleReview('rejected')} disabled={isSubmitting}>
                Reject
              </Button>
              <Button className="ml-2 bg-[#4E6A3E] hover:bg-[#4E6A3E]/90 text-white" onClick={() => handleReview('approved')} disabled={isSubmitting}>
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
