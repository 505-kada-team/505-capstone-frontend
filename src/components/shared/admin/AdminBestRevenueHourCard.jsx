import { Clock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);

export default function AdminBestRevenueHourCard({ hour }) {
  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          Best Revenue Hour
        </CardTitle>

        <Clock className="h-4 w-4 text-orange-600" />
      </CardHeader>

      <CardContent>
        {!hour ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Clock className="h-5 w-5" />
            <p className="text-xs">
              No sales activity recorded for this date.
            </p>
          </div>
        ) : (
          <>
            <p className="font-mono text-3xl font-bold text-foreground">
              {hour.timeBucket}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Highest hourly revenue
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Revenue
                </p>

                <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                  {formatRupiah(hour.revenue)}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Cups
                </p>

                <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {hour.unitsSold}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}