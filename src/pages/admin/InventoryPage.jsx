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
import {
  Plus,
  Wheat,
  Package,
  Archive,
  TriangleAlert,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Shared components
import PageHeader    from '@/components/shared/PageHeader';
import DataTable     from '@/components/shared/DataTable';
import StatusBadge   from '@/components/shared/StatusBadge';
import Pagination    from '@/components/shared/Pagination';
import SearchInput   from '@/components/shared/SearchInput';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import FormSelect    from '@/components/shared/FormSelect';

// shadcn UI
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Services & schemas
import {
  getInventoryList,
  createInventory,
  archiveInventory,
} from '@/services/api';
import { createInventorySchema } from '@/schemas/inventorySchema';

// ============================================================
// Constants — opsi filter dan form
// ============================================================
const LIMIT = 10;

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all',         label: 'All Categories' },
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'packaging',   label: 'Packaging' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Sort: Latest' },
  { value: 'oldest', label: 'Sort: Oldest' },
  { value: 'name',   label: 'Sort: Name A–Z' },
  { value: 'stock',  label: 'Sort: Stok ↓' },
];

// Opsi khusus untuk FORM (tanpa "all" karena harus memilih satu)
const CATEGORY_FORM_OPTIONS = [
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'packaging',   label: 'Packaging' },
];

const UNIT_OPTIONS = [
  { value: 'gr',  label: 'gr (gram)' },
  { value: 'ml',  label: 'ml (mililiter)' },
  { value: 'pcs', label: 'pcs (pieces)' },
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

/** Icon per kategori — lucide, 32px wrapper */
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
// Dipisah agar form state tidak bercampur dengan page state.
// Semua input pakai shadcn — Input (teks), FormSelect (dropdown),
// dan textarea (belum ada komponen shadcn, styling manual konsisten).
// ============================================================
function AddInventoryDialog({ open, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createInventorySchema),
    defaultValues: { nameInventory: '', category: '', unit: '', description: '' },
  });

  // Reset form & error saat dialog ditutup
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
          {/* nameInventory — shadcn Input */}
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

          {/* category — FormSelect (shadcn Select + Label + error, 1 komponen) */}
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormSelect
                id="inv-category"
                label="Kategori"
                required
                placeholder="Pilih kategori"
                value={field.value}
                onValueChange={field.onChange}
                options={CATEGORY_FORM_OPTIONS}
                error={errors.category?.message}
              />
            )}
          />

          {/* unit — FormSelect */}
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <FormSelect
                id="inv-unit"
                label="Satuan Unit"
                required
                placeholder="Pilih satuan"
                value={field.value}
                onValueChange={field.onChange}
                options={UNIT_OPTIONS}
                error={errors.unit?.message}
              />
            )}
          />

          {/* description — textarea (shadcn belum punya Textarea di stack ini,
              styling manual diselaraskan ke token yang sama dengan Input) */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-description" className="text-sm font-medium">
              Deskripsi{' '}
              <span className="text-muted-foreground font-normal">(opsional)</span>
            </Label>
            <textarea
              id="inv-description"
              placeholder="Deskripsi singkat atau catatan khusus tentang item ini..."
              rows={3}
              {...register('description')}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors resize-none dark:bg-input/30"
            />
          </div>

          {/* Server error — global inline, terikat ke seluruh form bukan 1 field */}
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
  const [sort,     setSort]     = useState('latest');
  const [page,     setPage]     = useState(1);

  // ── Dialog state ──────────────────────────────────────────
  const [showAddDialog,  setShowAddDialog]  = useState(false);
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

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // Reset page ke 1 setiap kali filter berubah
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

  // ── Table column definitions ──────────────────────────────
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

      {/* Filter Bar — semua shadcn Select, tidak ada native <select> */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Search */}
        <SearchInput
          id="inventory-search"
          placeholder="Search by item name..."
          value={search}
          onChange={handleSearch}
          className="w-64"
        />

        {/* Category filter — shadcn Select */}
        <Select value={category} onValueChange={handleCategory}>
          <SelectTrigger
            id="inventory-category-filter"
            className="w-auto gap-2 h-9"
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

        {/* Sort filter — shadcn Select */}
        <Select value={sort} onValueChange={handleSort}>
          <SelectTrigger
            id="inventory-sort-filter"
            className="w-auto gap-2 h-9"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
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

      {/* ── Dialogs ──────────────────────────────────────── */}

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
