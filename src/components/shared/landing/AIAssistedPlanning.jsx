import { Sparkles } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AIAssistedPlanning({ recommendation }) {
  return (
    <section className="mx-auto max-w-content px-8 py-20">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="AI Planning" title="AI That Recommends. You Decide." />
          <p className="mt-6 font-body text-sm leading-relaxed text-foreground/70">
            AI generates an explainable draft production plan based on structured operational data — inventory, recipes, and forecasted demand. It never activates a plan automatically. The business owner reviews, edits, and approves every
            recommendation.
          </p>
          <p className="mt-6 font-display text-lg font-semibold text-foreground">AI assists the decision. Humans remain in control.</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 font-body text-sm font-semibold text-accent">
            <Sparkles size={16} strokeWidth={2} />
            AI Recommendation
          </div>

          <p className="mt-4 font-display text-base font-semibold text-foreground">
            {recommendation.menu} — {recommendation.quantity}
          </p>

          <p className="mt-3 font-body text-sm leading-relaxed text-foreground/70">{recommendation.reasoning}</p>

          <div className="mt-6 flex gap-3">
            <Button size="sm">Review Draft</Button>
            <Button size="sm" variant="outline">
              Edit Recommendation
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
