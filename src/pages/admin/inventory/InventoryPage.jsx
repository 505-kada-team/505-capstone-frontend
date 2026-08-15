/**
 * InventoryPage.jsx — pages/admin/
 *
 * Halaman daftar inventory (admin).
 * Fitur: list + filter + search + sort (client-side) + pagination + tambah inventory.
 *
 * Referensi endpoint:
 *   GET  /api/inventory           → useInventoryList  (list + filter)
 *   POST /api/inventory           → useInventoryMutations.createInventory (lewat AddInventoryModal)
 *   DEL  /api/inventory/:id       → useInventoryMutations.archiveInventory (via ConfirmDialog)
 *
 * PENTING — dua perubahan dari versi lama:
 *   1. Backend TIDAK menerima query param `sort` (lihat
 *      validations/inventory.validation.js / listInventoryQuery: cuma
 *      page, limit, category, search, includeDeleted). Sorting sekarang
 *      dilakukan client-side terhadap `items` hasil fetch. Konsekuensinya:
 *      sort HANYA berlaku dalam satu halaman pagination yang sedang
 *      ditampilkan, bukan global across semua data. Kalau butuh sort
 *      global, itu harus jadi permintaan fitur ke backend (di luar scope
 *      "pages menyesuaikan").
 *   2. Filter kategori sebelumnya kirim value 'Ingredients'/'Packaging'
 *      (kapital) padahal enum backend 'ingredients'/'packaging' — filter
 *      kategori kemungkinan besar selama ini selalu no-op. Sudah dibetulkan
 *      ke lowercase.
 *
 * State yang dihandle:
 *   - quantityTotal: null  → tampilkan "—" (inventory baru tanpa batch)
 *   - quantityTotal: 0     → tampilkan "0 unit" (pernah ada stok, sekarang habis)
 *   - category badge       → ingredients=oranye, packaging=abu
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

// Shared components
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import CategoryBadge from "@/components/shared/CategoryBadge";
import Pagination from "@/components/shared/Pagination";
import SearchInput from "@/components/shared/SearchInput";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

import AddInventoryModal from "./components/AddInventoryModal";

// shadcn UI
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Hooks
import { useInventoryList } from "@/hooks/inventory/useInventoryList";
import { useInventoryMutations } from "@/hooks/inventory/useInventoryMutations";
import { useSortable } from "@/hooks/useSortable";

// ============================================================
// Constants — opsi filter dan form
// ============================================================
const LIMIT = 10;

// BERUBAH: value sekarang lowercase, persis enum Inventory.category di
// backend ('ingredients' | 'packaging'). 'all' cuma sentinel client-side —
// gak pernah dikirim ke query.
const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "ingredients", label: "Ingredients" },
  { value: "packaging", label: "Packaging" },
];

// ============================================================
// Helper functions
// ============================================================

/** Format angka ke Rupiah: 12700 → "Rp 12.700" */
// const formatCurrency = (amount) => {
//   if (amount === null || amount === undefined) return "—";
//   return new Intl.NumberFormat("id-ID", {
//     style: "currency",
//     currency: "IDR",
//     minimumFractionDigits: 0,
//   }).format(amount);
// };

/**
 * Format quantity + konversi unit otomatis:
 *   gr ≥ 1000  → Kg
 *   ml ≥ 1000  → Ltr
 *   null       → "—" (inventory baru, belum ada batch)
 */
const formatQuantity = (quantity, unit) => {
  if (quantity === null || quantity === undefined) return "—";
  if (unit === "gr" && quantity >= 1000) {
    const val = (quantity / 1000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    });
    return `${val} Kg`;
  }
  if (unit === "ml" && quantity >= 1000) {
    const val = (quantity / 1000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    });
    return `${val} Ltr`;
  }
  const uMap = { gr: "gr", ml: "ml", pcs: "Pcs" };
  return `${quantity.toLocaleString("id-ID")} ${uMap[unit] ?? unit}`;
};

/**
 * Sort client-side. Cuma jalan terhadap `items` di halaman pagination yang
 * lagi tampil — lihat catatan di header file soal keterbatasan ini.
 */
const sortItems = (items, sortBy) => {
  const sorted = [...items];
  switch (sortBy) {
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      );
    case "name_asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "stock_high":
      return sorted.sort(
        (a, b) =>
          (b.quantityTotal ?? -Infinity) - (a.quantityTotal ?? -Infinity),
      );
    case "stock_low":
      return sorted.sort(
        (a, b) => (a.quantityTotal ?? Infinity) - (b.quantityTotal ?? Infinity),
      );
    case "cost_high":
      return sorted.sort(
        (a, b) =>
          (b.lastCostBatch ?? -Infinity) - (a.lastCostBatch ?? -Infinity),
      );
    case "cost_low":
      return sorted.sort(
        (a, b) => (a.lastCostBatch ?? Infinity) - (b.lastCostBatch ?? Infinity),
      );
    default:
      return sorted;
  }
};

