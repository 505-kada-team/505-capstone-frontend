import { CheckCircle2, XCircle } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';

export default function ProductionPlanning({ simulation }) {
  const hasShortfall = simulation.requiredIngredients.some((i) => !i.sufficient);

  return (
    <section id="planning" className="mx-auto max-w-content px-8 py-20">
      <SectionHeading
        eyebrow="Production"
        title="Plan Before You Produce."
        description="Pick a menu and quantity — the system checks required ingredients against live inventory before you approve anything."
      />

      <Card className="mx-auto mt-12 max-w-2xl p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="font-body text-xs text-foreground/60">Draft simulation</p>
            <p className="font-display text-base font-semibold text-foreground">
              {simulation.menu} — {simulation.quantity} portions
            </p>
          </div>
          {hasShortfall && (
            <span className="rounded-md bg-warning/10 px-2 py-1 font-body text-xs font-medium text-warning">
              Needs restock
            </span>
          )}
        </div>

        <ul className="divide-y divide-border py-2">
          {simulation.requiredIngredients.map((ing) => (
            <li key={ing.name} className="flex items-center justify-between py-3 font-body text-sm">
              <span className="flex items-center gap-2 text-foreground">
                {ing.sufficient ? (
                  <CheckCircle2 size={16} strokeWidth={2} className="text-success" />
                ) : (
                  <XCircle size={16} strokeWidth={2} className="text-destructive" />
                )}
                {ing.name}
              </span>
              <span className="font-mono text-foreground/60">
                {ing.required} <span className="text-foreground/30">/</span> {ing.available}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <p className="font-body text-xs text-foreground/60">Estimated Revenue</p>
            <p className="font-mono text-lg font-semibold text-foreground">{simulation.estimatedRevenue}</p>
          </div>
          <div>
            <p className="font-body text-xs text-foreground/60">Expected Margin</p>
            <p className="font-mono text-lg font-semibold text-success">{simulation.expectedMargin}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button className="flex-1" disabled={hasShortfall}>Approve Plan</Button>
          <Button variant="outline" className="flex-1">Adjust Quantity</Button>
        </div>
        {hasShortfall && (
          <p className="mt-2 font-body text-xs text-foreground/50">
            Approval is disabled until Fresh Milk stock covers the required amount.
          </p>
        )}
      </Card>
    </section>
  );
}
