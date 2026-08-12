import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Printer, Edit, CheckCircle, StopCircle, Eye, Lightbulb, Link } from 'lucide-react';
import { getPlanDetail, cancelPlan, approvePlan, stopPlan } from '@/services/api';

import StatusBadge from '@/components/shared/StatusBadge';
import AlertSummaryCard from '@/components/shared/AlertSummaryCard';
import PlanMenuAccordion from '@/components/shared/PlanMenuAccordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DiscountModal from '../draft/components/DiscountModal';
import DiscountDetailModal from '../draft/components/DiscountDetailModal';
import { deleteMenuDiscount } from '@/services/api';

/**
 * Helper to derive badge variant.
 */
function deriveBadgeVariant(plan) {
  if (plan.status === 'active') return 'active';
  if (plan.status === 'completed') return 'completed';
  if (plan.status === 'stopped' || plan.status === 'cancelled') return 'stopped';
  if (!plan.readyToApprove || plan.hasUnsafeBatch) return 'low stock';
  return 'in-stock';
}

function getInitials(name) {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, '0')} ${
    ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][date.getMonth()]
  } ${date.getFullYear()}`;
}

export default function PlanDetailPane({ planId, onRefreshList }) {
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [confirmStopOpen, setConfirmStopOpen] = useState(false);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editPromo, setEditPromo] = useState(null);

  const fetchDetail = async () => {
    if (!planId) return;
    setIsLoading(true);
      try {
        const res = await getPlanDetail(planId);
        if (res.data?.success) {
          setPlan(res.data.data);
        }
      } catch {
        toast.error('Failed to load plan detail');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [planId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-24 gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
        <p className="text-sm">Loading plan details...</p>
      </div>
    );
  }

  if (!plan) {
    return null; // Handle by parent's empty state
  }

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const res = await approvePlan(plan._id);
      if (res.data?.success) {
        toast.success(res.data.message || 'Plan disetujui');
        onRefreshList();
        // Refresh detail
        const fresh = await getPlanDetail(plan._id);
        setPlan(fresh.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal approve plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const res = await cancelPlan(plan._id);
      if (res.data?.success) {
        toast.success('Plan ditolak & dihapus');
        onRefreshList();
        setPlan(null); // Will trigger empty state
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal reject plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = async () => {
    setIsProcessing(true);
    try {
      const res = await stopPlan(plan._id, { reason: 'Dihentikan admin', stoppedBy: 'Admin' });
      if (res.data?.success) {
        toast.success('Plan dihentikan');
        setConfirmStopOpen(false);
        onRefreshList();
        const fresh = await getPlanDetail(plan._id);
        setPlan(fresh.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal stop plan');
    } finally {
      setIsProcessing(false);
    }
  };

  // Map ingredients based on status
  const ingredientsSource = plan.status === 'draft' ? plan.checkResult : plan.committedIngredients;
  const mappedIngredients = (ingredientsSource || []).map(ing => {
    let currentAvailable;
    let isUnsafe;
    let earliestExpiry = null;
    
    if (plan.status === 'draft') {
      isUnsafe = ing.hasUnsafeBatch;
      currentAvailable = ing.availableQuantity;
      if (ing.eligibleBatches?.length > 0) {
        earliestExpiry = ing.eligibleBatches[0].expired;
      }
    } else {
      currentAvailable = ing.batches?.reduce((sum, b) => sum + (b.quantityUsed || 0), 0) || 0;
      isUnsafe = ing.batches?.some(b => b.batchSafetyStatus === 'unsafe') || false;
      if (ing.batches?.length > 0) {
        // Mock earliest expiry for active (not directly in committedIngredients batch in mock, but lets assume)
        earliestExpiry = ing.batches[0].expired || null; 
      }
    }

    const shortage = ing.quantityNeeded > currentAvailable ? (ing.quantityNeeded - currentAvailable) : 0;

    return {
      name: ing.nameInventory,
      needed: `${ing.quantityNeeded} kg`, // Mock unit
      available: `${currentAvailable} kg`,
      status: isUnsafe ? 'tidak aman' : 'aman',
      shortage: shortage > 0 ? `${shortage} kg` : '-',
      expired: earliestExpiry ? formatDate(earliestExpiry) : '-/-/-'
    };
  });

  const badgeVariant = deriveBadgeVariant(plan);
  const isDraft = plan.status === 'draft';
  const isActive = plan.status === 'active';

  // Calculate Total Target
  const totalTarget = plan.menus?.reduce((sum, menu) => sum + (menu.quantityPlanned || 0), 0) || 0;
  
  // Check if plan has discount and extract it
  const promoGroup = (() => {
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
  })();
  const hasPlanDiscount = !!promoGroup;

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
      fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold font-heading text-foreground">{plan.name}</h2>
              <StatusBadge variant={badgeVariant} />
            </div>
            <p className="text-muted-foreground text-sm">Plan your selling and estimate the flow.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Printer className="w-4 h-4 text-muted-foreground" />
            </Button>
            {isDraft && (
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Edit className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-12 mt-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Period</span>
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 hidden" /> {/* Placeholder icon to align with text if needed, skipped per design just plain text for now */}
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Created By</span>
            <span className="text-sm font-semibold">Admin Production</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Total Target</span>
            <span className="text-sm font-semibold">{totalTarget.toLocaleString('id-ID')} units</span>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        
        {/* Alerts */}
        {plan.checkResultStale && (
          <AlertSummaryCard
            title="PERHATIAN"
            value="Simulasi Ketersediaan Basi"
            variant="warning"
            className="mb-0"
          />
        )}
        {plan.hasPendingLossReplacement && (
          <AlertSummaryCard
            title="WARNING"
            value={plan.warning || "Ada pending loss replacement"}
            variant="warning"
            className="mb-0"
          />
        )}
        {hasPlanDiscount && (
          <AlertSummaryCard
            title="SARAN"
            value="Diskon ditambahkan"
            variant="success"
            icon={<Lightbulb className="w-5 h-5" />}
            action={
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(true)}>
                <Link className="w-4 h-4 mr-2" /> Lihat Diskon
              </Button>
            }
          />
        )}

        <div>
          <h3 className="font-semibold text-lg mb-4">Production Items</h3>
          
          <div className="flex flex-col gap-3">
            {plan.menus?.map((menu, idx) => {
              const disc = menu.discount || {};
              const menuHasDiscount = disc.discountPercentage > 0;
              const summary = {
                quantity: menu.quantityPlanned,
                originalPrice: menu.currentPrice || 25000,
                estimatedRevenue: (menu.quantityPlanned * (menu.currentPrice || 25000)),
                estimatedProfit: (menu.quantityPlanned * (menu.currentPrice || 25000)) / 2, // Mock 50% profit
                ...(menuHasDiscount ? {
                  discountPercent: disc.discountPercentage,
                  newPrice: disc.discountedPrice,
                  newProfit: (menu.quantityPlanned * disc.discountedPrice) / 2 // Mock new profit
                } : {})
              };

              // Determine if ingredients have shortage for this menu
              const hasShortage = mappedIngredients.some(ing => ing.shortage !== '-');
              const badges = hasShortage ? ['kurang bahan'] : ['cukup'];

              return (
                <PlanMenuAccordion
                  key={menu.menuId}
                  variant="active"
                  menuName={menu.name}
                  menuInitials={getInitials(menu.name)}
                  menuSubtitle="Beverage"
                  targetQty={menu.quantityPlanned}
                  badges={badges}
                  summary={summary}
                  ingredients={idx === 0 ? mappedIngredients : []} // Show ingredients only on first item for prototype
                  defaultOpen={idx === 0}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer Actions ────────────────────────────────────── */}
      <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-end gap-3">
        {isDraft && (
          <>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleReject} disabled={isProcessing}>
              Reject
            </Button>
            <Button 
              className="bg-[#4E6A3E] hover:bg-[#4E6A3E]/90 text-white" 
              onClick={handleApprove} 
              disabled={isProcessing || !plan.readyToApprove || plan.checkResultStale}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept
            </Button>
          </>
        )}

        {isActive && (
          <>
            <Button variant="outline" onClick={() => toast.info('Redirecting to active plan...')}>
              <Eye className="w-4 h-4 mr-2" /> View Plan
            </Button>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setConfirmStopOpen(true)}>
              <StopCircle className="w-4 h-4 mr-2" /> Stop Plan
            </Button>
          </>
        )}
      </div>

      {/* Stop Confirm Dialog */}
      <Dialog open={confirmStopOpen} onOpenChange={setConfirmStopOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop Production Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop this plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStopOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleStop} disabled={isProcessing}>Confirm Stop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DiscountModal 
        isOpen={isDiscountModalOpen} 
        onClose={() => setIsDiscountModalOpen(false)} 
        plan={plan}
        editPromo={editPromo}
        onApply={() => fetchDetail()}
      />
      
      <DiscountDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        promo={promoGroup}
        onEdit={handleEditDiscount}
        onDelete={handleDeleteDiscount}
      />
    </div>
  );
}
