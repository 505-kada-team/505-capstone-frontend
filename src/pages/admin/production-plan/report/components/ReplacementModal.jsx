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
      toast.error('Replacement quantity must be greater than 0');
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
        toast.success('Replacement stock successfully pulled');
        onRefresh();
        onClose();
      }
    } catch {
      toast.error('Failed to pull replacement stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-heading">Pull Replacement Stock</DialogTitle>
          <DialogDescription>
            Determine the quantity of stock to pull from the warehouse (Inventory) to replace this damaged/lost raw material.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="bg-orange-50 text-orange-800 p-3 rounded-md text-sm">
            <div className="font-semibold mb-1">Loss Information:</div>
            There is a loss/damage of <span className="font-bold">{report.quantityLost}</span> portions/units.
          </div>

          {!isLoading && !isPlanActive && planStatus !== null && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mb-2">
              <span className="font-semibold block">Plan Inactive</span>
              The parent plan for this report is not active (current status: {planStatus}). You cannot pull replacement stock for a plan that is completed or stopped.
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="replacementQuantity">Replacement Quantity to Pull</Label>
            <Input
              id="replacementQuantity"
              type="number"
              placeholder={`Recommended minimum: ${report.quantityLost}`}
              value={replacementQuantity}
              onChange={(e) => setReplacementQuantity(e.target.value)}
              required
              min="1"
              disabled={isLoading || !isPlanActive}
            />
            <p className="text-xs text-muted-foreground">You can pull less or more than the damaged amount based on actual needs.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="varianceNote">Variance Note (Optional)</Label>
            <Textarea
              id="varianceNote"
              placeholder="Example: Pull less because remaining kitchen stock is sufficient..."
              value={varianceNote}
              onChange={(e) => setVarianceNote(e.target.value)}
              disabled={isLoading || !isPlanActive}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading || !isPlanActive}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
            >
              Pull Stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
