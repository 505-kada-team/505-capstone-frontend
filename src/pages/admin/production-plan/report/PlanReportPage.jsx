import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Clock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getPlanReportList } from '@/services/api';

import ReviewReportModal from './components/ReviewReportModal';
import ReplacementModal from './components/ReplacementModal';

export default function PlanReportPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [reviewReport, setReviewReport] = useState(null);
  const [replaceReport, setReplaceReport] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getPlanReportList();
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
  }, []);

  const pendingReplacements = reports.filter(r => r.category === 'ingredient' && r.status === 'approved' && !r.replacementDeducted);

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
          {/* Note: mockData refId is just ID. In real app, API should populate the item name. We just show refId or a placeholder if name isn't there */}
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
        // Map status to variants
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
        if (row.category === 'ingredient' && row.status === 'approved' && !row.replacementDeducted) {
          return (
            <Button size="sm" variant="default" className="bg-orange-600 hover:bg-orange-700" onClick={() => setReplaceReport(row)}>
              Tarik Stok
            </Button>
          );
        }
        return <span className="text-xs text-muted-foreground">Selesai</span>;
      },
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Plan Report" />

      {pendingReplacements.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-orange-800">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold">Menunggu Penarikan Stok</h3>
                <p className="text-sm opacity-90">Ada {pendingReplacements.length} laporan bahan mentah (ingredient) yang sudah di-ACC namun stok penggantinya belum ditarik.</p>
              </div>
            </div>
            {/* Can add a bulk action here later, or rely on individual table buttons */}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <DataTable
          columns={columns}
          data={reports}
          loading={isLoading}
          emptyMessage="Tidak ada riwayat laporan insiden."
        />
      </Card>

      <ReviewReportModal 
        open={!!reviewReport} 
        report={reviewReport} 
        onClose={() => setReviewReport(null)}
        onRefresh={fetchData}
      />
      
      <ReplacementModal 
        open={!!replaceReport} 
        report={replaceReport} 
        onClose={() => setReplaceReport(null)}
        onRefresh={fetchData}
      />
    </div>
  );
}
