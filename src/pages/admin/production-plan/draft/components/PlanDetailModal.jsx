import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TriangleAlert, Link, PlusCircle, Lightbulb } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import AlertSummaryCard from '@/components/shared/AlertSummaryCard';
import PlanMenuAccordion from '@/components/shared/PlanMenuAccordion';
import DiscountModal from './DiscountModal';
import DiscountDetailModal from './DiscountDetailModal';
import { toast } from 'sonner';
import { getPlanDetail, approvePlan, cancelPlan, deleteMenuDiscount } from '@/services/api';

export default function PlanDetailModal({ isOpen, onClose, planId }) {
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editPromo, setEditPromo] = useState(null);
  
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPlanDetail = useCallback(async () => {
    if (!planId) return;
    setIsLoading(true);
    try {
      const res = await getPlanDetail(planId);
      if (res.data?.success) {
        setPlan(res.data.data);
      }
    } catch {
      toast.error('Failed to get detail plan');
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlanDetail();
    } else {
      setPlan(null);
      setEditPromo(null);
    }
  }, [isOpen, planId, fetchPlanDetail]);

  const handleApplyDiscount = () => {
    fetchPlanDetail(); // Refresh data from backend
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const res = await approvePlan(planId);
      if (res.data?.success) {
        toast.success(res.data.message || 'Plan successfully approved!');
        onClose();
      }
    } catch {
      toast.error('Failed to approve plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHapus = async () => {
    setIsProcessing(true);
    try {
      const res = await cancelPlan(planId);
      if (res.data?.success) {
        toast.info('Plan cancelled');
        onClose();
      }
    } catch {
      toast.error('Failed to cancel plan');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to format date string gracefully
  const formatDate = (dateStr) => {
    if (!dateStr) return 'xx/xx/xxxx';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
  
  // Extract single grouped promo from menus
  const promoGroup = useMemo(() => {
    if (!plan?.menus) return null;
    const discountedMenus = plan.menus.filter(m => m.discount?.discountPercentage > 0);
    if (discountedMenus.length === 0) return null;
    
    const firstDiscount = discountedMenus[0].discount;
    return {
      reason: firstDiscount.reason || 'Promo',
      startDate: firstDiscount.startDate,
      endDate: firstDiscount.endDate,
      menus: discountedMenus.map(m => ({
        menuId: m.menuId,
        name: m.name,
        originalPrice: m.effectiveSellingPrice || m.currentPrice || 0,
        discountPercentage: m.discount.discountPercentage,
        discountedPrice: m.discount.discountedPrice || 0
      }))
    };
  }, [plan]);

  const hasDiscount = !!promoGroup;
  const displayMenus = menus || [];

  const handleEditDiscount = (promo) => {
    setEditPromo(promo);
    setIsDetailModalOpen(false);
    setIsDiscountModalOpen(true);
  };

  const handleDeleteDiscount = async (promo) => {
    if (!plan?._id) return;
    try {
      const promises = promo.menus.map(m => deleteMenuDiscount(plan._id, m.menuId));
      await Promise.all(promises);
      toast.success('Promo berhasil dihapus');
      fetchPlanDetail();
    } catch (err) {
      console.error(err);
    }
  };

  // Convert checkResult to ingredients format for the accordion
  const mappedIngredients = useMemo(() => {
    if (!checkResult) return [];
    return checkResult.map(cr => {
      // Find the most critical batch for expired date and status
      const worstBatch = cr.eligibleBatches?.find(b => b.batchSafetyStatus === 'unsafe') || cr.eligibleBatches?.[0] || {};
      
      let statusVariant = 'safe';
      if (!cr.sufficient) statusVariant = 'less';
      else if (cr.hasUnsafeBatch) statusVariant = 'unsafe';
      
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
            <div className="py-24 text-center text-muted-foreground">Loading detail plan...</div>
          ) : (
            <>
              <DialogHeader className="mb-4 text-left">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl font-bold font-heading">
                    {plan.name || 'Plan Name'}
                  </DialogTitle>
                  <StatusBadge variant="low stock" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{dateRangeStr}</p>
              </DialogHeader>

              {/* Alert Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <AlertSummaryCard
                  title="INVENTORY STATUS"
                  value={hasUnsafeBatch ? 'Unsafe' : 'Safe'}
                  variant={hasUnsafeBatch ? 'warning' : 'success'}
                  icon={<TriangleAlert className="w-5 h-5" />}
                />
                {hasDiscount ? (
                  <AlertSummaryCard
                    title="TIPS"
                    value="Discount added"
                    variant="success"
                    icon={<Lightbulb className="w-5 h-5" />}
                    action={
                      <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(true)}>
                        <Link className="w-4 h-4 mr-2" /> View Discount
                      </Button>
                    }
                  />
                ) : (
                  <AlertSummaryCard
                    title="TIPS"
                    value="Add discount"
                    variant="success"
                    icon={<Lightbulb className="w-5 h-5" />}
                    action={
                      <Button size="sm" onClick={() => { setEditPromo(null); setIsDiscountModalOpen(true); }}>
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Discount
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
                  Remove
                </Button>
                <Button className="bg-[#F97316] hover:bg-[#F97316]/90 text-white" onClick={handleAccept} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Accept'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DiscountModal 
        isOpen={isDiscountModalOpen} 
        onClose={() => setIsDiscountModalOpen(false)} 
        plan={plan}
        editPromo={editPromo}
        onApply={handleApplyDiscount}
      />
      
      <DiscountDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        promo={promoGroup}
        onEdit={handleEditDiscount}
        onDelete={handleDeleteDiscount}
      />
    </>
  );
}
