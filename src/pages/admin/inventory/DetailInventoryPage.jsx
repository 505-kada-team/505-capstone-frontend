import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, TriangleAlert, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
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

  // --- Batches filtering & sorting ---
  const [batchSearch, setBatchSearch] = useState("");
  const [batchStatus, setBatchStatus] = useState("all");
  const [batchSort, setBatchSort] = useState("newest");
  const [batchPage, setBatchPage] = useState(1);
  const batchLimit = 10;

  const processedBatches = useMemo(() => {
    if (!data?.batches) return [];
    let result = [...data.batches];

    // 1. Search filter by batchCode
    if (batchSearch.trim()) {
      const query = batchSearch.toLowerCase();
      result = result.filter(
        (b) => b.batchCode && b.batchCode.toLowerCase().includes(query)
      );
    }

    // 2. Status filter
    if (batchStatus !== "all") {
      result = result.filter((b) => b.status === batchStatus);
    }

    // 3. Sorting logic
    switch (batchSort) {
      case "Oldest":
        result.sort((a, b) => new Date(a.inDate) - new Date(b.inDate));
        break;
      case "Expiry Soon":
        result.sort((a, b) => {
          if (!a.expired) return 1;
          if (!b.expired) return -1;
          return new Date(a.expired) - new Date(b.expired);
        });
        break;
      case "Expiry Late":
        result.sort((a, b) => {
          if (!a.expired) return 1;
          if (!b.expired) return -1;
          return new Date(b.expired) - new Date(a.expired);
        });
        break;
      case "Quantity High":
        result.sort((a, b) => b.quantity - a.quantity);
        break;
      case "Quantity Low":
        result.sort((a, b) => a.quantity - b.quantity);
        break;
      case "Newest":
      default:
        result.sort((a, b) => new Date(b.inDate) - new Date(a.inDate));
        break;
    }

    return result;
  }, [data, batchSearch, batchStatus, batchSort]);

  const paginatedBatches = useMemo(() => {
    const start = (batchPage - 1) * batchLimit;
    return processedBatches.slice(start, start + batchLimit);
  }, [processedBatches, batchPage]);

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
      header: "Received",
      headerClass: "min-w-[120px]",
      cellClass: "font-mono text-xs",
      render: (row) => formatDate(row.inDate),
    },
    {
      key: "batchCode",
      header: "Batch Code",
      headerClass: "min-w-[130px]",
      cellClass: "font-mono text-xs text-muted-foreground",
      render: (row) => row.batchCode || "—",
    },
    {
      key: "costPrices",
      header: "Total Cost",
      headerClass: "min-w-[120px]",
      cellClass: "font-mono text-sm",
      render: (row) => formatCurrency(row.costPrices),
    },
    {
      key: "quantity",
      header: "Quantity",
      headerClass: "min-w-[110px]",
      cellClass: "font-mono text-sm",
      render: (row) => formatQuantity(row.quantity, data?.unit),
    },
    {
      key: "expired",
      header: "Expired",
      headerClass: "min-w-[120px]",
      cellClass: "font-mono text-xs",
      render: (row) =>
        data?.category === "packaging" ? "—" : formatDate(row.expired),
    },
    {
      key: "status",
      header: "Status",
      headerClass: "min-w-[100px]",
      render: (row) => <StatusBadge variant={row.status} />,
    },
    {
      key: "aksi",
      header: "Action",
      headerClass: "min-w-[85px] text-right sticky right-0 z-10 bg-background",
      cellClass: "text-right sticky right-0 z-10 bg-background",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2 font-medium"
          onClick={() => setDeleteBatchTarget(row)}
        >
          Delete
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
          Loading...
        </div>
      ) : data ? (
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5 space-y-1.5">
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

              <div className="col-span-3 space-y-1.5">
                <Label className="text-sm text-muted-foreground font-normal">
                  Item Code
                </Label>
                <Input
                  value={data.itemCode || "—"}
                  disabled
                  className="bg-muted text-muted-foreground border-border font-mono"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
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
                Delete Inventory
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

            {/* Batches Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <SearchInput
                id="batch-search"
                placeholder="Search by batch code..."
                value={batchSearch}
                onChange={(val) => {
                  setBatchSearch(val);
                  setBatchPage(1);
                }}
                className="w-full md:flex-[3] md:min-w-0 h-9"
              />

              <div className="flex flex-nowrap items-center gap-2 w-full md:w-auto md:flex-[4] md:min-w-0">
                <Select 
                  value={batchStatus} 
                  onValueChange={(val) => {
                    setBatchStatus(val);
                    setBatchPage(1);
                  }}
                >
                  <SelectTrigger
                    id="batch-status-filter"
                    className="flex-[3] min-w-0 md:w-[130px] md:flex-none h-9 text-muted-foreground font-normal text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="depleted">Depleted</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={batchSort} 
                  onValueChange={(val) => {
                    setBatchSort(val);
                    setBatchPage(1);
                  }}
                >
                  <SelectTrigger className="flex-[4] min-w-0 md:w-[130px] md:flex-none h-9 text-muted-foreground font-normal text-xs">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Newest">Newest Received</SelectItem>
                    <SelectItem value="Oldest">Oldest Received</SelectItem>
                    <SelectItem value="Expiry Soon">Expiry Soonest</SelectItem>
                    <SelectItem value="Expiry Late">Expiry Latest</SelectItem>
                    <SelectItem value="Quantity High">Highest Quantity</SelectItem>
                    <SelectItem value="Quantity Low">Lowest Quantity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border shadow-sm overflow-hidden bg-background">
              <DataTable
                columns={columns}
                data={paginatedBatches}
                loading={false}
                emptyMessage="No inventory batches found matching the filters."
              />
            </div>
            
            {processedBatches.length > 0 && (
              <Pagination
                currentPage={batchPage}
                totalPage={Math.ceil(processedBatches.length / batchLimit)}
                totalData={processedBatches.length}
                limit={batchLimit}
                onPageChange={setBatchPage}
              />
            )}
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
        description="This batch will be deleted. Are you sure?"
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
        title="Delete Inventory?"
        description={`Item "${data?.name}" will be deleted permanently. Ensure stock is 0.`}
        confirmLabel="Delete"
        loading={archivingItem}
      />
    </div>
  );
}