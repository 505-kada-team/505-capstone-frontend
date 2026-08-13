import SectionHeading from '@/components/shared/SectionHeading';
import StepFlow from '@/components/shared/StepFlow';

export default function ConnectedOperations({ steps }) {
  return (
    <section id="connected-operations" className="mx-auto max-w-content px-8 py-20">
      <SectionHeading
        eyebrow="How it works"
        title="Connected Operations"
        description="Inventory and POS are not separate modules but parts of one continuous operational feedback loop."
      />

      <div className="mt-14 overflow-x-auto">
        <div className="min-w-[720px]">
          <StepFlow steps={steps} />
        </div>
      </div>
    </section>
  );
}
