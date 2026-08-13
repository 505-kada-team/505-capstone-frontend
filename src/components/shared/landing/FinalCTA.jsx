import {Button} from '@/components/ui/Button';

export default function FinalCTA() {
  return (
    <section className="bg-primary py-24 text-primary-foreground">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Smarter F&B Operations
        </p>

        <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          One System. One Operational Cycle. Better Decisions.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-primary-foreground/70">
          Connect inventory, production, sales, and intelligence in one continuous workflow.
        </p>

        <div className="mt-8">
          <Button variant="secondary" size="lg">
            Explore the Platform
          </Button>
        </div>
      </div>
    </section>
  );
}
