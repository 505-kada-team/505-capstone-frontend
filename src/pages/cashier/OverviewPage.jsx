import { useEffect, useMemo, useState } from "react";

import DataTable from "@/components/shared/DataTable";
import PageHeader from "@/components/shared/PageHeader";
import SearchInput from "@/components/shared/SearchInput";
import SortDropdown from "@/components/shared/SortDropdown";
import WarningBanner from "@/components/shared/WarningBanner";
import Pagination from "@/components/shared/Pagination";
import Modal from "@/components/shared/Modal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePagination } from "@/hooks/usePagination";
import { getActivePlans } from "@/services/cashierApi";

// GET TODAY EVENT WARNINGS
const getPlanEvents = (plan) => {
  if (!plan) return [];

  const events = [];
  const today = new Date().toDateString();

  if (plan.startDate && new Date(plan.startDate).toDateString() === today) {
    events.push(`Plan "${plan.name}" starts today`);
  }

  if (plan.endDate && new Date(plan.endDate).toDateString() === today) {
    events.push(`Plan "${plan.name}" ends today`);
  }

  if (plan.warning) {
    events.push(plan.warning);
  }

  plan.menus?.forEach((menu) => {
    if (menu.isDiscounted && menu.discountPercentage && menu.discountEndsAt) {
      const discountEnd = new Date(menu.discountEndsAt);
      const now = new Date();

      const remainingDays = Math.max(
        0,
        Math.ceil((discountEnd - now) / (1000 * 60 * 60 * 24)),
      );

      const durationText =
        remainingDays === 0
          ? "ends today"
          : `${remainingDays} days remaining`;

      events.push(
        `${menu.discountPercentage}% discount is active for ${menu.name} — ${durationText}`,
      );
    }
  });

  return events;
};

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "expiry-asc", label: "Nearest Expiry" },
  { value: "expiry-desc", label: "Farthest Expiry" },
];

const PAGE_SIZE = 6;

