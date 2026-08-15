import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import { formatCurrency } from '@/lib/formatCurrency';
import { inventoryApi } from '@/services/inventory/inventory.api';

export default function InventoryReport({
  startDate = '',
  endDate = '',
}) {
  const [purchases, setPurchases] = useState([]);
  const [usages, setUsages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock-in');

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

        console.log('[INVENTORY STOCK IN HISTORY]', purchaseRes);
        console.log('[INVENTORY USAGE HISTORY]', usageRes);

        if (!isActive) return;

        setPurchases(
          purchaseRes?.success &&
            Array.isArray(purchaseRes.data?.items)
            ? purchaseRes.data.items
            : [],
        );

        setUsages(
          usageRes?.success &&
            Array.isArray(usageRes.data?.items)
            ? usageRes.data.items
            : [],
        );
      } catch (error) {
        console.error('[INVENTORY REPORT ERROR]', error);
        console.error(
          '[INVENTORY REPORT RESPONSE]',
          error.response?.data,
        );

        if (isActive) {
          setPurchases([]);
          setUsages([]);

          toast.error(
            error.response?.data?.message ??
              'Failed to load inventory report',
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isActive = false;
    };
  }, [startDate, endDate]);

  const stockInRows = useMemo(() => {
    return [...purchases]
      .map((item) => ({
        id: item._id,
        inventoryId: item.inventoryId,
        date: item.inDate,
        inventory: item.nameInventory ?? '—',
        itemCode: item.itemCode ?? '—',
        category: item.category ?? '—',
        quantity: Number(item.quantity || 0),
        unit: item.unit ?? '',
        batchCode: item.batchCode ?? '—',
        batchCost: Number(item.costPrices || 0),
        expired: item.expired ?? null,
      }))
      .sort(
        (a, b) =>
          new Date(b.date || 0) -
          new Date(a.date || 0),
      );
  }, [purchases]);

  const usageRows = useMemo(() => {
    return [...usages]
      .map((item) => {
        const quantity = Number(item.quantityUsed || 0);
        const unitCost = Number(item.costPriceUsed || 0);

        return {
          id: item._id,
          date: item.usedDate,
          inventory: item.nameInventory ?? '—',
          quantity,
          unit: item.unit ?? '',
          unitCost,
          usageCost: quantity * unitCost,
          batchSafetyStatus: item.batchSafetyStatus ?? null,
          isReversed: item.isReversed ?? false,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.date || 0) -
          new Date(a.date || 0),
      );
  }, [usages]);

  const summary = useMemo(() => {
    const inventoryItems = new Set(
      purchases
        .map((item) => item.inventoryId)
        .filter(Boolean),
    ).size;

    const stockInCost = purchases.reduce(
      (total, item) =>
        total + Number(item.costPrices || 0),
      0,
    );

    const activeUsages = usages.filter(
      (item) => !item.isReversed,
    );

    const usageCost = activeUsages.reduce(
      (total, item) =>
        total +
        Number(item.quantityUsed || 0) *
          Number(item.costPriceUsed || 0),
      0,
    );

    return {
      inventoryItems,
      stockInCost,
      usageRecords: activeUsages.length,
      usageCost,
    };
  }, [purchases, usages]);

  const stockInColumns = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date',
        render: (row) =>
          row.date
            ? new Date(row.date)
                .toISOString()
                .slice(0, 10)
            : '—',
      },
      {
        key: 'inventory',
        header: 'Item',
        render: (row) => (
          <div>
            <p className="font-medium text-foreground">
              {row.inventory}
            </p>

            <p className="text-xs text-muted-foreground">
              {row.itemCode}
            </p>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        render: (row) => (
          <span className="capitalize">
            {row.category}
          </span>
        ),
      },
      {
        key: 'quantity',
        header: 'Quantity',
        render: (row) => (
          <span className="font-mono">
            {row.quantity.toLocaleString('id-ID')}
            {row.unit ? ` ${row.unit}` : ''}
          </span>
        ),
      },
      {
        key: 'batchCode',
        header: 'Batch',
        render: (row) => (
          <span className="font-mono text-xs">
            {row.batchCode}
          </span>
        ),
      },
      {
        key: 'batchCost',
        header: 'Batch Cost',
        render: (row) => (
          <span className="font-mono">
            {formatCurrency(row.batchCost)}
          </span>
        ),
      },
      {
        key: 'expired',
        header: 'Expiry',
        render: (row) =>
          row.expired
            ? new Date(row.expired)
                .toISOString()
                .slice(0, 10)
            : '—',
      },
    ],
    [],
  );

  const usageColumns = useMemo(
    () => [
      {
        key: 'date',
        header: 'Date',
        render: (row) =>
          row.date
            ? new Date(row.date)
                .toISOString()
                .slice(0, 10)
            : '—',
      },
      {
        key: 'inventory',
        header: 'Item',
        render: (row) =>
          row.inventory ?? '—',
      },
      {
        key: 'quantity',
        header: 'Quantity Used',
        render: (row) => (
          <span
            className={
              row.isReversed
                ? 'font-mono text-muted-foreground line-through'
                : 'font-mono'
            }
          >
            {row.quantity.toLocaleString('id-ID')}
            {row.unit ? ` ${row.unit}` : ''}
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
        key: 'usageCost',
        header: 'Usage Cost',
        render: (row) => (
          <span
            className={
              row.isReversed
                ? 'font-mono text-muted-foreground line-through'
                : 'font-mono'
            }
          >
            {formatCurrency(row.usageCost)}
          </span>
        ),
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

          if (
            row.batchSafetyStatus === 'unsafe'
          ) {
            return (
              <span className="rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                Unsafe
              </span>
            );
          }

          if (
            row.batchSafetyStatus === 'safe'
          ) {
            return (
              <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
                Safe
              </span>
            );
          }

          return (
            <span className="text-muted-foreground">
              —
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-4 divide-x rounded-lg border border-border bg-card">
        <SummaryItem
          label="Inventory Items Stock In"
          value={summary.inventoryItems}
        />

        <SummaryItem
          label="Stock-In Cost"
          value={formatCurrency(
            summary.stockInCost,
          )}
        />

        <SummaryItem
          label="Usage Records"
          value={summary.usageRecords}
        />

        <SummaryItem
          label="Usage Cost"
          value={formatCurrency(
            summary.usageCost,
          )}
        />
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-end gap-1 border-b border-border px-6 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('stock-in')}
            className={`rounded-t-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'stock-in'
                ? 'border border-b-background border-border bg-background text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Stock In
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`rounded-t-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'usage'
                ? 'border border-b-background border-border bg-background text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Usage
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground">
            {activeTab === 'stock-in'
              ? 'Inventory items received within the selected period.'
              : 'Inventory usage within the selected period.'}
          </p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : activeTab === 'stock-in' ? (
          <DataTable
            columns={stockInColumns}
            data={stockInRows}
            emptyMessage="No stock-in history found for the selected period."
          />
        ) : (
          <DataTable
            columns={usageColumns}
            data={usageRows}
            emptyMessage="No inventory usage found for the selected period."
          />
        )}
      </section>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="p-5">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-12 text-center text-sm text-muted-foreground">
      Loading inventory report...
    </div>
  );
}