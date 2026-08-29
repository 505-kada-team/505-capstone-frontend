import { TrendingUp, TrendingDown, Cpu } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import { Card } from '@/components/ui/card';

export default function Forecasting({ inputs, recommendation }) {
  return (
    <section className="bg-primary py-20">
      <div className="mx-auto max-w-content px-8">
        <SectionHeading
          tone="inverted"
          eyebrow="Forecasting"
          title="Don't Just Review Yesterday. Plan Tomorrow."
          description="Historical sales, menu performance, current inventory, and waste history all feed a single forecasting engine."
        />

        <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_auto_1.2fr]">
          <div className="space-y-3">
            {inputs.map((input) => {
              const Icon = input.icon;
              return (
                <div key={input.label} className="flex items-center gap-3 rounded-md border border-background/15 bg-background/5 px-4 py-3">
                  <Icon size={16} strokeWidth={2} className="text-background/70" />
                  <span className="font-body text-sm text-background/90">{input.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-accent text-primary-foreground lg:h-28 lg:w-28">
            <Cpu size={32} strokeWidth={1.75} />
          </div>

          <Card className="border-background/15 bg-background p-6">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-foreground/50">Next-Plan Recommendation</p>
            <ul className="mt-3 divide-y divide-border">
              {recommendation.items.map((item) => (
                <li key={item.name} className="flex items-center justify-between py-2.5">
                  <span className="font-body text-sm text-foreground">{item.name}</span>
                  <span className="font-mono text-sm text-foreground/70">{item.quantity}</span>
                  <span className={`flex items-center gap-1 font-mono text-sm font-medium ${item.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                    {item.trend === 'up' ? <TrendingUp size={14} strokeWidth={2} /> : <TrendingDown size={14} strokeWidth={2} />}
                    {item.change}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-body text-sm text-foreground/60">Expected Revenue</span>
              <span className="font-mono text-base font-semibold text-foreground">{recommendation.expectedRevenue}</span>
            </div>

            <div className="mt-3">
              <p className="font-body text-xs font-medium uppercase tracking-wide text-foreground/50">Suggested Restocking</p>
              <ul className="mt-2 space-y-1">
                {recommendation.suggestedRestock.map((row) => (
                  <li key={row.item} className="flex items-center justify-between font-body text-sm">
                    <span className="text-foreground">{row.item}</span>
                    <span className="font-mono text-foreground/70">{row.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
