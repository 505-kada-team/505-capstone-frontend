import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, TriangleAlert } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import AddBatchModal from './AddBatchModal';

import { getInventoryDetail, updateInventory, archiveSubInventory, archiveInventory } from '@/services/api';
import { updateInventorySchema } from '@/schemas/inventorySchema';

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

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
  const uMap = { gr: 'gr', ml: 'ml', pcs: 'pcs' };
  return `${quantity.toLocaleString('id-ID')} ${uMap[unit] ?? unit}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateString;
  }
};

export default function DetailInventoryModal({ open, onClose, inventoryId, onSuccess }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [submittingEdit, setSubmittingEdit] = useState(false);
  
  const [showAddBatch, setShowAddBatch] = useState(false);
  
  const [deleteBatchTarget, setDeleteBatchTarget] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(false);

  const [archiveItemTarget, setArchiveItemTarget] = useState(false);
  const [archivingItem, setArchivingItem] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateInventorySchema),
    defaultValues: { nameInventory: '', description: '' },
  });

  const fetchData = useCallback(async () => {
    if (!inventoryId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getInventoryDetail(inventoryId);
      const inventory = res.data.data;
      setData(inventory);
      reset({
        nameInventory: inventory.nameInventory,
        description: inventory.description || '',
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat detail inventory.');
    } finally {
      setLoading(false);
    }
  }, [inventoryId, reset]);

  useEffect(() => {
    if (open && inventoryId) {
      // eslint-disable-next-line
      fetchData();
    } else {
      setData(null);
      setError('');
    }
  }, [open, inventoryId, fetchData]);

  const handleEditSubmit = async (formData) => {
    if (!data) return;
    setSubmittingEdit(true);
    setError('');
    try {
      await updateInventory(inventoryId, formData);
      onSuccess?.();
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memperbarui inventory.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteBatchTarget) return;
    setDeletingBatch(true);
    try {
      await archiveSubInventory(deleteBatchTarget._id, {
        deletedBy: 'Admin', // default
        reason: 'Dihapus manual dari form detail',
      });
      setDeleteBatchTarget(null);
      fetchData();
      onSuccess?.(); // update main table too
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus batch.');
    } finally {
      setDeletingBatch(false);
    }
  };

  const handleArchiveItem = async () => {
    setArchivingItem(true);
    try {
      await archiveInventory(inventoryId);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Gagal mengarsipkan item.');
    } finally {
      setArchivingItem(false);
      setArchiveItemTarget(false);
    }
  };

  const columns = [
    {
      key: 'inDate',
      header: 'Diterima',
      cellClass: 'font-mono text-xs',
      render: (row) => formatDate(row.inDate),
    },
    {
      key: 'createdAt',
      header: 'Dibuat',
      cellClass: 'font-mono text-xs text-muted-foreground',
      render: (row) => formatDate(row.createdAt || row.inDate),
    },
    {
      key: 'costPrices',
      header: 'Harga per Unit',
      cellClass: 'font-mono text-sm',
      render: (row) => formatCurrency(row.costPrices),
    },
    {
      key: 'quantity',
      header: 'Jumlah',
      cellClass: 'font-mono text-sm',
      render: (row) => formatQuantity(row.quantity, data?.unit),
    },
    {
      key: 'expired',
      header: 'Kadaluarsa',
      cellClass: 'font-mono text-xs',
      render: (row) => data?.category === 'packaging' ? '—' : formatDate(row.expired),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge variant={row.status} />,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      headerClass: 'text-right',
      cellClass: 'text-right',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2 font-medium"
          onClick={() => setDeleteBatchTarget(row)}
        >
          Hapus
        </Button>
      ),
    }
  ];

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-[#FDFBF9] dark:bg-[#121212]" id="detail-inventory-dialog">
        {/* Header - simple per design */}
        <div className="flex justify-between items-center p-6 pb-2">
          <DialogTitle className="font-heading text-2xl font-bold">Detail Inventory Item</DialogTitle>
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
            <TriangleAlert size={15} className="text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {loading && !data ? (
          <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
        ) : data ? (
          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-6">
              
              {/* Top Form Section */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 space-y-1.5">
                  <Label htmlFor="edit-name" className="text-sm text-muted-foreground font-normal">
                    Nama Item
                  </Label>
                  <Input
                    id="edit-name"
                    {...register('nameInventory')}
                    aria-invalid={!!errors.nameInventory}
                    className="bg-transparent border-border"
                  />
                  {errors.nameInventory && <p className="text-xs text-destructive">{errors.nameInventory.message}</p>}
                </div>
                
                <div className="col-span-4 space-y-1.5">
                  <Label className="text-sm text-muted-foreground font-normal">Kategori</Label>
                  <Input
                    value={data.category === 'packaging' ? 'Packaging' : 'Ingredient'}
                    disabled
                    className="bg-muted text-muted-foreground border-border"
                  />
                </div>
                
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-sm text-muted-foreground font-normal">Unit</Label>
                  <Input
                    value={data.unit}
                    disabled
                    className="bg-muted text-muted-foreground border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-desc" className="text-sm text-muted-foreground font-normal">Deskripsi</Label>
                <Textarea
                  id="edit-desc"
                  {...register('description')}
                  rows={3}
                  className="bg-transparent border-border resize-none"
                />
              </div>

              {/* Action Buttons for Form */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddBatch(true)}
                  className="gap-2"
                >
                  <Plus size={16} /> Tambah Item
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || submittingEdit}
                  className="bg-[#F97316] text-white hover:bg-[#F97316]/90" // brand orange
                >
                  {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>

            </form>

            {/* Batch Table Section */}
            <div className="mt-8 space-y-3">
              <h3 className="font-heading text-lg font-bold">Batch Inventori</h3>
              <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <DataTable
                  columns={columns}
                  data={data.subInventories || []}
                  loading={false}
                  emptyMessage="Belum ada batch inventori untuk item ini."
                />
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="flex justify-between gap-3 pt-6 mt-6 border-t border-border">
               <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setArchiveItemTarget(true)}>
                 Arsipkan Item
               </Button>
               <Button variant="outline" onClick={onClose}>
                 Tutup
               </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>

      <AddBatchModal
        open={showAddBatch}
        onClose={() => setShowAddBatch(false)}
        parentInventory={data}
        onSuccess={() => {
          fetchData();
          onSuccess?.(); // bubble up
        }}
      />

      <ConfirmDialog
        open={!!deleteBatchTarget}
        onClose={() => setDeleteBatchTarget(null)}
        onConfirm={handleDeleteBatch}
        title="Hapus Batch?"
        description="Batch ini akan diarsipkan. Anda yakin?"
        confirmLabel="Hapus"
        loading={deletingBatch}
      />

      <ConfirmDialog
        open={archiveItemTarget}
        onClose={() => setArchiveItemTarget(false)}
        onConfirm={handleArchiveItem}
        title="Arsipkan Item?"
        description={`Item "${data?.nameInventory}" akan diarsipkan secara permanen. Pastikan stok sudah 0.`}
        confirmLabel="Ya, Arsipkan"
        loading={archivingItem}
      />
    </Dialog>
  );
}
