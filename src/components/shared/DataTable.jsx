import { Loader2, Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = "Tidak ada data.",
  emptyIcon,
}) {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 size={18} className="animate-spin" strokeWidth={2} />
        <span className="text-sm">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-x-auto">
      <Table className="min-w-max">
        {/* Header */}
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-4",
                  col.headerClass,
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        {/* Body */}
        <TableBody>
          {data.length === 0 ? (
            <TableRow className="hover:bg-transparent border-0">
              <TableCell
                colSpan={columns.length}
                className="py-16 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-3">
                  {emptyIcon ?? (
                    <Inbox
                      size={32}
                      strokeWidth={1.5}
                      className="text-muted-foreground/50"
                    />
                  )}
                  <span className="text-sm">{emptyMessage}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow
                key={row._id ?? idx}
                className="border-b border-border/50 odd:bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn("py-4 px-4 align-middle", col.cellClass)}
                  >
                    {col.render ? col.render(row) : (row[col.key] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
