import { Sparkles, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useContextEngineData } from "@/AI/contextEngine/ContextEngineContext"; // sesuaikan path import-nya

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
  const {
    recommendations,
    result,
    isLoading,
    error,
    refresh,
  } = useContextEngineData();

  // ---- fallback insight lokal (dipakai kalau context engine belum ada hasil) ----
  const peakHour = hourlyTrends.reduce((best, current) => {
    if (!best) return current;
    return current.revenue > best.revenue ? current : best;
  }, null);

  const topMenu = [...menuBreakdown].sort(
    (a, b) => b.unitsSold - a.unitsSold
  )[0];

  const hasLocalData =
    (peakHour && peakHour.revenue > 0) ||
    (topMenu && topMenu.unitsSold > 0);

  let localInsight = "No significant sales insight available yet.";

  if (hasLocalData && peakHour?.revenue > 0 && topMenu?.unitsSold > 0) {
    localInsight = `Sales peaked at ${peakHour.timeBucket} with ${formatRupiah(
      peakHour.revenue
    )}. ${topMenu.name} was the best-selling menu with ${topMenu.unitsSold} cups sold.`;
  } else if (peakHour?.revenue > 0) {
    localInsight = `Sales peaked at ${peakHour.timeBucket} with ${formatRupiah(
      peakHour.revenue
    )}.`;
  } else if (topMenu?.unitsSold > 0) {
    localInsight = `${topMenu.name} was the best-selling menu with ${topMenu.unitsSold} cups sold.`;
  }

  const hasContextRecommendations = recommendations && recommendations.length > 0;
  const hasAnyData = hasContextRecommendations || hasLocalData;

  return (
    <Card className="bg-card border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          AI Insights
        </CardTitle>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Refresh AI insight"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <Sparkles className="h-4 w-4 text-orange-600" />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && !hasContextRecommendations ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <p className="text-xs">Generating AI insight...</p>
          </div>
        ) : error && !hasContextRecommendations ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <p className="text-xs">
              Failed to generate AI insight. {error.message}
            </p>
          </div>
        ) : !hasAnyData ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            <p className="text-xs">
              Not enough sales data to generate insights.
            </p>
          </div>
        ) : hasContextRecommendations ? (
          <div className="rounded-lg bg-muted p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-semibold text-foreground">
                  {result?.planName ?? "Business Insight"}
                </span>
              </div>
              {result?.generatedAt && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(result.generatedAt).toLocaleString("id-ID")}
                </span>
              )}
            </div>

            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="text-xs leading-5 text-muted-foreground"
                >
                  {rec}
                </li>
              ))}
            </ul>
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
              {localInsight}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
