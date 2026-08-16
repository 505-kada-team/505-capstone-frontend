import { CalendarDays } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";

/**
 * PlanListCard.jsx — components/shared/
 *
 * Card item di list "Plan History" — halaman ProductionPlanPage.
 * Menampilkan:
 *   - Badge status plan mentah (draft / active / completed / stopped / cancelled)
 *   - Badge inventory khusus draft (In Stock / Low Stock)
 *
 * Props:
 *   plan       : { _id, name, status, startDate, endDate,
 *                  hasUnsafeBatch, readyToApprove,
 *                  hasActiveDiscount, hasPendingLossReplacement }
 *   isSelected : boolean — highlighted state (border oranye)
 *   onClick    : (id: string) => void
 */

function derivePlanStatusVariant(plan) {
  switch (plan.status) {
    case "draft":
      return "draft";
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "stopped":
      return "stopped";
    case "cancelled":
      return "cancelled";
    default:
      return "deleted"; // fallback
  }
}

function deriveInventoryVariant(plan) {
  if (plan.status !== "draft" && plan.status !== "cancelled") return null;

  return plan.readyToApprove ? "in-stock" : "low stock";
}

function formatDateRange(startDate, endDate) {
  if (!startDate) return "—";
  const fmt = (d) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")} ${
      [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][date.getMonth()]
    } ${date.getFullYear()}`;
  };
  return endDate ? `${fmt(startDate)} – ${fmt(endDate)}` : fmt(startDate);
}

export default function PlanListCard({ plan, isSelected = false, onClick }) {
  const planStatusVariant = derivePlanStatusVariant(plan);
  const inventoryVariant = deriveInventoryVariant(plan);

  return (
    <button
      type="button"
      onClick={() => onClick?.(plan._id)}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all duration-150",
        "bg-card hover:bg-accent/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]/40",
        isSelected
          ? "border-[#F97316] bg-[#F97316]/5 shadow-sm"
          : "border-border hover:border-[#F97316]/40",
      )}
    >
      {/* Row 1: Name + Badges */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-sm font-semibold leading-snug",
            isSelected ? "text-foreground" : "text-foreground/90",
          )}
        >
          {plan.name}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Badge 1: status plan */}
          <StatusBadge variant={planStatusVariant} />

          {/* Badge 2: inventory status khusus draft */}
          {inventoryVariant && <StatusBadge variant={inventoryVariant} />}
        </div>
      </div>

      {/* Row 2: Date range */}
      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
        <span>{formatDateRange(plan.startDate, plan.endDate)}</span>
      </div>
    </button>
  );
}
