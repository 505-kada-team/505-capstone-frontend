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
  menuStatus = "active", // ← tambahan: "active", "deleted", dll.
}) {
  const isDeleted = menuStatus === "deleted";
  const formatRp = (num) =>
    num != null ? `Rp ${num.toLocaleString("id-ID")}` : "-";

  if (isDeleted) {
    return (
      <div className="border border-dashed rounded-lg p-4 bg-muted/20 text-center text-sm text-muted-foreground mb-4">
        {menuName} — Menu deleted
      </div>
    );
  }

  if (variant === "active") {
    return (
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? "item-1" : ""}
        className={cn("w-full min-w-0", className)}
      >
        <AccordionItem
          value="item-1"
          className={cn(
            "border rounded-lg mb-4 bg-card px-4 border-border data-[state=open]:border-border/80 shadow-sm min-w-0",
            isDeleted && "opacity-60 border-dashed", // ← styling khusus deleted
          )}
        >
          <AccordionTrigger className="hover:no-underline py-4 justify-between gap-4">
            <div className="flex items-center justify-between w-full text-left flex-wrap gap-y-2">
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={`font-semibold leading-tight truncate ${
                    isDeleted
                      ? "text-muted-foreground line-through"
                      : summary.discountPercent > 0
                        ? "text-[#C4441F]"
                        : "text-foreground"
                  }`}
                >
                  {menuName}
                </span>
                {isDeleted && <StatusBadge variant="deleted" />}
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="flex items-center gap-3">
                  {summary.discountPercent > 0 && !isDeleted && (
                    <span className="text-sm font-bold text-[#C4441F] leading-none">
                      {summary.discountPercent}%
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {badges.map((b, i) => (
                      <StatusBadge key={i} variant={b} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2 min-w-0">
            {isDeleted ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                Menu ini telah dihapus. Detail bahan dan ringkasan finansial
                tidak tersedia.
              </div>
            ) : (
              <div className="flex flex-col gap-6 min-w-0">
                {/* Summary Finansial — responsive */}
                <div
                  className={`bg-muted/10 rounded-md p-4 grid gap-y-4 gap-x-6 text-sm grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 ${
                    summary.discountPercent > 0
                      ? "lg:grid-cols-6"
                      : "lg:grid-cols-4"
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{summary.quantity} cups</span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-muted-foreground">Selling Price</span>
                    <span className="font-mono">
                      {formatRp(summary.originalPrice)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-muted-foreground">
                      Estimated Revenue
                    </span>
                    <span className="font-mono">
                      {formatRp(summary.estimatedRevenue)}
                    </span>
                  </div>
                  {/* Bagian Estimated Profit telah dihapus */}

                  {summary.discountPercent > 0 && (
                    <>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-mono">
                          {summary.discountPercent}%
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-muted-foreground">
                          New Selling Price
                        </span>
                        <span className="font-mono">
                          {formatRp(summary.newPrice)}
                        </span>
                      </div>
                      {/* Bagian New Estimated Profit telah dihapus */}
                    </>
                  )}
                </div>

                {/* Tabel Ingredients */}
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm mb-3">
                    Requirements & Inventory Check
                  </h4>
                  <div className="rounded-md border overflow-hidden min-w-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left min-w-[640px]">
                        <thead className="text-xs text-muted-foreground bg-muted/40">
                          <tr>
                            <th className="py-2.5 font-medium px-4">
                              Item Name
                            </th>
                            <th className="py-2.5 font-medium px-4">Needed</th>
                            <th className="py-2.5 font-medium px-4">
                              Available
                            </th>
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
                              <td className="py-3 px-4 font-mono">
                                {ing.needed}
                              </td>
                              <td className="py-3 px-4 font-mono">
                                {ing.available}
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
                                colSpan={5}
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
              </div>
            )}
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
      className={cn("w-full min-w-0", className)}
    >
      <AccordionItem
        value="item-1"
        className={cn(
          "border rounded-lg mb-4 bg-card px-4 border-destructive/20 data-[state=open]:border-destructive/30 min-w-0",
          isDeleted && "opacity-60 border-dashed border-muted-foreground/30",
        )}
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center justify-between w-full pr-4 flex-wrap gap-y-2">
            <span
              className={cn(
                "font-bold truncate",
                isDeleted
                  ? "text-muted-foreground line-through"
                  : "text-[#C4441F]",
              )}
            >
              {menuName}
            </span>
            <div className="flex items-center gap-4 shrink-0">
              {isDeleted && <StatusBadge variant="deleted" />}
              {summary.discountPercent > 0 && !isDeleted && (
                <span className="text-sm font-bold text-[#C4441F] leading-none">
                  {summary.discountPercent}%
                </span>
              )}
              <div className="flex items-center gap-2">
                {badges.map((b, i) => (
                  <StatusBadge key={i} variant={b} />
                ))}
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4 min-w-0">
          {isDeleted ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Menu ini telah dihapus. Detail bahan dan ringkasan finansial tidak
              tersedia.
            </div>
          ) : (
            <div className="flex flex-col gap-6 min-w-0">
              {/* Summary Finansial — responsive */}
              <div
                className={`bg-muted/10 border border-muted-foreground/20 rounded-md p-4 grid gap-y-4 gap-x-6 text-sm grid-cols-1 xs:grid-cols-2 ${
                  summary.discountPercent > 0
                    ? "sm:grid-cols-3 lg:grid-cols-6"
                    : "sm:grid-cols-3"
                }`}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-mono">{summary.quantity} cups</span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-muted-foreground">Selling Price</span>
                  <span className="font-mono">
                    {formatRp(summary.originalPrice)}
                  </span>
                </div>
                {/* Bagian Estimated Profit telah dihapus dari draft juga */}

                {summary.discountPercent > 0 && (
                  <>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-mono">
                        {summary.discountPercent}%
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-muted-foreground">
                        New Selling Price
                      </span>
                      <span className="font-mono">
                        {formatRp(summary.newPrice)}
                      </span>
                    </div>
                    {/* Bagian New Estimated Profit telah dihapus */}
                  </>
                )}
              </div>

              {/* Tabel Ingredients */}
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[640px]">
                  <thead className="text-xs text-muted-foreground uppercase border-b">
                    <tr>
                      <th className="py-2 font-medium">Item Name</th>
                      <th className="py-2 font-medium text-center">Needed</th>
                      <th className="py-2 font-medium text-center">
                        Available
                      </th>
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
                          colSpan={5}
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
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
