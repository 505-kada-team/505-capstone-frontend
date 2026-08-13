import SectionHeading from '@/components/shared/SectionHeading';
import IconTile from '@/components/shared/IconTile';
import {Card }from '@/components/ui/Card';

export default function ProblemSection({ problems }) {
  return (
    <section id="solutions" className="mx-auto max-w-content px-8 py-20 bg-muted/20">
      <SectionHeading title="Running an F&B Business Shouldn't Be a Guessing Game." />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {problems.map((problem) => (
          <Card key={problem.title} className="p-6">
            <IconTile icon={problem.icon} tone="warning" />
            <h3 className="mt-4 font-display text-base font-semibold text-foreground">{problem.title}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-foreground/70">{problem.description}</p>
          </Card>
        ))}
      </div>

      <p className="mx-auto mt-14 max-w-2xl text-center font-display text-xl font-semibold leading-snug text-foreground">
        The problem isn&apos;t lack of data. It&apos;s that inventory, production,
        and sales data rarely work together.
      </p>
    </section>
  );
}
