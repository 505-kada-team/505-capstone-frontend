import { cn } from '@/lib/utils';
import { TriangleAlert, Lightbulb } from 'lucide-react';

export default function AlertSummaryCard({ 
  title, 
  value, 
  variant = 'warning', 
  icon: CustomIcon,
  action 
}) {
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  return (
    <div
      className={cn(
        'bg-card rounded-lg border flex items-center p-4 justify-between gap-4',
        isWarning && 'border-l-4 border-l-[#C4441F] border-border',
        isSuccess && 'border-l-4 border-l-[#4E6A3E] border-border'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center justify-center',
            isWarning && 'text-[#C4441F]',
            isSuccess && 'text-[#4E6A3E]'
          )}
        >
          {CustomIcon ? (
            CustomIcon
          ) : isWarning ? (
            <TriangleAlert className="w-5 h-5" />
          ) : (
            <Lightbulb className="w-5 h-5" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <span
            className={cn(
              'text-base font-bold',
              isWarning && 'text-[#C4441F]',
              isSuccess && 'text-[#4E6A3E]' // or foreground?
            )}
          >
            {value}
          </span>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
