import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-heading">Add Incident Report</DialogTitle>
          <DialogDescription>
            Record raw material or menu losses that occurred during production.
          </DialogDescription>
        </DialogHeader>
        <PlanReportForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
