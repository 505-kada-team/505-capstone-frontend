import { Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = "Tidak ada data.",
  emptyIcon,
}) {
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
          {loading ? (
            Array.from({ length: 5 }).map((_, rowIdx) => (
              <TableRow
                key={rowIdx}
                className="border-b border-border/50 odd:bg-muted/10"
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className="py-4 px-4 align-middle"
                  >
                    <Skeleton
                      className={cn(
                        "h-4 w-3/4",
                        col.cellClass?.includes("text-right") && "ml-auto",
                        col.cellClass?.includes("text-center") && "mx-auto"
                      )}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
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
