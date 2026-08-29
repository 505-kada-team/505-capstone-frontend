import { TrendingUp, AlertTriangle, Trophy, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Decorative product-dashboard preview shown beside the hero copy.
 * This is illustrative marketing artwork, not the real app Dashboard page —
 * the real one lives in pages/admin and uses Recharts per CONVENTIONS.md.
 */

export default function HeroDashboardMockup({ stats, lowStock, topMenu, insight }) {
  return (
    <Card className="w-full max-w-md space-y-4 p-5 shadow-[0_24px_60px_-24px_rgba(45,36,30,0.35)]">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
      </div>

      <div className="grid grid-cols-[1.08fr_0.92fr] gap-3">
        <div className="rounded-lg bg-secondary/40 p-3">
          <p className="text-xs text-muted-foreground">{stats.totalRevenue.label}</p>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="whitespace-nowrap font-mono text-base font-semibold text-foreground sm:text-lg">{stats.totalRevenue.value}</span>

            <span className="flex shrink-0 items-center gap-0.5 font-mono text-xs font-medium text-success">
              <TrendingUp size={12} strokeWidth={2} />
              {stats.totalRevenue.change}
            </span>
          </div>
        </div>
        <div className="rounded-md bg-secondary/40 p-3">
          <p className="font-body text-xs text-foreground/60">{stats.netRevenue.label}</p>
          <p className="mt-1 font-mono text-lg font-semibold text-foreground">{stats.netRevenue.value}</p>
        </div>
      </div>

      <div className="rounded-md bg-secondary/40 p-3">
        <p className="mb-2 font-body text-xs text-foreground/60">Sales Trend</p>
        <svg viewBox="0 0 200 56" className="h-14 w-full" preserveAspectRatio="none">
          <polyline points="0,44 30,38 60,40 90,26 120,30 150,14 180,18 200,6" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border p-3">
          <div className="mb-2 flex items-center gap-1.5 font-body text-xs font-medium text-foreground/60">
            <AlertTriangle size={13} strokeWidth={2} className="text-warning" />
            Low-Stock Warning
          </div>
          <ul className="space-y-1">
            {lowStock.map((row) => (
              <li key={row.name} className="flex items-center justify-between font-body text-xs text-foreground">
                <span>{row.name}</span>
                <span className="font-mono text-foreground/50">{row.detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-border p-3">
          <div className="mb-2 flex items-center gap-1.5 font-body text-xs font-medium text-foreground/60">
            <Trophy size={13} strokeWidth={2} className="text-accent" />
            Top Menu
          </div>
          <ul className="space-y-1">
            {topMenu.map((row) => (
              <li key={row.name} className="flex items-center justify-between font-body text-xs text-foreground">
                <span>
                  {row.rank}. {row.name}
                </span>
                <span className="font-mono text-foreground/50">{row.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-md border-l-4 border-accent bg-accent/5 p-3">
        <div className="mb-1 flex items-center gap-1.5 font-body text-xs font-semibold text-accent">
          <Sparkles size={13} strokeWidth={2} />
          AI Insight
        </div>
        <p className="font-body text-xs leading-relaxed text-foreground/80">{insight}</p>
      </div>
    </Card>
  );
}
