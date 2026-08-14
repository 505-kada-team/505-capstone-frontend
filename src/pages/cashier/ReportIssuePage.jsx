import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import SortDropdown from '@/components/shared/SortDropdown';
import Pagination from '@/components/shared/Pagination';
import Modal from '@/components/shared/Modal';
import ReportIssueForm from '@/components/shared/ReportIssueForm';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import {
  createPlanReport,
  getPlanReports,
  getActivePlans,
} from '@/services/cashierApi';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'name-asc', label: 'Nama (A-Z)' },
  { value: 'name-desc', label: 'Nama (Z-A)' },
];

const PAGE_SIZE = 8;

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

/**
 * Layout `h-full flex-col overflow-hidden` ngikutin pola yang sama kayak
 * halaman lain di bawah CashierLayout.
 *
 * Search cuma 1 field, match ke title ATAU reportedBy sekaligus — bukan
 * 2 field terpisah kayak sebelumnya.
 */
export default function ReportIssuePage() {
  const { user } = useAuth();

  const [issues, setIssues] = useState([]);
  const [activePlanIds, setActivePlanIds] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selectedIssue, setSelectedIssue] = useState(null);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [reportResult, activePlanResult] = await Promise.all([
        getPlanReports(),
        getActivePlans(),
      ]);

      setIssues(Array.isArray(reportResult) ? reportResult : []);

      setActivePlanIds(
        Array.isArray(activePlanResult)
          ? activePlanResult.map((plan) => plan.planId)
          : [],
      );
    } catch (error) {
      console.error('[PLAN REPORT ERROR]', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    const keyword = search.toLowerCase();

    return issues.filter((issue) => {
      const isActivePlan = activePlanIds.includes(issue.planId);

      const matchesSearch =
        issue.nameRef?.toLowerCase().includes(keyword) ||
        issue.category?.toLowerCase().includes(keyword) ||
        issue.status?.toLowerCase().includes(keyword);

      return isActivePlan && matchesSearch;
    });
  }, [issues, activePlanIds, search]);

  const sortedIssues = useMemo(() => {
    const sorted = [...filteredIssues];

    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.incidentAt) - new Date(b.incidentAt));
        break;
      case 'name-asc':
        sorted.sort((a, b) => (a.nameRef ?? '').localeCompare(b.nameRef ?? ''));
        break;
      case 'name-desc':
        sorted.sort((a, b) => (b.nameRef ?? '').localeCompare(a.nameRef ?? ''));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.incidentAt) - new Date(a.incidentAt));
    }

    return sorted;
  }, [filteredIssues, sortBy]);

  const { currentPage, totalPages, paginatedItems, setPage, resetPage } =
    usePagination(sortedIssues, PAGE_SIZE);

  const handleAddIssue = () => {
    setFormMode('add');
    setSelectedIssue(null);
    setIsFormOpen(true);
  };

  const handleViewDetail = (id) => {
    const issue = issues.find((item) => item._id === id) ?? null;

    setFormMode('detail');
    setSelectedIssue(issue);
    setIsFormOpen(true);
  };

  const handleSubmitIssue = async (values) => {
    try {
      await createPlanReport(values);
      await fetchIssues();
      setIsFormOpen(false);
    } catch (error) {
      console.error('[CREATE PLAN REPORT ERROR]', error);
      throw error;
    }
  };

  const columns = [
    { key: 'nameRef', header: 'Item' },
    {
      key: 'category',
      header: 'Kategori',
      render: (row) => <span className="capitalize">{row.category}</span>,
    },
    { key: 'quantityLost', header: 'Jumlah Hilang', cellClass: 'font-mono' },
    {
      key: 'incidentAt',
      header: 'Tanggal',
      render: (row) => formatDate(row.incidentAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <span className="capitalize">{row.status}</span>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      headerClass: 'text-center',
      cellClass: 'text-center',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleViewDetail(row._id)}
          className="font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
        >
          Detail
        </button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        Memuat laporan...
      </div>
    );
  }

  if (error && issues.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        Gagal memuat laporan.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="shrink-0">
        <PageHeader
          title="Report Issue"
          action={
            <div className="flex items-center gap-2">
              <SearchInput
                placeholder="Cari item, kategori, atau status..."
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

              <Button
                onClick={handleAddIssue}
                className="rounded-md bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                <Plus size={16} strokeWidth={2} />
                Add
              </Button>
            </div>
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-neutral-200">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DataTable
            columns={columns}
            data={paginatedItems}
            emptyMessage="Belum ada issue yang dilaporkan."
          />
        </div>

        <div className="shrink-0 border-t border-neutral-200 bg-muted/30 px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPage={totalPages}
            totalData={sortedIssues.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={formMode === 'add' ? 'Report Issue Form' : 'Report Issue Detail'}
        className="max-w-2xl sm:max-w-2xl"
      >
        <ReportIssueForm
          mode={formMode}
          issue={selectedIssue}
          cashierName={formMode === 'add' ? user?.name : null}
          onSubmit={handleSubmitIssue}
        />
      </Modal>
    </div>
  );
}