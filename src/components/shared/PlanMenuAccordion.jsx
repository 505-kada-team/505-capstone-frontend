import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";

export default function PlanMenuAccordion({
  variant = "draft", // 'draft' | 'active'
  menuName,
  badges = [],
  summary = {},
  ingredients = [],
  defaultOpen = false,
  className,
}) {
  const formatRp = (num) =>
    num != null ? `Rp ${num.toLocaleString("id-ID")}` : "-";

  if (variant === "active") {
    return (
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? "item-1" : ""}
        className={cn("w-full", className)}
      >
        <AccordionItem
          value="item-1"
          className="border rounded-lg mb-4 bg-card px-4 border-border data-[state=open]:border-border/80 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline py-4 justify-between gap-4">
            {/* flex-wrap: di layar sempit, badge/discount pindah baris berikutnya
                alih-alih numpuk/kepotong di samping nama menu */}
            <div className="flex items-center justify-between w-full text-left flex-wrap gap-y-2">
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={`font-semibold leading-tight truncate ${summary.discountPercent > 0 ? "text-[#C4441F]" : "text-foreground"}`}
                >
                  {menuName}
                </span>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="flex items-center gap-3">
                  {summary.discountPercent > 0 && (
                    <span className="text-sm font-bold text-[#C4441F] leading-none">
                      {summary.discountPercent}%
                    </span>
                  )}
                  {/* items-center di sini adalah fix utama vertical-align badge */}
                  <div className="flex items-center gap-2">
                    {badges.map((b, i) => (
                      <StatusBadge key={i} variant={b} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            <div className="flex flex-col gap-6">
              {/* Summary Finansial — responsive: 2 kolom di HP, makin lebar makin banyak kolom */}
              <div
                className={`bg-muted/10 rounded-md p-4 grid gap-y-4 gap-x-6 text-sm grid-cols-2 sm:grid-cols-3 ${
                  summary.discountPercent > 0
                    ? "lg:grid-cols-6"
                    : "lg:grid-cols-4"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-mono">{summary.quantity} cups</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Selling Price</span>
                  <span className="font-mono">
                    {formatRp(summary.originalPrice)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">
                    Estimated Revenue
                  </span>
                  <span className="font-mono">
                    {formatRp(summary.estimatedRevenue)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">
                    Estimated Profit
                  </span>
                  <span className="font-mono text-emerald-600 font-medium">
                    {formatRp(summary.estimatedProfit)}
                  </span>
                </div>

                {summary.discountPercent > 0 && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-mono">
                        {summary.discountPercent}%
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">
                        New Selling Price
                      </span>
                      <span className="font-mono">
                        {formatRp(summary.newPrice)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">
                        New Estimated Profit
                      </span>
                      <span className="font-mono text-emerald-600 font-medium">
                        {formatRp(summary.newProfit)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Tabel Ingredients */}
              <div className="overflow-x-auto mt-2">
                <h4 className="font-semibold text-sm mb-3">
                  Requirements & Inventory Check
                </h4>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm text-left min-w-[640px]">
                    <thead className="text-xs text-muted-foreground bg-muted/40">
                      <tr>
                        <th className="py-2.5 font-medium px-4">Item Name</th>
                        <th className="py-2.5 font-medium px-4">Needed</th>
                        <th className="py-2.5 font-medium px-4">Available</th>
                        <th className="py-2.5 font-medium px-4">Shortage</th>
                        <th className="py-2.5 font-medium px-4">Expired</th>
                        <th className="py-2.5 font-medium px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {ingredients.map((ing, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium text-foreground">
                            {ing.name}
                          </td>
                          <td className="py-3 px-4 font-mono">{ing.needed}</td>
                          <td className="py-3 px-4 font-mono">
                            {ing.available}
                          </td>
                          <td className="py-3 px-4 font-mono text-destructive">
                            {ing.shortage || "-"}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {ing.expired || "-/-/-"}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge variant={ing.status} />
                          </td>
                        </tr>
                      ))}
                      {ingredients.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-6 px-4 text-center text-muted-foreground"
                          >
                            No ingredient data for this menu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // Variant Draft
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "item-1" : ""}
      className={cn("w-full", className)}
    >
      <AccordionItem
        value="item-1"
        className="border rounded-lg mb-4 bg-card px-4 border-destructive/20 data-[state=open]:border-destructive/30"
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center justify-between w-full pr-4 flex-wrap gap-y-2">
            <span className="font-bold text-[#C4441F] truncate">
              {menuName}
            </span>
            <div className="flex items-center gap-4 shrink-0">
              {summary.discountPercent > 0 && (
                <span className="text-sm font-bold text-[#C4441F] leading-none">
                  {summary.discountPercent}%
                </span>
              )}
              {/* items-center = fix vertical-align badge, sama seperti variant active */}
              <div className="flex items-center gap-2">
                {badges.map((b, i) => (
                  <StatusBadge key={i} variant={b} />
                ))}
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="flex flex-col gap-6">
            {/* Summary Finansial — responsive */}
            <div
              className={`bg-muted/10 border border-muted-foreground/20 rounded-md p-4 grid gap-y-4 gap-x-6 text-sm grid-cols-2 ${
                summary.discountPercent > 0
                  ? "sm:grid-cols-3 lg:grid-cols-6"
                  : "sm:grid-cols-3"
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-mono">{summary.quantity} cups</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Selling Price</span>
                <span className="font-mono">
                  {formatRp(summary.originalPrice)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Estimated Profit</span>
                <span className="font-mono">
                  {formatRp(summary.estimatedProfit)}
                </span>
              </div>

              {summary.discountPercent > 0 && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-mono">
                      {summary.discountPercent}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">
                      New Selling Price
                    </span>
                    <span className="font-mono">
                      {formatRp(summary.newPrice)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">
                      New Estimated Profit
                    </span>
                    <span className="font-mono text-emerald-600 font-medium">
                      {formatRp(summary.newProfit)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Tabel Ingredients */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[640px]">
                <thead className="text-xs text-muted-foreground uppercase border-b">
                  <tr>
                    <th className="py-2 font-medium">Item Name</th>
                    <th className="py-2 font-medium text-center">Needed</th>
                    <th className="py-2 font-medium text-center">Available</th>
                    <th className="py-2 font-medium text-center">Shortage</th>
                    <th className="py-2 font-medium text-center">Expired</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ingredients.map((ing, i) => (
                    <tr key={i} className="hover:bg-muted/5">
                      <td className="py-3 font-medium text-foreground">
                        {ing.name}
                      </td>
                      <td className="py-3 font-mono text-center">
                        {ing.needed}
                      </td>
                      <td className="py-3 font-mono text-center">
                        {ing.available}
                      </td>
                      <td className="py-3 font-mono text-center text-destructive">
                        {ing.shortage || "-"}
                      </td>
                      <td className="py-3 font-mono text-center">
                        {ing.expired || "-/-/-"}
                      </td>
                      <td className="py-3">
                        <StatusBadge variant={ing.status} />
                      </td>
                    </tr>
                  ))}
                  {ingredients.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No ingredient data for this menu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
