import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import { formatCurrency } from '@/lib/formatCurrency';
import { inventoryApi } from '@/services/inventory/inventory.api';

export default function InventoryReport({ startDate = '', endDate = '' }) {
  const [purchases, setPurchases] = useState([]);
  const [usages, setUsages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  let isActive = true;

  const fetchReport = async () => {
    setIsLoading(true);

    try {
      const params = {
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      const [purchaseRes, usageRes] = await Promise.all([
        inventoryApi.historySubInventory(params),
        inventoryApi.historyUsage(params),
      ]);

      console.log('[INVENTORY PURCHASE HISTORY]', purchaseRes);
      console.log('[INVENTORY USAGE HISTORY]', usageRes);

      if (!isActive) return;

     setPurchases(
        purchaseRes?.success && Array.isArray(purchaseRes.data?.items)
            ? purchaseRes.data.items
            : [],
        );

        setUsages(
        usageRes?.success && Array.isArray(usageRes.data?.items)
            ? usageRes.data.items
            : [],
        );
    } catch (error) {
      console.error('[INVENTORY REPORT ERROR]', error);
      console.error('[INVENTORY REPORT RESPONSE]', error.response?.data);

      if (isActive) {
        setPurchases([]);
        setUsages([]);

        toast.error(
          error.response?.data?.message ??
            'Failed to load inventory report',
        );
      }
    } finally {
      if (isActive) setIsLoading(false);
    }
  };

  fetchReport();

  return () => {
    isActive = false;
  };
}, [startDate, endDate]);

  const rows = useMemo(() => {
    const purchaseRows = purchases.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitCost = Number(item.costPrices || 0);

      return {
        id: item._id,
        date: item.inDate,
        inventory: item.nameInventory ?? '—',
        type: 'stock-in',
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
        reference: item.nameResponsible ?? '—',
        batchSafetyStatus: null,
        isReversed: false,
      };
    });

    const usageRows = usages.map((item) => {
      const quantity = Number(item.quantityUsed || 0);
      const unitCost = Number(item.costPriceUsed || 0);

      return {
        id: item._id,
        date: item.usedDate,
        inventory: item.nameInventory ?? '—',
        type: 'usage',
        quantity,
        unitCost,
        totalCost: quantity * unitCost,
        reference: item.planId ?? item.planld ?? '—',
        batchSafetyStatus: item.batchSafetyStatus ?? null,
        isReversed: item.isReversed ?? false,
      };
    });

    return [...purchaseRows, ...usageRows].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
  }, [purchases, usages]);

  const summary = useMemo(() => {
    const purchasedQuantity = purchases.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    const purchaseCost = purchases.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.costPrices || 0),
      0,
    );

    const activeUsages = usages.filter((item) => !item.isReversed);

    const usedQuantity = activeUsages.reduce(
      (sum, item) => sum + Number(item.quantityUsed || 0),
      0,
    );

    const usageCost = activeUsages.reduce(
      (sum, item) =>
        sum +
        Number(item.quantityUsed || 0) *
          Number(item.costPriceUsed || 0),
      0,
    );

    return {
      purchasedQuantity,
      purchaseCost,
      usedQuantity,
      usageCost,
    };
  }, [purchases, usages]);

  const columns = useMemo(
  () => [
    {
      key: 'date',
      header: 'Date',
      render: (row) =>
        row.date
          ? new Date(row.date).toISOString().slice(0, 10)
          : '—',
    },
    {
      key: 'inventory',
      header: 'Inventory',
      render: (row) => row.inventory ?? '—',
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) =>
        row.type === 'stock-in' ? (
          <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            Stock In
          </span>
        ) : (
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            Usage
          </span>
        ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => (
        <span
          className={
            row.isReversed
              ? 'font-mono text-muted-foreground line-through'
              : 'font-mono'
          }
        >
          {row.quantity}
        </span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      render: (row) => (
        <span className="font-mono">
          {formatCurrency(row.unitCost)}
        </span>
      ),
    },
    {
      key: 'totalCost',
      header: 'Total Cost',
      render: (row) => (
        <span
          className={
            row.isReversed
              ? 'font-mono text-muted-foreground line-through'
              : 'font-mono'
          }
        >
          {formatCurrency(row.totalCost)}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => row.reference ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        if (row.isReversed) {
          return (
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              Reversed
            </span>
          );
        }

        if (row.batchSafetyStatus === 'unsafe') {
          return (
            <span className="rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
              Unsafe
            </span>
          );
        }

        if (row.batchSafetyStatus === 'safe') {
          return (
            <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
              Safe
            </span>
          );
        }

        return <span className="text-muted-foreground">—</span>;
      },
    },
  ],
  [],
);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-4 divide-x rounded-lg border border-border bg-card">
        <SummaryItem
          label="Purchased Quantity"
          value={summary.purchasedQuantity}
        />

        <SummaryItem
          label="Purchase Cost"
          value={formatCurrency(summary.purchaseCost)}
        />

        <SummaryItem
          label="Used Quantity"
          value={summary.usedQuantity}
        />

        <SummaryItem
          label="Usage Cost"
          value={formatCurrency(summary.usageCost)}
        />
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Inventory Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Inventory purchases and usage within the selected period.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading inventory report...
          </div>
        ) : (
          <DataTable columns={columns} data={rows} />
        )}
      </section>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}