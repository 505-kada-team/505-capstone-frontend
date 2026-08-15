import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import PlanReportForm from "@/components/shared/PlanReportForm";
import { useCreatePlanReport } from "@/hooks/report/useCreatePlanReport";

export default function AddReportModal({ open, onClose, onRefresh }) {
  const { create, isCreating } = useCreatePlanReport();

  const handleSubmit = async (payload) => {
    try {
      await create(payload);
      toast.success("Report created successfully");
      onRefresh();
      onClose();
      return true;
    } catch (err) {
      console.error("[CREATE PLAN REPORT ERROR]", err.response?.data || err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to create report",
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
            Record ingredient or menu losses that occurred during production.
          </DialogDescription>
        </DialogHeader>

        <PlanReportForm onSubmit={handleSubmit} isSubmitting={isCreating} />
      </DialogContent>
    </Dialog>
  );
}
