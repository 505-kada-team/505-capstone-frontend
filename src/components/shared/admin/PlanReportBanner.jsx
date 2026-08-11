import { Link } from 'react-router';
import { TriangleAlert, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlanReportBanner({ pendingCount, planId }) {
  if (pendingCount <= 0) return null;

  return (
    <div className="flex flex-col gap-2 p-1">
      <div className="flex items-start gap-2">
        <TriangleAlert className="w-5 h-5 text-orange-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Menunggu Penarikan Stok</p>
          <p className="text-muted-foreground mt-1">
            Terdapat <span className="font-bold text-foreground">{pendingCount} laporan bahan rusak</span> yang sudah disetujui, namun stok penggantinya belum ditarik dari gudang.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" className="mt-2 w-full justify-between">
        <Link to={`/admin/production-plan/report?planId=${planId}`}>
          Proses Sekarang <ChevronRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
}
