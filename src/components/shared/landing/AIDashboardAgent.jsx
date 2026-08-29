import { Bot } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AIDashboardAgent({ insight }) {
  return (
    <section className="mx-auto max-w-content px-8 py-20">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Card className="order-2 p-6 lg:order-1">
          <div className="flex items-center gap-2 font-body text-sm font-semibold text-foreground">
            <Bot size={16} strokeWidth={2} className="text-accent" />
            AI Insight
          </div>
          <p className="mt-3 font-display text-base font-semibold leading-snug text-foreground">{insight.title}</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-foreground/70">{insight.body}</p>
          <p className="mt-3 font-body text-sm font-medium text-warning">{insight.action}</p>
          <Button size="sm" className="mt-5">
            Take Action
          </Button>
        </Card>

        <div className="order-1 lg:order-2">
          <SectionHeading align="left" eyebrow="AI Dashboard Agent" title="Your Operations, Explained." />
          <p className="mt-6 font-body text-sm leading-relaxed text-foreground/70">
            Instead of only presenting charts, the dashboard interprets current business data, identifies potential problems, and recommends a concrete next action — before the problem shows up in next week&apos;s report.
          </p>
        </div>
      </div>
    </section>
  );
}
