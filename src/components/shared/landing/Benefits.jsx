import SectionHeading from '@/components/shared/SectionHeading';
import IconTile from '@/components/shared/IconTile';
import {Card} from '@/components/ui/Card';

export default function Benefits({ benefits }) {
  return (
    <section className="mx-auto max-w-content px-8 py-20">
      <SectionHeading title="Benefits" />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className="p-6">
            <IconTile icon={benefit.icon} tone="accent" />
            <h3 className="mt-4 font-display text-base font-semibold text-foreground">{benefit.title}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-foreground/70">{benefit.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
