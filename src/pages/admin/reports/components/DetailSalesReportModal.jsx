import { useMemo } from 'react';

import Modal from '@/components/shared/Modal';
import DataTable from '@/components/shared/DataTable';
import DetailRow from '@/components/shared/DetailRow';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatDate } from '@/lib/formatDate';

const itemColumns = [
  {
    key: 'menuName',
    header: 'Menu',
  },
  {
    key: 'originalPrice',
    header: 'Original Price',
    cellClass: 'font-mono',
    render: (row) => formatCurrency(row.originalPrice ?? 0),
  },
  {
    key: 'priceUsed',
    header: 'Final Price',
    cellClass: 'font-mono',
    render: (row) => formatCurrency(row.priceUsed ?? 0),
  },
  {
    key: 'quantitySold',
    header: 'Qty',
    cellClass: 'font-mono',
  },
  {
    key: 'discount',
    header: 'Discount',
    cellClass: 'font-mono',
    render: (row) =>
      row.discountApplied && row.discountPercentage != null
        ? `${row.discountPercentage}%`
        : '—',
  },
  {
    key: 'subtotal',
    header: 'Subtotal',
    cellClass: 'font-mono',
    render: (row) =>
      formatCurrency(
        Number(row.priceUsed || 0) * Number(row.quantitySold || 0),
      ),
  },
];

const formatInvoiceNumber = (id) =>
  id ? `INV-${id.slice(-6).toUpperCase()}` : '—';

export default function DetailSalesReportModal({
  open,
  onOpenChange,
  transaction,
}) {
  const summary = useMemo(() => {
    const items = transaction?.items ?? [];

    const grossAmount = items.reduce(
      (total, item) =>
        total +
        Number(item.originalPrice || 0) *
          Number(item.quantitySold || 0),
      0,
    );

    const discountGiven = items.reduce((total, item) => {
      const originalPrice = Number(item.originalPrice || 0);
      const priceUsed = Number(item.priceUsed || 0);
      const quantity = Number(item.quantitySold || 0);

      return total + Math.max(originalPrice - priceUsed, 0) * quantity;
    }, 0);

    const totalRevenue = items.reduce(
      (total, item) =>
        total +
        Number(item.priceUsed || 0) *
          Number(item.quantitySold || 0),
      0,
    );

    return {
      grossAmount,
      discountGiven,
      totalRevenue,
    };
  }, [transaction]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Sales Transaction Detail"
      className="max-w-4xl sm:max-w-4xl"
    >
      {transaction && (
        <>
          <div className="space-y-1.5 px-6 py-4 text-sm">
            <DetailRow label="Invoice">
              {formatInvoiceNumber(transaction.id)}
            </DetailRow>

            <DetailRow label="Date">
              {formatDate(transaction.soldAt)}
            </DetailRow>

            <DetailRow label="Cashier">
              {transaction.cashierName ?? '—'}
            </DetailRow>
          </div>

          <div className="max-h-72 overflow-y-auto border-t border-neutral-200">
            <DataTable
              columns={itemColumns}
              data={transaction.items ?? []}
              emptyMessage="No items."
            />
          </div>

          <div className="space-y-3 border-t border-neutral-200 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Gross Amount
              </span>

              <span className="font-mono text-foreground">
                {formatCurrency(summary.grossAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Discount Given
              </span>

              <span className="font-mono text-foreground">
                {summary.discountGiven > 0
                  ? `-${formatCurrency(summary.discountGiven)}`
                  : formatCurrency(0)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
              <span className="font-semibold text-foreground">
                Total
              </span>

              <span className="font-mono text-lg font-semibold text-accent">
                {formatCurrency(summary.totalRevenue)}
              </span>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}