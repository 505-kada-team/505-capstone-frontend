import SectionHeading from '@/components/shared/SectionHeading';
import StepFlow from '@/components/shared/StepFlow';

export default function POSIntegration({ steps, statement }) {
  return (
    <section id="pos" className="mx-auto max-w-content px-8 py-20">
      <SectionHeading eyebrow="POS" title="Every Sale Updates the Bigger Picture." />

      <div className="mt-14 overflow-x-auto">
        <div className="min-w-[760px]">
          <StepFlow steps={steps} />
        </div>
      </div>

      <p className="mx-auto mt-14 max-w-xl text-center font-display text-xl font-semibold leading-snug text-foreground">
        {statement}
      </p>
    </section>
  );
}
