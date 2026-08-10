import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TriangleAlert, Link, PlusCircle, Lightbulb } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import AlertSummaryCard from '@/components/shared/AlertSummaryCard';
import PlanMenuAccordion from '@/components/shared/PlanMenuAccordion';
import DiscountModal from './DiscountModal';
import { toast } from 'sonner';
import { getPlanDetail, approvePlan, cancelPlan } from '@/services/api';

export default function PlanDetailModal({ isOpen, onClose, planId }) {
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Local state to simulate discount flow since mock data already contains it
  const [isDiscountAppliedLocally, setIsDiscountAppliedLocally] = useState(false);

  const fetchPlanDetail = useCallback(async () => {
    if (!planId) return;
    setIsLoading(true);
    try {
      const res = await getPlanDetail(planId);
      if (res.data?.success) {
        setPlan(res.data.data);
      }
    } catch {
      toast.error('Gagal mengambil detail plan');
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (isOpen && planId) {
      Promise.resolve().then(() => {
        setIsDiscountAppliedLocally(false); // Reset local state when modal opens
        fetchPlanDetail();
      });
    } else {
      Promise.resolve().then(() => {
        setPlan(null);
      });
    }
  }, [isOpen, planId, fetchPlanDetail]);

  const handleApplyDiscount = () => {
    setIsDiscountModalOpen(false);
    setIsDiscountAppliedLocally(true); // Simulate that discount is now applied
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const res = await approvePlan(planId);
      if (res.data?.success) {
        toast.success(res.data.message || 'Plan berhasil diapprove!');
        onClose();
      }
    } catch {
      toast.error('Gagal menyetujui plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHapus = async () => {
    setIsProcessing(true);
    try {
      const res = await cancelPlan(planId);
      if (res.data?.success) {
        toast.info('Plan dibatalkan');
        onClose();
      }
    } catch {
      toast.error('Gagal membatalkan plan');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to format date string gracefully
  const formatDate = (dateStr) => {
    if (!dateStr) return 'xx/xx/xxxx';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Extract info from plan
  const { hasUnsafeBatch, checkResult, menus } = plan || {};
  
  const dateRangeStr = useMemo(() => {
    if (!plan || !plan.startDate || !plan.duration) return '';
    try {
      const startMs = new Date(plan.startDate).getTime();
      if (isNaN(startMs)) return '';
      const endIso = new Date(startMs + (plan.duration - 1) * 24 * 60 * 60 * 1000).toISOString();
      return `${formatDate(plan.startDate)} - ${formatDate(endIso)}`;
    } catch {
      return '';
    }
  }, [plan]);
  
  // Only show discount if the user explicitly added it during this session
  const displayMenus = useMemo(() => {
    if (!menus) return [];
    if (!isDiscountAppliedLocally) {
      return menus.map(m => {
        const rest = { ...m };
        delete rest.discount;
        return rest;
      });
    }
    return menus;
  }, [menus, isDiscountAppliedLocally]);

  // Aggregate if there is any discount applied
  const hasDiscount = displayMenus?.some(m => m.discount?.discountPercentage > 0);

  // Convert checkResult to ingredients format for the accordion
  const mappedIngredients = useMemo(() => {
    if (!checkResult) return [];
    return checkResult.map(cr => {
      // Find the most critical batch for expired date and status
      const worstBatch = cr.eligibleBatches?.find(b => b.batchSafetyStatus === 'unsafe') || cr.eligibleBatches?.[0] || {};
      
      let statusVariant = 'aman';
      if (!cr.sufficient) statusVariant = 'kurang';
      else if (cr.hasUnsafeBatch) statusVariant = 'tidak aman';
      
      return {
        name: cr.nameInventory,
        needed: `${cr.quantityNeeded} ${cr.unit || 'unit'}`,
        available: `${cr.availableQuantity} ${cr.unit || 'unit'}`,
        shortage: cr.sufficient ? '' : `${cr.quantityNeeded - cr.availableQuantity} ${cr.unit || 'unit'}`,
        expired: worstBatch.expired ? formatDate(worstBatch.expired) : '-/-/-',
        status: statusVariant
      };
    });
  }, [checkResult]);

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          {isLoading || !plan ? (
            <div className="py-24 text-center text-muted-foreground">Memuat detail plan...</div>
          ) : (
            <>
              <DialogHeader className="mb-4 text-left">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl font-bold font-heading">
                    {plan.name || 'Nama Plan'}
                  </DialogTitle>
                  <StatusBadge variant="low stock" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{dateRangeStr}</p>
              </DialogHeader>

              {/* Alert Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <AlertSummaryCard
                  title="STATUS INVENTORY"
                  value={hasUnsafeBatch ? 'Tidak Aman' : 'Aman'}
                  variant={hasUnsafeBatch ? 'warning' : 'success'}
                  icon={<TriangleAlert className="w-5 h-5" />}
                />
                {hasDiscount ? (
                  <AlertSummaryCard
                    title="SARAN"
                    value="Diskon ditambahkan"
                    variant="success"
                    icon={<Lightbulb className="w-5 h-5" />}
                    action={
                      <Button variant="outline" size="sm" onClick={() => setIsDiscountModalOpen(true)}>
                        <Link className="w-4 h-4 mr-2" /> Lihat Diskon
                      </Button>
                    }
                  />
                ) : (
                  <AlertSummaryCard
                    title="SARAN"
                    value="Tambahkan diskon"
                    variant="success"
                    icon={<Lightbulb className="w-5 h-5" />}
                    action={
                      <Button size="sm" onClick={() => setIsDiscountModalOpen(true)}>
                        <PlusCircle className="w-4 h-4 mr-2" /> Tambah Diskon
                      </Button>
                    }
                  />
                )}
              </div>

              <div className="mb-2">
                <span className="font-semibold text-sm">Detail</span>
              </div>

              {/* Accordion List */}
              <div className="space-y-4 mb-6">
                {displayMenus?.map((menu, index) => {
                  const disc = menu.discount || {};
                  return (
                    <PlanMenuAccordion
                      key={menu.menuId}
                      menuName={menu.name}
                      badges={hasUnsafeBatch ? ['kurang'] : []}
                      defaultOpen={index === 0}
                      summary={{
                        quantity: menu.quantityPlanned,
                        originalPrice: menu.currentPrice,
                        estimatedProfit: menu.currentPrice * menu.quantityPlanned, // Simplified estimation
                        ...(disc.discountPercentage > 0 ? {
                          discountPercent: disc.discountPercentage,
                          newPrice: disc.discountedPrice,
                          newProfit: disc.discountedPrice * menu.quantityPlanned
                        } : {})
                      }}
                      ingredients={index === 0 ? mappedIngredients : []} // Attach checkResult to the first menu
                    />
                  );
                })}
              </div>

              <DialogFooter className="flex justify-between items-center sm:justify-between w-full mt-4">
                <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10" onClick={handleHapus} disabled={isProcessing}>
                  hapus
                </Button>
                <Button className="bg-[#2D241E] hover:bg-[#2D241E]/90 text-primary-foreground" onClick={handleAccept} disabled={isProcessing}>
                  {isProcessing ? 'Memproses...' : 'accept'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DiscountModal 
        isOpen={isDiscountModalOpen} 
        onClose={() => setIsDiscountModalOpen(false)} 
        planId={planId}
        menuId={menus?.[0]?.menuId} // Simplify: apply discount to first menu
        onApply={handleApplyDiscount}
      />
    </>
  );
}
