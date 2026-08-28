import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import Pagination from '@/components/shared/Pagination';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatDate } from '@/lib/formatDate';
import { usePagination } from '@/hooks/usePagination';
import { getSaleHistory } from '@/services/cashierApi';
import DetailSalesReportModal from './DetailSalesReportModal';

const PAGE_SIZE = 8;

const formatInvoiceNumber = (id) =>
  id ? `INV-${id.slice(-6).toUpperCase()}` : '—';
import { Skeleton } from '@/components/ui/skeleton';

export default function SalesReport({
  planId,
  startDate = '',
  endDate = '',
  onExportDataChange,
}) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
          if (planId && transaction.planId !== planId) {
            return false;
          }

          if (!transaction.soldAt) return false;

          const soldAt = new Date(transaction.soldAt);

          const filterStart = startDate
            ? new Date(`${startDate}T00:00:00`)
            : null;

          const filterEnd = endDate
            ? new Date(`${endDate}T23:59:59`)
            : null;

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
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      isActive = false;
    };
  }, [planId, startDate, endDate]);

  const summary = useMemo(() => {
    const totalTransactions = transactions.length;

    const totalItemsSold = transactions.reduce(
      (transactionTotal, transaction) =>
        transactionTotal +
        (transaction.items ?? []).reduce(
          (itemTotal, item) =>
            itemTotal + Number(item.quantitySold || 0),
          0,
        ),
      0,
    );

    const totalRevenue = transactions.reduce(
      (total, transaction) =>
        total + Number(transaction.total || 0),
      0,
    );

    const totalDiscountGiven = transactions.reduce(
      (transactionTotal, transaction) =>
        transactionTotal +
        (transaction.items ?? []).reduce((itemTotal, item) => {
          const quantity = Number(item.quantitySold || 0);
          const originalPrice = Number(item.originalPrice || 0);
          const priceUsed = Number(item.priceUsed || 0);

          return (
            itemTotal +
            quantity * Math.max(originalPrice - priceUsed, 0)
          );
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

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.soldAt) - new Date(a.soldAt),
    );
  }, [transactions]);

  const {
    currentPage,
    totalPages,
    paginatedItems,
    setPage,
    resetPage,
  } = usePagination(sortedTransactions, PAGE_SIZE);

  useEffect(() => {
    resetPage();
  }, [planId, startDate, endDate, resetPage]);

  const selectedTransaction =
    transactions.find(
      (transaction) => transaction.id === selectedTransactionId,
    ) ?? null;

  const openDetail = (id) => {
    setSelectedTransactionId(id);
    setIsDetailOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        key: 'id',
        header: 'Invoice',
        cellClass: 'font-mono',
        render: (row) => formatInvoiceNumber(row.id),
      },
      {
        key: 'soldAt',
        header: 'Date',
        render: (row) =>
          row.soldAt ? formatDate(row.soldAt) : '—',
      },
      {
        key: 'cashierName',
        header: 'Cashier',
        render: (row) => row.cashierName ?? '—',
      },
      {
        key: 'items',
        header: 'Items Sold',
        cellClass: 'font-mono',
        render: (row) =>
          (row.items ?? []).reduce(
            (total, item) =>
              total + Number(item.quantitySold || 0),
            0,
          ),
      },
      {
        key: 'total',
        header: 'Total',
        cellClass: 'font-mono',
        render: (row) =>
          formatCurrency(row.total ?? 0),
      },
      {
        key: 'actions',
        header: 'Action',
        headerClass: 'text-center sticky right-0 z-10 bg-background',
        cellClass: 'text-center sticky right-0 z-10 bg-background',
        render: (row) => (
          <button
            type="button"
            onClick={() => openDetail(row.id)}
            className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            Detail
          </button>
        ),
      },
    ],
    [],
  );

  useEffect(() => {
    onExportDataChange?.({
      filename: 'sales-report',
      columns: [
        { key: 'invoice', label: 'Invoice' },
        { key: 'date', label: 'Date' },
        { key: 'cashier', label: 'Cashier' },
        { key: 'itemsSold', label: 'Items Sold' },
        { key: 'discountGiven', label: 'Discount Given' },
        { key: 'totalRevenue', label: 'Total' },
      ],
      rows: sortedTransactions.map((transaction) => {
        const itemsSold = (transaction.items ?? []).reduce(
          (total, item) =>
            total + Number(item.quantitySold || 0),
          0,
        );

        const discountGiven = (transaction.items ?? []).reduce(
          (total, item) => {
            const quantity = Number(item.quantitySold || 0);
            const originalPrice = Number(item.originalPrice || 0);
            const priceUsed = Number(item.priceUsed || 0);

            return (
              total +
              quantity * Math.max(originalPrice - priceUsed, 0)
            );
          },
          0,
        );

        return {
          invoice: formatInvoiceNumber(transaction.id),
          date: transaction.soldAt
            ? new Date(transaction.soldAt).toISOString().slice(0, 10)
            : '',
          cashier: transaction.cashierName ?? '',
          itemsSold,
          discountGiven,
          totalRevenue: transaction.total ?? 0,
        };
      }),
    });
  }, [sortedTransactions, onExportDataChange]);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-4 divide-x rounded-lg border border-border bg-card">
        <SummaryItem
          label="Total"
          value={formatCurrency(summary.totalRevenue)}
          isLoading={isLoading}
        />

        <SummaryItem
          label="Transactions"
          value={summary.totalTransactions}
          isLoading={isLoading}
        />

        <SummaryItem
          label="Items Sold"
          value={summary.totalItemsSold}
          isLoading={isLoading}
        />

        <SummaryItem
          label="Discount Given"
          value={formatCurrency(summary.totalDiscountGiven)}
          isLoading={isLoading}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Sales Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Sales transactions within the selected plan and period.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={paginatedItems}
          loading={isLoading}
          emptyMessage="No sales transactions found for the selected filters."
        />

        {!isLoading && sortedTransactions.length > 0 && (
          <div className="border-t px-4 py-3">
            <Pagination
              currentPage={currentPage}
              totalPage={totalPages}
              totalData={sortedTransactions.length}
              limit={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

      <DetailSalesReportModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
}

function SummaryItem({ label, value, isLoading }) {
  return (
    <div className="p-5">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      {isLoading ? (
        <Skeleton className="mt-2.5 h-6 w-24" />
      ) : (
        <p className="mt-2 text-lg font-semibold text-foreground">
          {value}
        </p>
      )}
    </div>
  );
}
