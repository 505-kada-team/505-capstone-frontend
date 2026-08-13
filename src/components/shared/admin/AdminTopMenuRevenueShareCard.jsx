import { Coffee } from 'lucide-react';
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

export default function AdminTopMenuRevenueShareCard({
  menu,
  percentage = 0,
}) {
  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          Top Menu Revenue Share
        </CardTitle>

        <Coffee className="h-4 w-4 text-orange-600" />
      </CardHeader>

      <CardContent>
        {!menu || percentage <= 0 ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Coffee className="h-5 w-5" />
            <p className="text-xs">
              No menu sales recorded for this date.
            </p>
          </div>
        ) : (
          <div className="flex gap-3">
            {menu.image ? (
              <img
                src={menu.image}
                alt={menu.name || 'Menu'}
                className="h-12 w-12 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                <Coffee className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {menu.name || 'Unnamed Menu'}
              </p>

              <p className="mt-1 font-mono text-xl font-bold text-foreground">
                {percentage.toFixed(1)}%
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatRupiah(menu.revenue)} of daily revenue
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}