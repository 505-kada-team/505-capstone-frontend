import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);

export default function AdminSalesConcentrationCard({
  percentage = 0,
  revenue = 0,
  hours = [],
}) {
  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          Sales Concentration
        </CardTitle>

        <Activity className="h-4 w-4 text-orange-600" />
      </CardHeader>

      <CardContent>
        {percentage <= 0 ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Activity className="h-5 w-5" />
            <p className="text-xs">
              No sales activity recorded for this date.
            </p>
          </div>
        ) : (
          <>
            <p className="font-mono text-3xl font-bold text-foreground">
              {percentage.toFixed(1)}%
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Revenue from top 3 sales hours
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-orange-600"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Concentrated revenue
              </span>

              <span className="font-mono text-xs font-semibold text-foreground">
                {formatRupiah(revenue)}
              </span>
            </div>

            {hours.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {hours.map((hour) => (
                  <span
                    key={hour.hour}
                    className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground"
                  >
                     {`${String(hour.hour).padStart(2, '0')}:00`}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}