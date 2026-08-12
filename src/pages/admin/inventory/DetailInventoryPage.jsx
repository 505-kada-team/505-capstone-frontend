import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TriangleAlert, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import AddBatchModal from "./components/AddBatchModal";

import { useInventoryDetail } from "@/hooks/inventory/useInventoryDetail";
import { useInventoryMutations } from "@/hooks/inventory/useInventoryMutations";
import { useBatchMutations } from "@/hooks/inventory/useBatchMutations";
import { updateInventorySchema } from "@/schemas/inventorySchema";

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

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
  const uMap = { gr: "gr", ml: "ml", pcs: "pcs" };
  return `${quantity.toLocaleString("id-ID")} ${uMap[unit] ?? unit}`;
};

// row.inDate / row.expired sudah Date object hasil mapBatch() — format
// langsung, gak perlu `new Date(...)` lagi.
const formatDate = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export default function DetailInventoryPage() {
  const { id: inventoryId } = useParams();
  const navigate = useNavigate();

  const {
    inventory: data,
    isLoading: loading,
    error: detailError,
    fetchInventoryDetail,
    refetch,
  } = useInventoryDetail();

  const {
    updateInventory,
    isUpdating: submittingEdit,
    updateError,
    resetUpdateError,
    archiveInventory,
    isArchiving: archivingItem,
    archiveError,
    resetArchiveError,
  } = useInventoryMutations();

  const {
    archiveBatch,
    isArchivingBatch: deletingBatch,
    archiveBatchError,
    resetArchiveBatchError,
  } = useBatchMutations();

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [deleteBatchTarget, setDeleteBatchTarget] = useState(null);
  const [archiveItemTarget, setArchiveItemTarget] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateInventorySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (inventoryId) fetchInventoryDetail(inventoryId);
  }, [inventoryId, fetchInventoryDetail]);

  useEffect(() => {
    if (data) {
      reset({ name: data.name, description: data.description || "" });
    }
  }, [data, reset]);

  const error = detailError || updateError || archiveError || archiveBatchError;

  const handleEditSubmit = async (formData) => {
    if (!data) return;
    try {
      await updateInventory(inventoryId, formData);
      refetch();
    } catch {
      // updateError sudah di-set di dalam hook
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteBatchTarget) return;
    try {
      await archiveBatch(deleteBatchTarget.id);
      setDeleteBatchTarget(null);
      refetch();
    } catch {
      // archiveBatchError sudah di-set di dalam hook
    }
  };

  const handleArchiveItem = async () => {
    try {
      await archiveInventory(inventoryId);
      navigate("/admin/inventory", { replace: true });
    } catch {
      // archiveError sudah di-set di dalam hook
    } finally {
      setArchiveItemTarget(false);
    }
  };

  const columns = [
    {
      key: "inDate",
      header: "Diterima",
      cellClass: "font-mono text-xs",
      render: (row) => formatDate(row.inDate),
    },
    {
      key: "costPrices",
      header: "Harga per Unit",
      cellClass: "font-mono text-sm",
      render: (row) => formatCurrency(row.costPrices),
    },
    {
      key: "quantity",
      header: "Jumlah",
      cellClass: "font-mono text-sm",
      render: (row) => formatQuantity(row.quantity, data?.unit),
    },
    {
      key: "expired",
      header: "Kadaluarsa",
      cellClass: "font-mono text-xs",
      render: (row) =>
        data?.category === "packaging" ? "—" : formatDate(row.expired),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge variant={row.status} />,
    },
    {
      key: "aksi",
      header: "Aksi",
      headerClass: "text-right",
      cellClass: "text-right",
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
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="link"
          size="lg"
          onClick={() => navigate("/admin/inventory")}
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
        <h3 className="font-heading text-lg font-bold">
          Inventory Item Detail
        </h3>
      </div>

      {loading && !data ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-lg border border-border">
          Memuat data...
        </div>
      ) : data ? (
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 space-y-1.5">
                <Label
                  htmlFor="edit-name"
                  className="text-sm text-muted-foreground font-normal"
                >
                  Item Name
                </Label>
                <Input
                  id="edit-name"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  className="bg-transparent border-border"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="col-span-4 space-y-1.5">
                <Label className="text-sm text-muted-foreground font-normal">
                  Category
                </Label>
                <Input
                  value={
                    data.category === "packaging" ? "Packaging" : "Ingredient"
                  }
                  disabled
                  className="bg-muted text-muted-foreground border-border"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm text-muted-foreground font-normal">
                  Unit
                </Label>
                <Input
                  value={data.unit}
                  disabled
                  className="bg-muted text-muted-foreground border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="edit-desc"
                className="text-sm text-muted-foreground font-normal"
              >
                Description
              </Label>
              <Textarea
                id="edit-desc"
                {...register("description")}
                rows={3}
                className="bg-transparent border-border resize-none"
              />
            </div>

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
                  {submittingEdit ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-12 space-y-3">
            <h3 className="font-heading text-lg font-bold">
              Inventory Batches
            </h3>
            <div className="rounded-lg border border-border shadow-sm overflow-hidden bg-background">
              <DataTable
                columns={columns}
                data={data.batches || []}
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
        onSuccess={refetch}
      />

      <ConfirmDialog
        open={!!deleteBatchTarget}
        onClose={() => {
          setDeleteBatchTarget(null);
          resetArchiveBatchError();
        }}
        onConfirm={handleDeleteBatch}
        title="Delete Batch?"
        description="This batch will be archived. Are you sure?"
        confirmLabel="Delete"
        loading={deletingBatch}
      />

      <ConfirmDialog
        open={archiveItemTarget}
        onClose={() => {
          setArchiveItemTarget(false);
          resetArchiveError();
        }}
        onConfirm={handleArchiveItem}
        title="Archive Item?"
        description={`Item "${data?.name}" will be archived permanently. Ensure stock is 0.`}
        confirmLabel="Archive"
        loading={archivingItem}
      />
    </div>
  );
}
