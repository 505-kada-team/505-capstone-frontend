import { cn } from '@/lib/utils';

/**
 * Reusable heading block for landing page sections.
 *
 * Props:
 * - eyebrow: small label above the title
 * - title: main section title
 * - description: supporting text
 * - align: "center" | "left"
 * - tone: "default" | "inverted"
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'default',
  className,
}) {
  const isCenter = align === 'center';
  const isInverted = tone === 'inverted';

  return (
    <div
      className={cn(
        'max-w-3xl',
        isCenter ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'mb-3 text-xs font-semibold uppercase tracking-[0.18em]',
            isInverted ? 'text-accent' : 'text-accent',
          )}
        >
          {eyebrow}
        </p>
      )}

      <h2
        className={cn(
          'text-3xl font-semibold leading-tight tracking-tight md:text-4xl',
          isInverted ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            'mt-4 text-base leading-7 md:text-lg',
            isInverted
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}