import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";

function formatDate(dateStr) {
  if (!dateStr) return "-/-/-";
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, "0")} ${
    [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][date.getMonth()]
  } ${date.getFullYear()}`;
}

/**
 * Tab Inventory: menampilkan daftar bahan (bukan per-menu) beserta
 * batch mana saja yang dipakai/dialokasikan. Menerima `inventoryList`
 * yang sudah dinormalisasi oleh plan.mapper (mapInventoryList), jadi
 * komponen ini tidak perlu tahu apakah plan-nya draft atau committed.
 */
export default function PlanInventoryAccordion({
  inventoryList = [],
  defaultOpen = false,
  className,
}) {
  if (inventoryList.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
        No inventory data for this plan
      </div>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "inv-0" : ""}
      className={cn("w-full min-w-0", className)}
    >
      {inventoryList.map((inv, idx) => {
        const sufficientBadge = inv.sufficient ? "sufficient" : "insufficient";
        const safetyBadge = inv.hasUnsafeBatch ? "unsafe" : "safe";

        return (
          <AccordionItem
            key={inv.inventoryId ?? idx}
            value={`inv-${idx}`}
            className="border rounded-lg mb-4 bg-card px-4 border-border data-[state=open]:border-border/80 min-w-0"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center justify-between w-full pr-4 flex-wrap gap-y-2">
                <div className="flex flex-col min-w-0 text-left">
                  <span className="font-semibold truncate">
                    {inv.nameInventory}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    Needed: {inv.quantityNeeded ?? 0} {inv.unit}
                    {inv.availableQuantity != null &&
                      ` · Available: ${inv.availableQuantity} ${inv.unit}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge variant={sufficientBadge} />
                  <StatusBadge variant={safetyBadge} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 min-w-0">
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[560px]">
                  <thead className="text-xs text-muted-foreground uppercase border-b">
                    <tr>
                      <th className="py-2 font-medium">Batch</th>
                      <th className="py-2 font-medium text-center">
                        Qty Taken
                      </th>
                      <th className="py-2 font-medium text-center">Expired</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inv.batches.map((b, i) => (
                      <tr
                        key={b.subInventoryId ?? i}
                        className="hover:bg-muted/5"
                      >
                        <td className="py-3 font-mono text-foreground">
                          {b.batchCode ?? b.subInventoryId}
                        </td>
                        <td className="py-3 font-mono text-center">
                          {b.quantityTaken} {inv.unit}
                        </td>
                        <td className="py-3 font-mono text-center">
                          {formatDate(b.expired)}
                        </td>
                        <td className="py-3">
                          <StatusBadge variant={b.batchSafetyStatus} />
                        </td>
                      </tr>
                    ))}
                    {inv.batches.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-muted-foreground"
                        >
                          No batch data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
