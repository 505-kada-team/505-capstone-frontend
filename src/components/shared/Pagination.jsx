/**
 * Pagination.jsx — components/shared/
 *
 * Komponen pagination generik.
 * Menampilkan: "Showing X–Y of Z items" + tombol halaman + prev/next.
 *
 * Props:
 *   currentPage  : number — halaman aktif (1-indexed)
 *   totalPage    : number — total halaman
 *   totalData    : number — total item keseluruhan
 *   limit        : number — item per halaman
 *   onPageChange : (page: number) => void
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Pagination({
  currentPage,
  totalPage,
  totalData,
  limit,
  onPageChange,
}) {
  // Hitung range yang ditampilkan
  const start = totalData === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalData);

  // Tampilkan max 5 halaman, centered di current page
  const getPageNumbers = () => {
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPage, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    const pages = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  if (totalPage <= 0) return null;

  return (
    // Tambahkan lg:justify-center agar tombol ke tengah di desktop
    <div className="flex items-center justify-between lg:justify-center mt-4 px-1">
      {/* Info count - Tambahkan lg:hidden agar hilang di desktop */}
      <p className="text-xs text-muted-foreground lg:hidden">
        Showing{" "}
        <span className="font-mono font-medium text-foreground">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-mono font-medium text-foreground">
          {totalData.toLocaleString("id-ID")}
        </span>{" "}
        items
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          id="pagination-prev"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </Button>

        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon-sm"
            id={`pagination-page-${page}`}
            onClick={() => onPageChange(page)}
            aria-label={`Halaman ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "min-w-[28px] font-mono text-xs",
              page === currentPage &&
                "bg-primary text-primary-foreground font-semibold",
            )}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="icon-sm"
          id="pagination-next"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPage}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={14} strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}