const formatDate = (isoDate) => {
  if (!isoDate) return "-";

  return new Date(isoDate).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const STATUS_BADGE_CLASS = {
  safe: "bg-secondary text-primary",
  "not-safe": "bg-warning/10 text-warning",
};

const batchColumns = [
  { key: "batchCode", header: "Batch Code", cellClass: "font-mono" },
  {
    key: "quantityRemaining",
    header: "Quantity Remaining",
    cellClass: "font-mono",
    render: (row) => `${row.quantityRemaining ?? 0} ${row.unit ?? ""}`,
  },
  {
    key: "expired",
    header: "Expiry",
    render: (row) => formatDate(row.expired),
  },
  {
    key: "batchSafetyStatus",
    header: "Status",
    render: (row) => {
      const status = row.batchSafetyStatus === "safe" ? "safe" : "not-safe";

      return (
        <Badge
          className={cn(
            "rounded-full border-0 font-normal capitalize",
            STATUS_BADGE_CLASS[status],
          )}
        >
          {status === "safe" ? "Safe" : "Not Safe"}
        </Badge>
      );
    },
  },
];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayEvents, setTodayEvents] = useState([]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const activePlans = await getActivePlans();
        const activePlan = activePlans?.[0];

        if (!activePlan) {
          setItems([]);
          setTodayEvents([]);
          return;
        }

        const ingredientMap = new Map();

        activePlan.menus?.forEach((menu) => {
          menu.ingredientsDetail?.forEach((ingredient) => {
            const existing = ingredientMap.get(ingredient.inventoryId);

            if (existing) {
              existing.quantityNeeded += Number(ingredient.quantityNeeded ?? 0);
              existing.quantityAvailable = Number(
                ingredient.quantityAvailable ?? existing.quantityAvailable,
              );
              existing.hasUnsafeBatch =
                existing.hasUnsafeBatch || ingredient.hasUnsafeBatch;
              existing.nearestExpiry =
                existing.nearestExpiry && ingredient.nearestExpiry
                  ? new Date(existing.nearestExpiry) <
                    new Date(ingredient.nearestExpiry)
                    ? existing.nearestExpiry
                    : ingredient.nearestExpiry
                  : existing.nearestExpiry ?? ingredient.nearestExpiry;
            } else {
              ingredientMap.set(ingredient.inventoryId, {
                ...ingredient,
                quantityNeeded: Number(ingredient.quantityNeeded ?? 0),
                quantityAvailable: Number(ingredient.quantityAvailable ?? 0),
                batches: (activePlan.committedBatchesQueue ?? []).filter(
                  (batch) => batch.inventoryId === ingredient.inventoryId,
                ),
              });
            }
          });
        });

        setItems(Array.from(ingredientMap.values()));
        setTodayEvents(getPlanEvents(activePlan));
      } catch (error) {
        console.error("[PLAN INVENTORY ERROR]", error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.nameInventory?.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];

    switch (sortBy) {
      case "name-desc":
        sorted.sort((a, b) =>
          (b.nameInventory ?? "").localeCompare(a.nameInventory ?? ""),
        );
        break;

      case "expiry-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.nearestExpiry ?? 0) - new Date(b.nearestExpiry ?? 0),
        );
        break;

      case "expiry-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.nearestExpiry ?? 0) - new Date(a.nearestExpiry ?? 0),
        );
        break;

      case "name-asc":
      default:
        sorted.sort((a, b) =>
          (a.nameInventory ?? "").localeCompare(b.nameInventory ?? ""),
        );
    }

    return sorted;
  }, [filteredItems, sortBy]);

  const { currentPage, totalPages, paginatedItems, setPage, resetPage } =
    usePagination(sortedItems, PAGE_SIZE);

  const handleViewDetail = (inventoryId) => {
    const item = items.find((item) => item.inventoryId === inventoryId) ?? null;

    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const columns = [
    { key: "nameInventory", header: "Item Name" },
    {
      key: "quantityNeeded",
      header: "Plan Requirement",
      cellClass: "font-mono",
      render: (row) => `${row.quantityNeeded ?? 0} ${row.unit ?? ""}`,
    },
    {
      key: "quantityAvailable",
      header: "Remaining Stock",
      cellClass: "font-mono",
      render: (row) => `${row.quantityAvailable ?? 0} ${row.unit ?? ""}`,
    },
    {
      key: "nearestExpiry",
      header: "Nearest Expiry",
      render: (row) => formatDate(row.nearestExpiry),
    },
    {
      key: "status",
      header: "Stock Status",
      render: (row) => {
        const status = row.hasUnsafeBatch ? "not-safe" : "safe";

        return (
          <Badge className={cn("rounded-full border-0 font-normal capitalize", STATUS_BADGE_CLASS[status])}>
            {status === "safe" ? "Safe" : "Not Safe"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      headerClass: "text-center",
      cellClass: "text-center",
      render: (row) => (
        <button
          type="button"
          onClick={() => handleViewDetail(row.inventoryId)}
          className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        >
          Detail
        </button>
      ),
    },
  ];

if (isLoading) return <div className="flex h-full items-center justify-center">Loading inventory...</div>;

if (error && items.length === 0) {
  return <div className="flex h-full items-center justify-center">Failed to load inventory.</div>;
}

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="shrink-0">
        <PageHeader
          title="Inventory Overview"
          action={
            <div className="flex items-center gap-2">
              <SearchInput
                placeholder="Search inventory..."
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  resetPage();
                }}
                className="w-64"
              />

              <SortDropdown
                options={SORT_OPTIONS}
                value={sortBy}
                defaultValue="name-asc"
                onChange={(value) => {
                  setSortBy(value);
                  resetPage();
                }}
              />
            </div>
          }
        />
      </div>

      <div className="shrink-0">
        <WarningBanner
          title="Today Event !!"
          messages={
            todayEvents.length > 0
              ? todayEvents
              : ["No events for today."]
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DataTable
            columns={columns}
            data={paginatedItems}
            emptyMessage="No inventory available from an active plan."
          />
        </div>

        <div className="shrink-0 border-t border-neutral-200 bg-muted/30 px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPage={totalPages}
            totalData={sortedItems.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        title="Detail Inventory"
        className="max-w-3xl sm:max-w-3xl"
      >
        {selectedItem && (
          <>
            <div className="space-y-1.5 px-6 py-4 text-sm">
              <div className="flex gap-2">
                <span className="w-40 shrink-0 text-muted-foreground">Item Name</span>
                <span className="text-foreground">: {selectedItem.nameInventory}</span>
              </div>

              <div className="flex gap-2">
                <span className="w-40 shrink-0 text-muted-foreground">Unit</span>
                <span className="text-foreground">: {selectedItem.unit ?? "-"}</span>
              </div>

              <div className="flex gap-2">
                <span className="w-40 shrink-0 text-muted-foreground">Plan Requirement</span>
                <span className="text-foreground">: {selectedItem.quantityNeeded ?? 0} {selectedItem.unit ?? ""}</span>
              </div>

              <div className="flex gap-2">
                <span className="w-40 shrink-0 text-muted-foreground">Remaining Stock</span>
                <span className="text-foreground">: {selectedItem.quantityAvailable ?? 0} {selectedItem.unit ?? ""}</span>
              </div>

              <div className="flex gap-2">
                <span className="w-40 shrink-0 text-muted-foreground">Nearest Expiry</span>
                <span className="text-foreground">: {formatDate(selectedItem.nearestExpiry)}</span>
              </div>
            </div>

            <div className="border-t border-neutral-200">
              <DataTable
                columns={batchColumns}
                data={selectedItem.batches ?? []}
                emptyMessage="No committed batch available."
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}