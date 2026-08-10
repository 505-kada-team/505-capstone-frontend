import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { setMenuDiscount } from '@/services/api';

export default function DiscountModal({ isOpen, onClose, planId, menuId, onApply }) {
  const [discountPercent, setDiscountPercent] = useState('15');
  const [reason, setReason] = useState('Promo akhir bulan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!planId || !menuId) {
      toast.error('Gagal menerapkan diskon (missing id)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        discountPercentage: Number(discountPercent),
        reason,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // dummy 1 week
      };

      const res = await setMenuDiscount(planId, menuId, payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Diskon berhasil ditambahkan');
        onApply(); // Refresh PlanDetailModal
      }
    } catch {
      toast.error('Gagal menerapkan diskon');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading">Tambah Diskon</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Persentase Diskon (%)</label>
            <Input 
              type="number" 
              value={discountPercent} 
              onChange={e => setDiscountPercent(e.target.value)} 
              min="1" 
              max="100" 
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Alasan Diskon</label>
            <Input 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Contoh: Promo bundle, dsb."
              required
            />
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Terapkan Diskon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
