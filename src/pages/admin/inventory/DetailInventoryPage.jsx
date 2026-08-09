import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, TriangleAlert, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import AddBatchModal from './components/AddBatchModal';

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

export default function DetailInventoryPage() {
  const { id: inventoryId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    // eslint-disable-next-line
    fetchData();
  }, [fetchData]);

  const handleEditSubmit = async (formData) => {
    if (!data) return;
    setSubmittingEdit(true);
    setError('');
    try {
      await updateInventory(inventoryId, formData);
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
      navigate('/admin/inventory', { replace: true });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="link" 
          size="lg" 
          onClick={() => navigate('/admin/inventory')}
          className="text-[#F97316] hover:text-[#F97316]/80 shrink-0"
        >
          <ArrowLeft size={18} /> Back
        </Button>
        
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
          <TriangleAlert size={15} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div>
          <h3 className="font-heading text-lg font-bold">Inventory Item Detail</h3>
        </div>

      {loading && !data ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-lg border border-border">Memuat data...</div>
      ) : data ? (
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-6">
            
            {/* Top Form Section */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 space-y-1.5">
                <Label htmlFor="edit-name" className="text-sm text-muted-foreground font-normal">
                  Item Name
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
                <Label className="text-sm text-muted-foreground font-normal">Category</Label>
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
              <Label htmlFor="edit-desc" className="text-sm text-muted-foreground font-normal">Description</Label>
              <Textarea
                id="edit-desc"
                {...register('description')}
                rows={3}
                className="bg-transparent border-border resize-none"
              />
            </div>

            {/* Action Buttons for Form */}
            <div className="flex justify-between items-center pt-2">
              <Button 
                type="button"
                variant="outline" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9" 
                onClick={() => setArchiveItemTarget(true)}
              >
                Archive Item
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddBatch(true)}
                  className="gap-2"
                >
                  <Plus size={16} /> Add Batch
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || submittingEdit}
                  className="bg-[#F97316] text-white hover:bg-[#F97316]/90" // brand orange
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

          </form>

          {/* Batch Table Section */}
          <div className="mt-12 space-y-3">
            <h3 className="font-heading text-lg font-bold">Inventory Batches</h3>
            <div className="rounded-lg border border-border shadow-sm overflow-hidden bg-background">
              <DataTable
                columns={columns}
                data={data.subInventories || []}
                loading={false}
                emptyMessage="No inventory batches found for this item."
              />
            </div>
          </div>

        </div>
      ) : null}

      <AddBatchModal
        open={showAddBatch}
        onClose={() => setShowAddBatch(false)}
        parentInventory={data}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        open={!!deleteBatchTarget}
        onClose={() => setDeleteBatchTarget(null)}
        onConfirm={handleDeleteBatch}
        title="Delete Batch?"
        description="This batch will be archived. Are you sure?"
        confirmLabel="Delete"
        loading={deletingBatch}
      />

      <ConfirmDialog
        open={archiveItemTarget}
        onClose={() => setArchiveItemTarget(false)}
        onConfirm={handleArchiveItem}
        title="Archive Item?"
        description={`Item "${data?.nameInventory}" will be archived permanently. Ensure stock is 0.`}
        confirmLabel="Archive"
        loading={archivingItem}
      />
    </div>
  );
}