// ============================================================
// Main Page Component
// ============================================================
export default function InventoryPage() {
  const navigate = useNavigate();

  // ── Data hooks ────────────────────────────────────────────
  const {
    items,
    pagination,
    isLoading: loading,
    fetchInventoryList,
  } = useInventoryList();
  const {
    archiveInventory,
    isArchiving: archiveLoading,
    archiveError,
    resetArchiveError,
  } = useInventoryMutations();

  // ── Filter state ──────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { sortBy, setSortBy } = useSortable("newest");
  const [page, setPage] = useState(1);

  // ── Dialog state ──────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);

  // ── Fetch data ────────────────────────────────────────────
  useEffect(() => {
    fetchInventoryList({ page, limit: LIMIT, search, category });
  }, [fetchInventoryList, page, search, category]);

  const sortedItems = useMemo(() => sortItems(items, sortBy), [items, sortBy]);

  // Reset page ke 1 setiap kali filter berubah
  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };
  const handleCategory = (val) => {
    setCategory(val);
    setPage(1);
  };

  const refetch = () =>
    fetchInventoryList({ page, limit: LIMIT, search, category });

  // ── Archive inventory ─────────────────────────────────────
  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      await archiveInventory(archiveTarget.id);
      setArchiveTarget(null);
      refetch();
    } catch {
      // archiveError sudah di-set di dalam hook — ConfirmDialog tetap
      // kebuka biar orang bisa baca pesannya (misal: masih ada stok aktif).
    }
  };

  // ── Table column definitions ──────────────────────────────
  const columns = [
    {
      key: "name",
      header: "Item Name",
      headerClass: "w-[25%]",
      render: (row) => (
        <span className="font-medium text-foreground text-sm">{row.name}</span>
      ),
    },
    {
      key: "itemCode",
      header: "Item Code",
      headerClass: "w-[15%]",
      cellClass: "font-mono text-xs text-muted-foreground",
      render: (row) => row.itemCode || "—",
    },
    {
      key: "totalSubInventory",
      header: "Active Batches",
      headerClass: "w-[15%]",
      cellClass: "font-mono text-xs text-foreground",
      render: (row) => {
        const count = row.totalSubInventory;
        if (!count) return "—";
        return count === 1 ? "1 Batch" : `${count} Batches`;
      },
    },
    {
      key: "quantityTotal",
      header: "Quantity",
      headerClass: "w-[18%]",
      cellClass: "font-mono text-sm",
      render: (row) => (
        <span
          className={row.quantityTotal === null ? "text-muted-foreground" : ""}
        >
          {formatQuantity(row.quantityTotal, row.unit)}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      headerClass: "w-[12%]",
      render: (row) => <CategoryBadge category={row.category} />,
    },
    {
      key: "aksi",
      header: "Action",
      headerClass: "w-[20%] text-right",
      cellClass: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            id={`inventory-detail-${row.id}`}
            variant="link"
            size="sm"
            className="text-[#F97316] hover:text-[#F97316]/80 px-0 h-auto font-medium"
            onClick={() => navigate(`/admin/inventory/${row.id}`)}
          >
            Detail
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      {/* Page Header */}
      <PageHeader
        title="Inventory"
        subtitle="Manage ingredients and stock levels"
        action={
          <Button
            id="add-inventory-btn"
            onClick={() => setShowAddDialog(true)}
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2"
          >
            <Plus size={18} strokeWidth={2} />
            Add Item
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <SearchInput
          id="inventory-search"
          placeholder="Search by name or ID..."
          value={search}
          onChange={handleSearch}
          className="w-full md:flex-[3] md:min-w-0 h-9"
        />

        <div className="flex flex-nowrap items-center gap-2 w-full md:w-auto md:flex-[4] md:min-w-0">
          <Select value={category} onValueChange={handleCategory}>
            <SelectTrigger
              id="inventory-category-filter"
              className="flex-[3] min-w-0 md:w-[130px] md:flex-none h-9 text-muted-foreground font-normal text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-[4] min-w-0 md:w-[130px] md:flex-none h-9 text-muted-foreground font-normal text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest Added</SelectItem>
              <SelectItem value="oldest">Oldest Added</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="stock_high">Highest Stock</SelectItem>
              <SelectItem value="stock_low">Lowest Stock</SelectItem>
              <SelectItem value="cost_high">Highest Cost</SelectItem>
              <SelectItem value="cost_low">Lowest Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {archiveError && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
          <p className="text-sm text-destructive">{archiveError}</p>
        </div>
      )}

      <div className="w-full min-w-0 rounded-lg border border-border bg-card shadow-sm overflow-x-auto">
        <DataTable
          columns={columns}
          data={sortedItems}
          loading={loading}
          emptyMessage="No inventory added yet. Click '+ Add Item' to add first item."
        />
      </div>

      {pagination.total > 0 && (
        <Pagination
          currentPage={page}
          totalPage={pagination.totalPages}
          totalData={pagination.total}
          limit={pagination.limit}
          onPageChange={setPage}
        />
      )}

      {/* ── Dialogs ──────────────────────────────────────── */}

      <AddInventoryModal
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={refetch}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => {
          setArchiveTarget(null);
          resetArchiveError();
        }}
        onConfirm={handleArchiveConfirm}
        title="Arsipkan Inventory?"
        description={
          archiveTarget
            ? `Inventory "${archiveTarget.name}" akan diarsipkan. Pastikan semua batch sudah kosong sebelum mengarsipkan.`
            : ""
        }
        confirmLabel="Ya, Arsipkan"
        loading={archiveLoading}
      />
    </div>
  );
}
