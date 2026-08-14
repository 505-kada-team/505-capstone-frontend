import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import PlanReportForm from '@/components/shared/PlanReportForm';
import { createPlanReport } from '@/services/api';

export default function AddReportModal({
  open,
  onClose,
  onRefresh,
}) {
  const handleSubmit = async (payload) => {
    try {
      const res = await createPlanReport(payload);

      if (res.data?.success) {
        toast.success(
          res.data.message || 'Report created successfully',
        );

        onRefresh();
        onClose();

        return true;
      }

      toast.error(
        res.data?.message || 'Failed to create report',
      );

      return false;
    } catch (err) {
      console.error(
        '[CREATE PLAN REPORT ERROR]',
        err.response?.data || err,
      );

      toast.error(
        err.response?.data?.message ||
          'Failed to create report',
      );

      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add Incident Report</DialogTitle>

          <DialogDescription>
            Record ingredient or menu losses that occurred
            during production.
          </DialogDescription>
        </DialogHeader>

        <PlanReportForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}