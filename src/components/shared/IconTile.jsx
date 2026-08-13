import { cn } from '../../lib/utils';

/**
 * Small icon container used for step markers, benefit cards, and panel icons.
 * `tone` follows the same status/accent language as Badge — reuse, don't invent.
 */
const TONE_CLASSES = {
  accent: 'bg-accent/10 text-accent',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-foreground',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
};

export default function IconTile({ icon: Icon, tone = 'accent', size = 'md', className }) {
  const dimension = size === 'lg' ? 'h-14 w-14' : 'h-10 w-10';
  const iconSize = size === 'lg' ? 22 : 18;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg',
        dimension,
        TONE_CLASSES[tone],
        className
      )}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </div>
  );
}
