import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PlanReportForm from '@/components/shared/PlanReportForm';
import { createPlanReport } from '@/services/api';

export default function AddReportModal({ open, onClose, onRefresh }) {
  const handleSubmit = async (payload) => {
    try {
      const res = await createPlanReport(payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Report successfully created');
        onRefresh();
        onClose();
      } else {
        toast.error(res.data?.message || 'Failed to create report');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect to server');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-heading">Add Incident Report</DialogTitle>
          <DialogDescription>
            Record raw material or menu losses that occurred during production.
          </DialogDescription>
        </DialogHeader>
        <div className="border-t border-border pt-2 mt-2 max-h-[60vh] overflow-y-auto pr-2 pb-2">
          <PlanReportForm id="plan-report-form" onSubmit={handleSubmit} />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="plan-report-form"
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
