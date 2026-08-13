import { Button } from '@/components/ui/button';
import HeroDashboardMockup from './HeroDashboardMockup';
import RevealOnScroll from './RevealOnScroll';

export default function Hero({ stats, lowStock, topMenu, insight }) {
  return (
    <section id="top" className="border-b border-border">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-16 pt-8 lg:grid-cols-2 lg:px-12 lg:pb-20 lg:pt-10">
        <RevealOnScroll className="self-start">
          <div className="max-w-xl pt-6 lg:pl-6 lg:pt-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Intelligent F&amp;B Operations
            </p>

            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-foreground lg:text-6xl">
              Turn Every Stock and Sale Into a Smarter Plan.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Connect inventory, recipes, production planning, POS, and AI-powered
              insights to reduce waste and make better operational decisions.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href="#platform">Explore the Platform</a>
              </Button>

              <Button asChild size="lg" variant="outline">
                <a href="#connected-operations">See How It Works</a>
              </Button>
            </div>
          </div>
        </RevealOnScroll>

        <div className="flex self-start justify-center lg:justify-end">
          <HeroDashboardMockup
            stats={stats}
            lowStock={lowStock}
            topMenu={topMenu}
            insight={insight}
          />
        </div>
      </div>
    </section>
  );
}