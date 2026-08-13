import { Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);

export default function AdminAIInsightsCard({
  hourlyTrends = [],
  menuBreakdown = [],
}) {
  const peakHour = hourlyTrends.reduce((best, current) => {
    if (!best) return current;
    return current.revenue > best.revenue ? current : best;
  }, null);

  const topMenu = [...menuBreakdown].sort(
    (a, b) => b.unitsSold - a.unitsSold
  )[0];

  const hasData =
    (peakHour && peakHour.revenue > 0) ||
    (topMenu && topMenu.unitsSold > 0);

  let insight = "No significant sales insight available yet.";

  if (hasData && peakHour?.revenue > 0 && topMenu?.unitsSold > 0) {
    insight = `Sales peaked at ${peakHour.timeBucket} with ${formatRupiah(
      peakHour.revenue
    )}. ${topMenu.name} was the best-selling menu with ${topMenu.unitsSold} cups sold.`;
  } else if (peakHour?.revenue > 0) {
    insight = `Sales peaked at ${peakHour.timeBucket} with ${formatRupiah(
      peakHour.revenue
    )}.`;
  } else if (topMenu?.unitsSold > 0) {
    insight = `${topMenu.name} was the best-selling menu with ${topMenu.unitsSold} cups sold.`;
  }

  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          AI Insights
        </CardTitle>

        <Sparkles className="h-4 w-4 text-orange-600" />
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            <p className="text-xs">
              Not enough sales data to generate insights.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-muted p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-600" />

              <span className="text-xs font-semibold text-foreground">
                Daily Insight
              </span>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">
              {insight}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}