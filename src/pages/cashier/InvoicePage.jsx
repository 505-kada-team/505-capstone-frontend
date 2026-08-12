import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import SortDropdown from '@/components/shared/SortDropdown';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import DetailRow from '@/components/shared/DetailRow';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatCurrency';
import { formatDate } from '@/lib/formatDate';
import { usePagination } from '@/hooks/usePagination';
import { useFetch } from '@/hooks/useFetch';
import { getSaleHistory } from '@/services/cashierApi';

const PAGE_SIZE = 8;

const formatInvoiceNumber = (id) => `INV-${id.slice(-6).toUpperCase()}`;

const invoiceItemColumns = [
  { key: 'menuName', header: 'Nama Produk' },
  { key: 'priceUsed', header: 'Harga Satuan', cellClass: 'font-mono', render: (row) => formatCurrency(row.priceUsed) },
  { key: 'quantitySold', header: 'Jumlah', cellClass: 'font-mono' },
  {
    key: 'subtotal',
    header: 'Sub Total',
    cellClass: 'font-mono',
    render: (row) => formatCurrency(row.priceUsed * row.quantitySold),
  },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'name-asc', label: 'Nama Kasir (A-Z)' },
  { value: 'name-desc', label: 'Nama Kasir (Z-A)' },
];

/**
 * ⚠️ `summary` di-fetch dari getSaleHistory() tapi belum ada UI yang
 * menampilkannya — belum dihapus karena kemungkinan memang buat card
 * ringkasan (total invoice/omzet, dsb) yang belum dibangun. Perlu
 * keputusan: tampilkan (butuh desain) atau memang belum diperlukan.
 */
export default function InvoicePage() {
  const { data, isLoading, error } = useFetch(getSaleHistory, []);
  const invoices = data?.transactions ?? [];
  const summary = data?.summary ?? null;

  useEffect(() => {
    if (!error) return;
    console.error('[INVOICE ERROR]', error);
    // Bukan error yang terikat 1 field spesifik → toast (DESIGN.md §5b).
    toast.error('Gagal memuat daftar invoice. Silakan coba lagi.');
  }, [error]);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredInvoices = useMemo(() => {
    const keyword = search.toLowerCase();

    return invoices.filter((invoice) => {
      const matchId = invoice.id?.toLowerCase().includes(keyword);
      const matchCashier = invoice.cashierName?.toLowerCase().includes(keyword);
      const matchMenu = invoice.items?.some((item) => item.menuName?.toLowerCase().includes(keyword));

      return matchId || matchCashier || matchMenu;
    });
  }, [invoices, search]);

  const sortedInvoices = useMemo(() => {
    const sorted = [...filteredInvoices];

    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.soldAt) - new Date(b.soldAt));
        break;

      case 'name-asc':
        sorted.sort((a, b) => a.cashierName.localeCompare(b.cashierName));
        break;

      case 'name-desc':
        sorted.sort((a, b) => b.cashierName.localeCompare(a.cashierName));
        break;

      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt));
    }

    return sorted;
  }, [filteredInvoices, sortBy]);

  const { currentPage, totalPages, paginatedItems: paginatedInvoices, setPage, resetPage } = usePagination(
    sortedInvoices,
    PAGE_SIZE
  );

  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null;
  const selectedInvoiceTotal = selectedInvoice?.total ?? 0;

  const openDetail = (id) => {
    setSelectedInvoiceId(id);
    setIsDetailOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    { key: 'id', header: 'No. Invoice', cellClass: 'font-mono', render: (row) => formatInvoiceNumber(row.id) },
    { key: 'soldAt', header: 'Tanggal', render: (row) => formatDate(row.soldAt) },
    { key: 'cashierName', header: 'Kasir' },
    { key: 'itemCount', header: 'Item', cellClass: 'font-mono', render: (row) => row.items?.length ?? 0 },
    { key: 'total', header: 'Total', cellClass: 'font-mono', render: (row) => formatCurrency(row.total) },
    {
      key: 'actions',
      header: 'Aksi',
      headerClass: 'text-center',
      cellClass: 'text-center',
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
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <PageHeader
          title="Invoices"
          action={
            <div className="flex items-center gap-2">
              <SearchInput
                placeholder="Cari..."
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
                defaultValue="newest"
                onChange={(value) => {
                  setSortBy(value);
                  resetPage();
                }}
              />
            </div>
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DataTable
            columns={columns}
            data={paginatedInvoices}
            loading={isLoading}
            emptyMessage={error ? 'Gagal memuat invoice.' : 'Belum ada invoice.'}
          />
        </div>

        <div className="shrink-0 border-t border-neutral-200 bg-muted/30 px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPage={totalPages}
            totalData={sortedInvoices.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal open={isDetailOpen} onOpenChange={setIsDetailOpen} title="Detail Invoice" className="max-w-2xl sm:max-w-2xl">
        {selectedInvoice && (
          <>
            <div className="space-y-1.5 px-6 py-4 text-sm">
              <DetailRow label="No. Invoice">{formatInvoiceNumber(selectedInvoice.id)}</DetailRow>
              <DetailRow label="Tanggal">{formatDate(selectedInvoice.soldAt)}</DetailRow>
              <DetailRow label="Cashier name">{selectedInvoice.cashierName}</DetailRow>
            </div>

            <div className="max-h-64 overflow-y-auto border-t border-neutral-200">
              <DataTable columns={invoiceItemColumns} data={selectedInvoice.items} emptyMessage="Tidak ada item." />
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4">
              <p className="text-base font-semibold text-foreground">Total Pembayaran</p>
              <p className="font-mono text-lg font-semibold text-accent">{formatCurrency(selectedInvoiceTotal)}</p>
            </div>

            <div className="flex justify-end border-t border-neutral-200 bg-muted/30 px-6 py-4">
              <Button
                onClick={handlePrint}
                className="rounded-md bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                Print
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}