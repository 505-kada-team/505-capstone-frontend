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
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Wheat,
  Package,
  Archive,
  ChevronDown,
  TriangleAlert,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import PageHeader      from '@/components/shared/PageHeader';
import DataTable       from '@/components/shared/DataTable';
import StatusBadge     from '@/components/shared/StatusBadge';
import Pagination      from '@/components/shared/Pagination';
import SearchInput     from '@/components/shared/SearchInput';
import ConfirmDialog   from '@/components/shared/ConfirmDialog';

import { Button }       from '@/components/ui/button';
import { Input }        from '@/components/ui/input';
import { Label }        from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  getInventoryList,
  createInventory,
  archiveInventory,
} from '@/services/api';
import { createInventorySchema } from '@/schemas/inventorySchema';

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
 * Format quantity + konversi unit:
 *   gr ≥ 1000  → Kg
 *   ml ≥ 1000  → Ltr
 *   quantityTotal: null → "—" (inventory baru, belum ada batch)
 */
const formatQuantity = (quantity, unit) => {
  if (quantity === null || quantity === undefined) return '—';
  const uMap = { gr: 'gr', ml: 'ml', pcs: 'Pcs' };
  if (unit === 'gr' && quantity >= 1000) {
    const val = (quantity / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    return `${val} Kg`;
  }
  if (unit === 'ml' && quantity >= 1000) {
    const val = (quantity / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    return `${val} Ltr`;
  }
  return `${quantity.toLocaleString('id-ID')} ${uMap[unit] ?? unit}`;
};

/** Icon per kategori (lucide, 16px sesuai DESIGN_v1.md) */
const CategoryIcon = ({ category }) => {
  if (category === 'ingredients') {
    return (
      <div className="w-8 h-8 rounded-md bg-[#F97316]/10 flex items-center justify-center shrink-0">
        <Wheat size={15} strokeWidth={2} className="text-[#F97316]" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
      <Package size={15} strokeWidth={2} className="text-muted-foreground" />
    </div>
  );
};

// ============================================================
// Sub-komponen: Form Tambah Inventory
// Dipisah supaya form state tidak bercampur dengan halaman
// ============================================================
function AddInventoryDialog({ open, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createInventorySchema),
    defaultValues: { nameInventory: '', category: '', unit: '', description: '' },
  });

  const selectedCategory = watch('category');

  // Reset form & error saat dialog dibuka/ditutup
  useEffect(() => {
    if (!open) {
      reset();
      setServerError('');
    }
  }, [open, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setServerError('');
    try {
      await createInventory(data);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Gagal menyimpan inventory. Coba lagi.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-md" id="add-inventory-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Tambah Inventory Baru</DialogTitle>
          <DialogDescription className="text-sm">
            Isi detail item inventory baru. Batch stok bisa ditambahkan setelah item dibuat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* nameInventory */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-name" className="text-sm font-medium">
              Nama Item <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inv-name"
              placeholder="cth. Bubuk Kopi Arabica"
              aria-invalid={!!errors.nameInventory}
              {...register('nameInventory')}
            />
            {errors.nameInventory && (
              <p className="text-xs text-destructive">{errors.nameInventory.message}</p>
            )}
          </div>

          {/* category */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-category" className="text-sm font-medium">
              Kategori <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <select
                    id="inv-category"
                    {...field}
                    aria-invalid={!!errors.category}
                    className="w-full h-8 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors disabled:opacity-50 cursor-pointer dark:bg-input/30"
                  >
                    <option value="" disabled>Pilih kategori</option>
                    <option value="ingredients">Ingredients</option>
                    <option value="packaging">Packaging</option>
                  </select>
                )}
              />
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* unit */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-unit" className="text-sm font-medium">
              Satuan Unit <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <select
                    id="inv-unit"
                    {...field}
                    aria-invalid={!!errors.unit}
                    className="w-full h-8 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors disabled:opacity-50 cursor-pointer dark:bg-input/30"
                  >
                    <option value="" disabled>Pilih satuan</option>
                    <option value="gr">gr (gram)</option>
                    <option value="ml">ml (mililiter)</option>
                    <option value="pcs">pcs (pieces)</option>
                  </select>
                )}
              />
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {errors.unit && (
              <p className="text-xs text-destructive">{errors.unit.message}</p>
            )}
          </div>

          {/* description */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-description" className="text-sm font-medium">
              Deskripsi <span className="text-muted-foreground font-normal">(opsional)</span>
            </Label>
            <textarea
              id="inv-description"
              placeholder="Deskripsi singkat atau catatan khusus tentang item ini..."
              rows={3}
              {...register('description')}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors resize-none dark:bg-input/30"
            />
          </div>

          {/* Server error — inline global (tidak terikat 1 field, lihat DESIGN_v1.md 5b) */}
          {serverError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
              <TriangleAlert size={15} className="text-destructive shrink-0" />
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              id="add-inventory-cancel"
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              id="add-inventory-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Inventory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Main page component
// ============================================================
const LIMIT = 10;

const CATEGORY_OPTIONS = [
  { value: 'all',          label: 'All Categories' },
  { value: 'ingredients',  label: 'Ingredients' },
  { value: 'packaging',    label: 'Packaging' },
];

const SORT_OPTIONS = [
  { value: 'latest',  label: 'Sort: Latest' },
  { value: 'oldest',  label: 'Sort: Oldest' },
  { value: 'name',    label: 'Sort: Name A–Z' },
  { value: 'stock',   label: 'Sort: Stok ↓' },
];

export default function InventoryPage() {
  const navigate = useNavigate();

  // ── Data state ────────────────────────────────────────────
  const [inventoryList, setInventoryList] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [pagination,    setPagination]    = useState({ totalData: 0, totalPage: 1, currentPage: 1, limit: LIMIT });

  // ── Filter state ──────────────────────────────────────────
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [sort,     setSort]     = useState('latest');
  const [page,     setPage]     = useState(1);

  // ── Dialog state ──────────────────────────────────────────
  const [showAddDialog,     setShowAddDialog]     = useState(false);
  const [archiveTarget,     setArchiveTarget]     = useState(null);  // row yang akan diarsip
  const [archiveLoading,    setArchiveLoading]    = useState(false);

  // ── Fetch data ────────────────────────────────────────────
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: LIMIT,
        ...(search   && { search }),
        ...(category !== 'all' && { category }),
        ...(sort     && { sort }),
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

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // Reset ke page 1 saat filter berubah
  const handleSearch   = (val) => { setSearch(val);   setPage(1); };
  const handleCategory = (val) => { setCategory(val); setPage(1); };
  const handleSort     = (val) => { setSort(val);     setPage(1); };

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

  // ── Table columns definition ──────────────────────────────
  const columns = [
    {
      key: 'nameInventory',
      header: 'Nama Item',
      headerClass: 'w-[40%]',
      render: (row) => (
        <div className="flex items-center gap-3">
          <CategoryIcon category={row.category} />
          <span className="font-medium text-foreground text-sm">{row.nameInventory}</span>
        </div>
      ),
    },
    {
      key: 'quantityTotal',
      header: 'Jumlah',
      headerClass: 'w-[15%]',
      cellClass: 'font-mono text-sm',
      render: (row) => (
        // quantityTotal: null = belum ada batch, tampilkan "—" (em-dash), warna muted
        <span className={row.quantityTotal === null ? 'text-muted-foreground' : ''}>
          {formatQuantity(row.quantityTotal, row.unit)}
        </span>
      ),
    },
    {
      key: 'lastCostBatch',
      header: 'Harga per Unit',
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
      header: 'Kategori',
      headerClass: 'w-[15%]',
      render: (row) => <StatusBadge variant={row.category} />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      headerClass: 'w-[10%] text-right',
      cellClass: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            id={`inventory-detail-${row._id}`}
            variant="link"
            size="sm"
            className="text-primary hover:text-primary/80 px-0 h-auto font-medium"
            onClick={() => navigate(`/admin/inventory/${row._id}`)}
          >
            Detail
          </Button>
          <Button
            id={`inventory-archive-${row._id}`}
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => setArchiveTarget(row)}
            aria-label={`Arsip ${row.nameInventory}`}
          >
            <Archive size={14} strokeWidth={2} />
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
        subtitle="Kelola bahan dan kemasan, pantau stok secara real-time."
        action={
          <Button
            id="add-inventory-btn"
            onClick={() => setShowAddDialog(true)}
            className="gap-2"
          >
            <Plus size={16} strokeWidth={2} />
            Add Item
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <SearchInput
          id="inventory-search"
          placeholder="Search by item name..."
          value={search}
          onChange={handleSearch}
          className="w-64"
        />

        {/* Category filter */}
        <div className="relative">
          <select
            id="inventory-category-filter"
            value={category}
            onChange={(e) => handleCategory(e.target.value)}
            className="h-9 appearance-none pl-3 pr-8 rounded-lg border border-input bg-transparent text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors cursor-pointer dark:bg-input/30"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            id="inventory-sort-filter"
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="h-9 appearance-none pl-3 pr-8 rounded-lg border border-input bg-transparent text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors cursor-pointer dark:bg-input/30"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <DataTable
          columns={columns}
          data={inventoryList}
          loading={loading}
          emptyMessage="Belum ada inventory. Klik '+ Add Item' untuk menambahkan item pertama."
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

      {/* ── Dialogs ─────────────────────────────────────── */}

      {/* Add Inventory */}
      <AddInventoryDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={fetchInventory}
      />

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
