import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import { formatCurrency } from '@/lib/formatCurrency';
import { getSaleHistory } from '@/services/cashierApi';

export default function SalesReport({ startDate = '', endDate = '', onExportDataChange, }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchReport = async () => {
      setIsLoading(true);

      try {
        const result = await getSaleHistory();

        console.log('[SALES REPORT RESPONSE]', result);

        if (!isActive) return;

        const rawTransactions = Array.isArray(result?.transactions)
          ? result.transactions
          : [];

        const filteredTransactions = rawTransactions.filter((transaction) => {
          if (!transaction.soldAt) return false;

          const soldAt = new Date(transaction.soldAt);
          const filterStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
          const filterEnd = endDate ? new Date(`${endDate}T23:59:59`) : null;

          if (filterStart && soldAt < filterStart) return false;
          if (filterEnd && soldAt > filterEnd) return false;

          return true;
        });

        setTransactions(filteredTransactions);
      } catch (error) {
        console.error('[SALES REPORT ERROR]', error);
        console.error('[SALES REPORT RESPONSE ERROR]', error.response?.data);

        if (isActive) {
          setTransactions([]);

          toast.error(
            error.response?.data?.message ??
              'Failed to load sales report',
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

  const summary = useMemo(() => {
    const totalTransactions = transactions.length;

    const totalItemsSold = transactions.reduce(
      (transactionTotal, transaction) =>
        transactionTotal +
        (transaction.items ?? []).reduce(
          (itemTotal, item) => itemTotal + Number(item.quantitySold || 0),
          0,
        ),
      0,
    );

    const totalRevenue = transactions.reduce(
      (total, transaction) => total + Number(transaction.total || 0),
      0,
    );

    const totalDiscountGiven = transactions.reduce(
      (transactionTotal, transaction) =>
        transactionTotal +
        (transaction.items ?? []).reduce((itemTotal, item) => {
          const quantity = Number(item.quantitySold || 0);
          const originalPrice = Number(item.originalPrice || 0);
          const priceUsed = Number(item.priceUsed || 0);

          return itemTotal + quantity * Math.max(originalPrice - priceUsed, 0);
        }, 0),
      0,
    );

    return {
      totalTransactions,
      totalItemsSold,
      totalRevenue,
      totalDiscountGiven,
    };
  }, [transactions]);

 const columns = useMemo(
  () => [
    {
      key: 'soldAt',
      header: 'Date',
      render: (row) =>
        row.soldAt
          ? new Date(row.soldAt).toISOString().slice(0, 10)
          : '—',
    },
    {
      key: 'cashierName',
      header: 'Cashier',
      render: (row) => row.cashierName ?? '—',
    },
    {
      key: 'menus',
      header: 'Menu',
      render: (row) => {
        const names = (row.items ?? [])
          .map((item) => item.menuName)
          .filter(Boolean);

        return names.length > 0 ? names.join(', ') : '—';
      },
    },
    {
      key: 'itemCount',
      header: 'Items',
      render: (row) => (
        <span className="font-mono">{row.items?.length ?? 0}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => {
        const quantity = (row.items ?? []).reduce(
          (total, item) => total + Number(item.quantitySold || 0),
          0,
        );

        return <span className="font-mono">{quantity}</span>;
      },
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (row) => {
        const discount = (row.items ?? []).reduce((total, item) => {
          const quantity = Number(item.quantitySold || 0);
          const originalPrice = Number(item.originalPrice || 0);
          const priceUsed = Number(item.priceUsed || 0);

          return total + quantity * Math.max(originalPrice - priceUsed, 0);
        }, 0);

        return (
          <span className="font-mono">
            {discount > 0 ? formatCurrency(discount) : '—'}
          </span>
        );
      },
    },
    {
      key: 'total',
      header: 'Revenue',
      render: (row) => (
        <span className="font-mono">
          {formatCurrency(row.total ?? 0)}
        </span>
      ),
    },
  ],
  [],
);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-4 divide-x rounded-lg border border-border bg-card">
        <SummaryItem
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
        />

        <SummaryItem
          label="Transactions"
          value={summary.totalTransactions}
        />

        <SummaryItem
          label="Items Sold"
          value={summary.totalItemsSold}
        />

        <SummaryItem
          label="Discount Given"
          value={formatCurrency(summary.totalDiscountGiven)}
        />
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Sales Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Sales transactions within the selected period.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading sales report...
          </div>
        ) : (
          <DataTable columns={columns} data={transactions} />
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