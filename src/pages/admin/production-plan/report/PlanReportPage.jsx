import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Clock, Plus, ListFilter } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPlanReportList, getPlanList } from '@/services/api';

import ReviewReportModal from './components/ReviewReportModal';
import ReplacementModal from './components/ReplacementModal';
import AddReportModal from './components/AddReportModal';

export default function PlanReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [filterPlan, setFilterPlan] = useState(searchParams.get('planId') || 'all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modals state
  const [reviewReport, setReviewReport] = useState(null);
  const [replaceReport, setReplaceReport] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    // Sync filterPlan if URL changes
    const pid = searchParams.get('planId');
    if (pid && pid !== filterPlan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilterPlan(pid);
    }
  }, [searchParams, filterPlan]);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await getPlanList();
        setPlans(res.data?.data || []);
      } catch {
        console.error('Failed to load plans for filter');
      }
    }
    loadPlans();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filterPlan !== 'all') params.planId = filterPlan;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;

      const res = await getPlanReportList(params);
      if (res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch {
      toast.error('Gagal mengambil daftar laporan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPlan, filterStatus, filterCategory]);

  const columns = [
    {
      key: 'incidentAt',
      header: 'Waktu Kejadian',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{new Date(row.incidentAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span className="text-xs text-muted-foreground">{new Date(row.incidentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          {row.isLateReport && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 px-1 py-0.5 rounded w-max">
              <Clock size={10} /> Laporan Telat
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'item',
      header: 'Tipe & Item',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold capitalize text-foreground">{row.category}</span>
          <span className="text-sm text-muted-foreground truncate max-w-[150px]">{row.refId}</span>
        </div>
      ),
    },
    {
      key: 'quantityLost',
      header: 'Kuantitas Rusak',
      render: (row) => (
        <span className="font-semibold text-destructive">{row.quantityLost}</span>
      ),
    },
    {
      key: 'reportedBy',
      header: 'Pelapor',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.reportedBy}</span>
          <span className="text-xs text-muted-foreground capitalize">{row.reportedByRole}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const varMap = { pending: 'low stock', approved: 'active', rejected: 'deleted' };
        return <StatusBadge variant={varMap[row.status] || 'deleted'} label={row.status} />;
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      headerClass: 'text-right',
      cellClass: 'text-right',
      render: (row) => {
        if (row.status === 'pending') {
          return (
            <Button size="sm" variant="outline" onClick={() => setReviewReport(row)}>
              Review
            </Button>
          );
        }

        const isTarikStok = row.category === 'ingredient' && row.status === 'approved' && !row.replacementDeducted;

        return (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setReviewReport(row)}>
              Detail
            </Button>
            {isTarikStok && (
              <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700" onClick={() => setReplaceReport(row)}>
                Tarik Stok
              </Button>
            )}
          </div>
        );
      },
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Plan Report" 
        actions={
          <Button onClick={() => setIsAddOpen(true)} className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2">
            <Plus size={18} strokeWidth={2} /> Add Report
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 flex-1">
          <Select value={filterPlan} onValueChange={val => {
              setFilterPlan(val);
              setSearchParams(val === 'all' ? {} : { planId: val });
            }}>
            <SelectTrigger className="w-[300px] h-9 text-muted-foreground font-normal">
              <SelectValue placeholder="Filter Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Plan</SelectItem>
              {plans.map(p => (
                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-9 text-muted-foreground font-normal">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px] h-9 text-muted-foreground font-normal">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="menu">Menu</SelectItem>
              <SelectItem value="ingredient">Ingredient</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 h-9 text-muted-foreground font-normal">
            <ListFilter size={16} />
            Filter
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={reports}
          loading={isLoading}
          emptyMessage="Tidak ada riwayat laporan insiden."
        />
      </div>

      <ReviewReportModal 
        open={!!reviewReport} 
        report={reviewReport} 
        onClose={() => setReviewReport(null)}
        onRefresh={fetchData}
        readOnly={reviewReport?.status !== 'pending'}
      />
      
      <ReplacementModal 
        open={!!replaceReport} 
        report={replaceReport} 
        onClose={() => setReplaceReport(null)}
        onRefresh={fetchData}
      />

      <AddReportModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onRefresh={fetchData}
      />
    </div>
  );
}
