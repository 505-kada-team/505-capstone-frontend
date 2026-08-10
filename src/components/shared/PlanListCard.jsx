import { CalendarDays } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';

/**
 * PlanListCard.jsx — components/shared/
 *
 * Card item di list "Plan History" — halaman ProductionPlanPage.
 * Men-derive badge status dari kombinasi field API (bukan hanya plan.status),
 * sesuai API contract 505_Database Schema_producitonplan.md.
 *
 * Props:
 *   plan       : { _id, name, status, startDate, endDate,
 *                  hasUnsafeBatch, readyToApprove,
 *                  hasActiveDiscount, hasPendingLossReplacement }
 *   isSelected : boolean — highlighted state (border oranye)
 *   onClick    : (id: string) => void
 */

/**
 * Derive badge variant dari kombinasi field plan.
 * Status dari API: draft | active | completed | stopped | cancelled
 */
function derivePlanBadgeVariant(plan) {
  if (plan.status === 'active') return 'active';
  if (plan.status === 'completed') return 'completed';
  if (plan.status === 'stopped' || plan.status === 'cancelled') return 'stopped';
  // status === 'draft':
  if (!plan.readyToApprove || plan.hasUnsafeBatch) return 'low stock';
  return 'in-stock';
}

function formatDateRange(startDate, endDate) {
  if (!startDate) return '—';
  const fmt = (d) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, '0')} ${
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
    } ${date.getFullYear()}`;
  };
  return endDate ? `${fmt(startDate)} – ${fmt(endDate)}` : fmt(startDate);
}

export default function PlanListCard({ plan, isSelected = false, onClick }) {
  const badgeVariant = derivePlanBadgeVariant(plan);

  return (
    <button
      type="button"
      onClick={() => onClick?.(plan._id)}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-all duration-150',
        'bg-card hover:bg-accent/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/40',
        isSelected
          ? 'border-[#F97316] bg-[#F97316]/5 shadow-sm'
          : 'border-border hover:border-[#F97316]/40',
      )}
    >
      {/* Row 1: Name + Badge */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn(
          'text-sm font-semibold leading-snug',
          isSelected ? 'text-foreground' : 'text-foreground/90'
        )}>
          {plan.name}
        </span>
        <StatusBadge variant={badgeVariant} />
      </div>

      {/* Row 2: Date range */}
      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
        <span>{formatDateRange(plan.startDate, plan.endDate)}</span>
      </div>
    </button>
  );
}
