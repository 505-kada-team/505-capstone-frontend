import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Printer, Edit, CheckCircle, StopCircle, Eye } from 'lucide-react';
import { getPlanDetail, cancelPlan, approvePlan, stopPlan } from '@/services/api';

import StatusBadge from '@/components/shared/StatusBadge';
import AlertSummaryCard from '@/components/shared/AlertSummaryCard';
import PlanMenuAccordion from '@/components/shared/PlanMenuAccordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

  useEffect(() => {
    if (!planId) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await getPlanDetail(planId);
        if (res.data?.success) {
          setPlan(res.data.data);
        }
      } catch {
        toast.error('Failed to load plan detail');
      } finally {
        setIsLoading(false);
      }
    };
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
    let currentAvailable = 0;
    let isUnsafe = false;
    
    if (plan.status === 'draft') {
      isUnsafe = ing.hasUnsafeBatch;
      currentAvailable = ing.availableQuantity;
    } else {
      // For active plan, sum quantityUsed from batches
      currentAvailable = ing.batches?.reduce((sum, b) => sum + (b.quantityUsed || 0), 0) || 0;
      isUnsafe = ing.batches?.some(b => b.batchSafetyStatus === 'unsafe') || false;
    }

    return {
      name: ing.nameInventory,
      needed: `${ing.quantityNeeded} units`, // simplified unit
      available: `${currentAvailable} units`,
      status: isUnsafe ? 'unsafe' : 'safe'
    };
  });

  const badgeVariant = deriveBadgeVariant(plan);
  const isDraft = plan.status === 'draft';
  const isActive = plan.status === 'active';

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
            <span className="text-sm font-semibold">
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Created By</span>
            <span className="text-sm font-semibold">Kitchen Admin</span>
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

        <div>
          <h3 className="font-semibold text-lg mb-4">Production Items</h3>
          
          <div className="flex flex-col gap-3">
            {plan.menus?.map((menu, idx) => (
              <PlanMenuAccordion
                key={menu.menuId}
                variant="active"
                menuName={menu.name}
                menuInitials={getInitials(menu.name)}
                menuSubtitle="Beverage • 250ml" // hardcoded category for visual prototype
                targetQty={menu.quantityPlanned}
                ingredients={idx === 0 ? mappedIngredients : []} // Show ingredients only on first item for prototype
                defaultOpen={idx === 0}
              />
            ))}
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
    </div>
  );
}
