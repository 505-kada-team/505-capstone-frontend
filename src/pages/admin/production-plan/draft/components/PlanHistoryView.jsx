import { useState } from 'react';
import { RefreshCw, PlusCircle, Filter, ClipboardList } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import PlanListCard from '@/components/shared/PlanListCard';
import PlanDetailPane from '@/pages/admin/production-plan/components/PlanDetailPane';
import { Button } from '@/components/ui/button';
import { usePlanList } from '@/hooks/plan/usePlanList';

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
  const { plans, isLoading: isLoadingList, refetch } = usePlanList();
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectPlan = (id) => {
    setSelectedPlanId(id);
  };

  const handleReload = () => refetch();

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
        <aside className="w-72 shrink-0 flex flex-col gap-3">
          {/* List header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-heading">Plan History</h2>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs h-7 px-2">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </Button>
          </div>

          {/* List content */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {isLoadingList ? (
              <ListSkeleton />
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <ClipboardList className="w-8 h-8 text-muted-foreground/40" strokeWidth={1.5} />
                <p className="text-xs text-center">No plans found</p>
              </div>
            ) : (
              plans.map((plan) => (
                <PlanListCard
                  key={plan._id}
                  plan={plan}
                  isSelected={plan._id === selectedPlanId}
                  onClick={handleSelectPlan}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="w-px bg-border shrink-0 self-stretch" />

        {/* ── Right: Plan Detail ────────────────────────────────────────── */}
        <section className="flex-1 min-w-0 h-full">
          {/* Detail pane */}
          {!selectedPlanId ? (
            <RightPaneEmpty />
          ) : (
            <PlanDetailPane planId={selectedPlanId} onRefreshList={refetch} />
          )}
        </section>
      </div>
    </div>
  );
}
