import { cn } from '@/lib/utils';

const variantMap = {
  ingredients: {
    label: 'Ingredients',
    className: 'bg-secondary text-secondary-foreground border border-secondary-foreground/20',
  },
  packaging: {
    label: 'Packaging',
    className: 'bg-muted text-muted-foreground border border-border',
  },
};

export default function CategoryBadge({ category, className }) {
  const config = variantMap[category] ?? variantMap.packaging;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
