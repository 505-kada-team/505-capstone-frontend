import { Coffee } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);

export default function AdminTopFiveMenuCard({ menus = [] }) {
  const topMenus = [...menus]
    .sort((a, b) => {
      if (b.unitsSold !== a.unitsSold) {
        return b.unitsSold - a.unitsSold;
      }

      return b.revenue - a.revenue;
    })
    .slice(0, 5);

  return (
    <Card className="bg-card border-border shadow-xs flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          Top 5 Menu
        </CardTitle>

        <Coffee className="h-4 w-4 text-orange-600" />
      </CardHeader>

      <CardContent>
        {topMenus.length === 0 ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Coffee className="h-5 w-5" />
            <p className="text-xs">No menu sales recorded for this date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topMenus.map((menu, index) => (
              <div
                key={menu.menuId}
                className="flex items-center gap-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {menu.name || "Unnamed Menu"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {menu.unitsSold} cups · {formatRupiah(menu.revenue)}
                  </p>
                </div>

                {menu.image ? (
                  <img
                    src={menu.image}
                    alt={menu.name || "Menu"}
                    className="h-9 w-9 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}