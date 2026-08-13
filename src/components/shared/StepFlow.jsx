import { ArrowRight } from 'lucide-react';
import IconTile from './IconTile';
import { cn } from '../../lib/utils';

/**
 * Horizontal "A → B → C" workflow row. Reused by Connected Operations and
 * POS Integration since both are, structurally, the same kind of diagram.
 * `steps`: [{ label, icon }]
 */
export default function StepFlow({ steps, tone = 'default' }) {
  const isInverted = tone === 'inverted';

  return (
    <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-8">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-start">
          <div className="flex w-24 flex-col items-center gap-3 text-center sm:w-28">
            <IconTile icon={step.icon} tone={isInverted ? 'secondary' : 'accent'} />
            <span
              className={cn(
                'font-body text-sm font-medium leading-tight',
                isInverted ? 'text-background' : 'text-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <ArrowRight
              className={cn('mt-4 shrink-0', isInverted ? 'text-background/40' : 'text-muted')}
              size={18}
            />
          )}
        </div>
      ))}
    </div>
  );
}
