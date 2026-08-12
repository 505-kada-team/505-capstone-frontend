import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PlanReportForm from '@/components/shared/PlanReportForm';
import { createPlanReport } from '@/services/api';

export default function AddReportModal({ open, onClose, onRefresh }) {
  const handleSubmit = async (payload) => {
    try {
      const res = await createPlanReport(payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Laporan berhasil dibuat');
        onRefresh();
        onClose();
      } else {
        toast.error(res.data?.message || 'Gagal membuat laporan');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghubungi server');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Tambah Laporan Insiden</DialogTitle>
          <DialogDescription>
            Catat kerugian bahan baku atau menu yang terjadi selama produksi.
          </DialogDescription>
        </DialogHeader>
        <PlanReportForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
