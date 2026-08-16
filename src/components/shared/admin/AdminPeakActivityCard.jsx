import { Clock, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);

export default function AdminPeakActivityCard({ hourlyTrends = [] }) {
  const peak = hourlyTrends.reduce((best, current) => {
    if (!best) return current;

    if (current.unitsSold !== best.unitsSold) {
      return current.unitsSold > best.unitsSold ? current : best;
    }

    return current.revenue > best.revenue ? current : best;
  }, null);

  const hasSales = peak && (peak.unitsSold > 0 || peak.revenue > 0);

  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          Peak Activity
        </CardTitle>

        <Clock className="h-4 w-4 text-orange-600" />
      </CardHeader>

      <CardContent>
        {!hasSales ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Clock className="h-5 w-5" />
            <p className="text-xs">No sales activity recorded for this date.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold font-mono text-foreground">
                  {`${String(peak.hour).padStart(2, "0")}:00`}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Highest sales activity
                </p>
              </div>

              <TrendingUp className="mb-1 h-5 w-5 text-orange-600" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Cups Sold
                </p>

                <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                  {peak.unitsSold}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Revenue
                </p>

                <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                  {formatRupiah(peak.revenue)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}