import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, PlusCircle, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared/PageHeader';
import PlanListCard from '@/components/shared/PlanListCard';
import PlanDetailPane from '@/pages/admin/production-plan/components/PlanDetailPane';
import { Button } from '@/components/ui/button';
import { getPlanList } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Pagination from '@/components/shared/Pagination';
import { usePagination } from '@/hooks/usePagination';

// ─── Empty state for the right pane when no plan is selected ─────────────────
function RightPaneEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground select-none py-24">
      <ClipboardList className="w-10 h-10 text-muted-foreground/40" strokeWidth={1.5} />
      <p className="text-sm">Select a plan from the list to view details</p>
    </div>
  );
}

// ─── Loading skeleton for the list pane ──────────────────────────────────────
function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-muted/30 h-[68px]" />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function PlanHistoryView({ onNavigateToCreate }) {

  const [plans, setPlans] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date_newest');

  const filteredAndSortedPlans = useMemo(() => {
    let result = [...plans];
    
    // Apply filter
    if (filterStatus !== 'all') {
      result = result.filter(plan => plan.status === filterStatus);
    }
    
    // Apply sort
    if (sortBy === 'date_newest') {
      return result.sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));
    }
    if (sortBy === 'date_oldest') {
      return result.sort((a, b) => new Date(a.createdAt || a.startDate || 0) - new Date(b.createdAt || b.startDate || 0));
    }
    return result;
  }, [plans, filterStatus, sortBy]);

  const { currentPage, totalPages, paginatedItems: paginatedPlans, setPage, resetPage } = usePagination(
    filteredAndSortedPlans,
    5
  );

  useEffect(() => {
    resetPage();
  }, [filterStatus, sortBy, plans, resetPage]);

  // ── Fetch plan list ──────────────────────────────────────────────────────
  const fetchPlans = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingList(true);
    try {
      const res = await getPlanList();
      if (res.data?.success) {
        setPlans(res.data.data ?? []);
      }
    } catch {
      toast.error('Failed to load plan history');
    } finally {
      if (showLoading) setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    // Use timeout to push the initial fetch to the next tick, avoiding synchronous setState
    const timer = setTimeout(() => {
      fetchPlans();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPlans]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectPlan = (id) => {
    setSelectedPlanId(id);
    // Detail pane will be built in the next step
  };

  const handleReload = () => {
    fetchPlans();
  };

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <PageHeader
        title="Production Planning"
        subtitle="Review and manage past production plans."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleReload}
              disabled={isLoadingList}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
              Reload
            </Button>
            <Button
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2 font-medium"
              onClick={onNavigateToCreate}
            >
              <PlusCircle className="w-4 h-4" />
              Create Plan
            </Button>
          </div>
        }
      />

      {/* ── Split Pane ────────────────────────────────────────────────────── */}
      <div className="flex gap-6 flex-1 min-h-0">

        {/* ── Left: Plan History List ───────────────────────────────────── */}
        <aside className="w-86 shrink-0 flex flex-col gap-3">
          {/* List header */}
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold font-heading">Plan History</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[110px] h-7 gap-1 text-muted-foreground text-xs font-normal">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[100px] h-7 gap-1 text-muted-foreground text-xs font-normal">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_newest">Newest</SelectItem>
                  <SelectItem value="date_oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List content */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
            {isLoadingList ? (
              <ListSkeleton />
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <ClipboardList className="w-8 h-8 text-muted-foreground/40" strokeWidth={1.5} />
                <p className="text-xs text-center">No plans found</p>
              </div>
            ) : filteredAndSortedPlans.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <ClipboardList className="w-8 h-8 text-muted-foreground/40" strokeWidth={1.5} />
                <p className="text-xs text-center">No plans found for selected status</p>
              </div>
            ) : (
              paginatedPlans.map((plan) => (
                <PlanListCard
                  key={plan._id}
                  plan={plan}
                  isSelected={plan._id === selectedPlanId}
                  onClick={handleSelectPlan}
                />
              ))
            )}
          </div>

          {paginatedPlans.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPage={totalPages}
              totalData={filteredAndSortedPlans.length}
              limit={4}
              onPageChange={setPage}
            />
          )}
        </aside>


        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="w-px bg-border shrink-0 self-stretch" />

        {/* ── Right: Plan Detail ────────────────────────────────────────── */}
        <section className="flex-1 min-w-0 h-full">
          {/* Detail pane */}
          {!selectedPlanId ? (
            <RightPaneEmpty />
          ) : (
            <PlanDetailPane planId={selectedPlanId} onRefreshList={fetchPlans} />
          )}
        </section>
      </div>
    </div>
  );
}
