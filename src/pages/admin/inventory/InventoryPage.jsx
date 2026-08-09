/**
 * InventoryPage.jsx — pages/admin/
 *
 * Halaman daftar inventory (admin).
 * Fitur: list + filter + search + sort + pagination + tambah inventory.
 *
 * Referensi endpoint:
 *   GET  /api/inventory           → getInventoryList  (list + filter)
 *   POST /api/inventory           → createInventory   (tambah item baru)
 *   DEL  /api/inventory/:id       → archiveInventory  (arsip via ConfirmDialog)
 *
 * State yang dihandle:
 *   - quantityTotal: null  → tampilkan "—" (inventory baru tanpa batch)
 *   - quantityTotal: 0     → tampilkan "0 unit" (pernah ada stok, sekarang habis)
 *   - category badge       → ingredients=oranye, packaging=abu
 *
 * Komponen UI: SEMUA pakai shadcn — tidak ada native <select> HTML.
 *   Filter bar : shadcn Select (Select + SelectTrigger + SelectContent + SelectItem)
 *   Form dialog: FormSelect shared component (wrapper shadcn Select + Label + error)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {  Plus,
  ListFilter,
} from 'lucide-react';

// Shared components
import PageHeader    from '@/components/shared/PageHeader';
import DataTable     from '@/components/shared/DataTable';
import CategoryBadge from '@/components/shared/CategoryBadge';
import Pagination    from '@/components/shared/Pagination';
import SearchInput   from '@/components/shared/SearchInput';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

import AddInventoryModal from './components/AddInventoryModal';

// shadcn UI
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Services & schemas
import {
  getInventoryList,
  archiveInventory,
} from '@/services/api';

// ============================================================
// Constants — opsi filter dan form
// ============================================================
const LIMIT = 10;

const CATEGORY_FILTER_OPTIONS = [
  { value: 'All Categories', label: 'All Categories' },
  { value: 'Ingredients', label: 'Ingredients' },
  { value: 'Packaging',   label: 'Packaging' },
];





// ============================================================
// Helper functions
// ============================================================

/** Format angka ke Rupiah: 12700 → "Rp 12.700" */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format quantity + konversi unit otomatis:
 *   gr ≥ 1000  → Kg
 *   ml ≥ 1000  → Ltr
 *   null       → "—" (inventory baru, belum ada batch)
 */
const formatQuantity = (quantity, unit) => {
  if (quantity === null || quantity === undefined) return '—';
  if (unit === 'gr' && quantity >= 1000) {
    const val = (quantity / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    return `${val} Kg`;
  }
  if (unit === 'ml' && quantity >= 1000) {
    const val = (quantity / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    return `${val} Ltr`;
  }
  const uMap = { gr: 'gr', ml: 'ml', pcs: 'Pcs' };
  return `${quantity.toLocaleString('id-ID')} ${uMap[unit] ?? unit}`;
};

// ============================================================
// Main Page Component
// ============================================================
export default function InventoryPage() {
  const navigate = useNavigate();

  // ── Data state ────────────────────────────────────────────
  const [inventoryList, setInventoryList] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [pagination,    setPagination]    = useState({
    totalData: 0, totalPage: 1, currentPage: 1, limit: LIMIT,
  });

  // ── Filter state ──────────────────────────────────────────
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [sort]                  = useState('latest');
  const [page,     setPage]     = useState(1);

  // ── Dialog state ──────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [archiveTarget,  setArchiveTarget]  = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // ── Fetch data ────────────────────────────────────────────
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: LIMIT,
        ...(search            && { search }),
        ...(category !== 'all' && { category }),
        ...(sort              && { sort }),
      };
      const res = await getInventoryList(params);
      setInventoryList(res.data.data ?? []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      console.error('[InventoryPage] fetchInventory error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sort]);

  useEffect(() => {
    // eslint-disable-next-line
    fetchInventory();
  }, [fetchInventory]);

  // Reset page ke 1 setiap kali filter berubah
  const handleSearch   = (val) => { setSearch(val);   setPage(1); };
  const handleCategory = (val) => { setCategory(val); setPage(1); };

  // ── Archive inventory ─────────────────────────────────────
  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setArchiveLoading(true);
    try {
      await archiveInventory(archiveTarget._id);
      setArchiveTarget(null);
      fetchInventory();
    } catch (err) {
      console.error('[InventoryPage] archiveInventory error:', err);
    } finally {
      setArchiveLoading(false);
    }
  };

  // ── Table column definitions ──────────────────────────────
  const columns = [
    {
      key: 'nameInventory',
      header: 'Item Name',
      headerClass: 'w-[40%]',
      render: (row) => (
        <span className="font-medium text-foreground text-sm">{row.nameInventory}</span>
      ),
    },
    {
      key: 'quantityTotal',
      header: 'Quantity',
      headerClass: 'w-[15%]',
      // Angka pakai font-mono (Geist Mono Variable)
      cellClass: 'font-mono text-sm',
      render: (row) => (
        <span className={row.quantityTotal === null ? 'text-muted-foreground' : ''}>
          {formatQuantity(row.quantityTotal, row.unit)}
        </span>
      ),
    },
    {
      key: 'lastCostBatch',
      header: 'Cost per Unit',
      headerClass: 'w-[20%]',
      cellClass: 'font-mono text-sm',
      render: (row) => (
        <span className={row.lastCostBatch === null ? 'text-muted-foreground' : ''}>
          {formatCurrency(row.lastCostBatch)}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      headerClass: 'w-[15%]',
      render: (row) => <CategoryBadge category={row.category} />,
    },
    {
      key: 'aksi',
      header: 'Action',
      headerClass: 'w-[10%] text-right',
      cellClass: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            id={`inventory-detail-${row._id}`}
            variant="link"
            size="sm"
            className="text-[#F97316] hover:text-[#F97316]/80 px-0 h-auto font-medium"
            onClick={() => navigate(`/admin/inventory/${row._id}`)}
          >
            Detail
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <div>
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

      {/* Filter Bar — semua shadcn Select, tidak ada native <select> */}
      <div className="flex items-center justify-between gap-2 mb-5">
        {/* Search */}
        <SearchInput
          id="inventory-search"
          placeholder="Search by name or ID..."
          value={search}
          onChange={handleSearch}
          className="w-[400px]"
        />

        <div className="flex items-center gap-3">
          {/* Category filter — shadcn Select */}
          <Select value={category} onValueChange={handleCategory}>
            <SelectTrigger
              id="inventory-category-filter"
              className="w-[160px] gap-2 h-9 text-muted-foreground font-normal"
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

          {/* More Filters button */}
          <Button variant="outline" className="gap-2 h-9 text-muted-foreground font-normal">
            <ListFilter size={16} />
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={inventoryList}
          loading={loading}
          emptyMessage="No inventory added yet. Click '+ Add Item' to add first item."
        />
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPage={pagination.totalPage}
        totalData={pagination.totalData}
        limit={pagination.limit}
        onPageChange={setPage}
      />

      {/* ── Dialogs ──────────────────────────────────────── */}

      {/* Add Inventory */}
      <AddInventoryModal
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={fetchInventory}
      />

      {/* Detail & Edit Inventory */}

      {/* Confirm Archive */}
      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
        title="Arsipkan Inventory?"
        description={
          archiveTarget
            ? `Inventory "${archiveTarget.nameInventory}" akan diarsipkan. Pastikan semua batch sudah kosong sebelum mengarsipkan.`
            : ''
        }
        confirmLabel="Ya, Arsipkan"
        loading={archiveLoading}
      />
    </div>
  );
}
