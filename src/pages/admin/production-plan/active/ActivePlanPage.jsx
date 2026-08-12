import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Plus, TriangleAlert, ChevronLeft, ChevronRight, StopCircle, Eye } from 'lucide-react';

import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import PlanReportBanner from '@/components/shared/admin/PlanReportBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import SearchInput from '@/components/shared/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActivePlanOverview } from '@/hooks/plan/usePlanOverview';
import { useSortable } from '@/hooks/useSortable';
import PlanDetailPane from '@/pages/admin/production-plan/components/PlanDetailPane';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, '0')} ${
    ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()]
  } ${date.getFullYear()}`;
}

const formatRp = (num) => num != null ? `Rp ${num.toLocaleString('id-ID')}` : '-';

// Komponen Progress Bar kustom
function ProgressBar({ current, max, colorClass = "bg-[#4E6A3E]" }) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-mono whitespace-nowrap">{current} / {max}</span>
    </div>
  );
}

export default function ActivePlanPage() {
  const navigate = useNavigate();
  const {
    plans,
    activePlanDetail,
    isLoading,
    isStopping,
    stopActivePlan,
    refetch,
  } = useActivePlanOverview();

  const [searchHistory, setSearchHistory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { sortBy, setSortBy, sortData } = useSortable('date_newest');
  const [isStopDialogOpen, setIsStopDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const filteredPlans = sortData(plans.filter(plan => {
    if (plan.status === 'active') return false;
    const matchSearch = plan.name?.toLowerCase().includes(searchHistory.toLowerCase());
    const matchStatus = filterStatus === 'all' || plan.status === filterStatus;
    return matchSearch && matchStatus;
  }), 'date_newest');

  const handleStopPlan = async () => {
    const result = await stopActivePlan({ reason: 'Dihentikan manual oleh admin', stoppedBy: 'Admin Dapur' });
    if (result?.ok) {
      setIsStopDialogOpen(false);
    }
  };

  const hasActive = !!activePlanDetail;

  return (
    <div className="flex flex-col gap-6">
      
      {/* CUSTOM PAGE HEADER to match mockup exactly */}
      <div className="flex flex-col gap-3 mb-2">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold font-heading">Active Plan</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`w-8 h-8 rounded-md ${hasActive && (activePlanDetail.hasPendingLossReplacement || activePlanDetail.checkResultStale) ? 'border-[#C4441F] text-[#C4441F] bg-[#C4441F]/10 hover:bg-[#C4441F]/20' : 'text-muted-foreground bg-white'}`} 
                    disabled={!hasActive || !(activePlanDetail.hasPendingLossReplacement || activePlanDetail.checkResultStale)}
                  >
                    <TriangleAlert className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                {hasActive && activePlanDetail.hasPendingLossReplacement && (
                  <PopoverContent className="w-[320px] p-3" align="end">
                    <PlanReportBanner 
                      pendingCount={activePlanDetail.pendingLossReplacementCount || 1} 
                      planId={activePlanDetail._id} 
                    />
                  </PopoverContent>
                )}
              </Popover>
              {hasActive && (activePlanDetail.hasPendingLossReplacement || activePlanDetail.checkResultStale) && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white pointer-events-none" />
              )}
            </div>
            
            {hasActive ? (
              <Popover>
                {/* PopoverPrimitive.Trigger inside uses cloneElement so child shouldn't be another custom component without forwardRef, button is safe */}
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white border-green-400 text-green-700 hover:bg-green-50 transition-colors cursor-pointer outline-none">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-md bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-md h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-xs font-medium">Active</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <Button 
                    variant="outline" 
                    className="text-destructive border-destructive hover:bg-destructive/10 w-full justify-start"
                    onClick={() => setIsStopDialogOpen(true)}
                  >
                    <StopCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Stop Plan</span>
                  </Button>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white border-border text-muted-foreground">
                <div className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground"></span>
                </div>
                <span className="text-xs font-medium">None</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <span>
            Plan Name : <span className="font-normal text-muted-foreground">{hasActive ? activePlanDetail.name : '-'}</span>
          </span>
          <span>
            Plan Period: <span className="font-normal text-muted-foreground">
              {hasActive ? `${formatDate(activePlanDetail.startDate)} - ${formatDate(activePlanDetail.endDate)}` : '-'}
            </span>
          </span>
        </div>
      </div>

      {/* TOP SECTION: ACTIVE PLAN TRACKING */}
      <Card className="w-full shadow-sm">
        <CardContent className={hasActive ? "p-0" : "p-6"}>
          {isLoading ? (
            <div className="flex justify-center py-20 text-muted-foreground">Loading data...</div>
          ) : !hasActive ? (
            // EMPTY STATE
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No active plan!</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                There is no active production plan at the moment. Create a new plan to start production tracking.
              </p>
              <Button 
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
                onClick={() => navigate('/admin/production-plan/draft')}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Plan
              </Button>
            </div>
          ) : (
            // FILLED STATE
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 font-medium px-4 w-[25%]">Menu Name</th>
                      <th className="py-3 font-medium px-4 w-[35%]">Sold / Quantity</th>
                      <th className="py-3 font-medium px-4 w-[25%]">Profit</th>
                      <th className="py-3 font-medium px-4 w-[15%] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {activePlanDetail.menus?.map((menu) => {
                      const sold = menu.soldQuantity || 0;
                      const planned = menu.quantityPlanned || 0;
                      // Calculate effective price (discounted or current)
                      const effectivePrice = menu.discount?.discountPercentage > 0 
                        ? menu.discount.discountedPrice 
                        : (menu.currentPrice || 25000);
                      
                      const profit = sold * effectivePrice;
                      
                      // Assign colors based on ratio to make it interesting
                      const ratio = planned > 0 ? sold / planned : 0;
                      let colorClass = "bg-[#4E6A3E]"; // Green
                      if (ratio > 0.8) colorClass = "bg-amber-600"; // Almost sold out
                      if (ratio >= 1) colorClass = "bg-[#C4441F]"; // Sold out

                      return (
                        <tr key={menu.menuId} className="hover:bg-muted/30">
                          <td className="py-4 px-4 font-medium">{menu.name}</td>
                          <td className="py-4 px-4">
                            <ProgressBar current={sold} max={planned} colorClass={colorClass} />
                          </td>
                          <td className="py-4 px-4 font-mono">{formatRp(profit)}</td>
                          <td className="py-4 px-4 text-center">
                            <button 
                              className="text-[#F97316] font-medium text-sm hover:underline"
                              onClick={() => setSelectedPlanId(activePlanDetail._id)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground px-4">
                <span>Showing {activePlanDetail.menus?.length} of {activePlanDetail.menus?.length} items</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOTTOM SECTION: RIWAYAT PLAN */}
      <div className="flex flex-col mt-4">
        <h2 className="text-xl font-bold font-heading mb-4 px-1">Plan History</h2>

        <div className="flex items-center justify-between gap-2 mb-2">
          <SearchInput
            id="plan-history-search"
            placeholder="Search plan by name..."
            value={searchHistory}
            onChange={setSearchHistory}
            className="w-[400px]"
          />
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] h-9 text-muted-foreground font-normal">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] gap-2 h-9 text-muted-foreground font-normal">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_newest">Terbaru</SelectItem>
                <SelectItem value="date_oldest">Terlama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="w-full shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/40 border-b border-border">
                  <tr>
                    <th className="py-3 px-6 font-medium">Plan Name</th>
                    <th className="py-3 px-6 font-medium">Date</th>
                    <th className="py-3 px-6 font-medium text-center">Status</th>
                    <th className="py-3 px-6 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    <tr><td colSpan="4" className="py-10 text-center text-muted-foreground">Loading data...</td></tr>
                  ) : filteredPlans.length === 0 ? (
                    <tr><td colSpan="4" className="py-10 text-center text-muted-foreground">No plan history</td></tr>
                  ) : (
                    filteredPlans.map((p) => {
                      // Status mapping to match UI
                      let displayStatus = p.status;
                      if (p.status === 'completed') displayStatus = 'Executed';
                      if (p.status === 'cancelled' || p.status === 'stopped') displayStatus = 'Terminated';

                      return (
                        <tr key={p._id} className="hover:bg-muted/30">
                          <td className="py-4 px-6 font-medium">{p.name}</td>
                          <td className="py-4 px-6 font-mono text-xs">
                            {formatDate(p.startDate)} - {formatDate(p.endDate)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <StatusBadge variant={displayStatus.toLowerCase()} />
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button 
                              className="text-[#F97316] font-medium hover:underline text-sm"
                              onClick={() => setSelectedPlanId(p._id)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasActive && (
        <ConfirmDialog
          open={isStopDialogOpen}
          onClose={() => setIsStopDialogOpen(false)}
          onConfirm={handleStopPlan}
          title="Stop this plan?"
          description="The active plan will be stopped permanently. No more production can be added to this plan."
          confirmLabel="Stop Plan"
          cancelLabel="Cancel"
          loading={isStopping}
          variant="destructive"
        />
      )}

      {/* Plan Detail Pane (shown when Detail is clicked) */}
      {selectedPlanId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <PlanDetailPane
              planId={selectedPlanId}
              onRefreshList={refetch}
            />
            <div className="p-3 border-t flex justify-end">
              <Button variant="outline" onClick={() => setSelectedPlanId(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}