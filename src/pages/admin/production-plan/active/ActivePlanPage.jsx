import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Plus, MessageSquareWarning, ChevronLeft, ChevronRight } from 'lucide-react';

import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPlanList, getPlanDetail } from '@/services/api';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${String(date.getDate()).padStart(2, '0')} ${
    ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()]
  } ${date.getFullYear()}`;
}

const formatRp = (num) => num != null ? `Rp ${num.toLocaleString('id-ID')}` : '-';

// Komponen Progress Bar kustom
function ProgressBar({ current, max, colorClass = "bg-[#4E6A3E]" }) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-mono whitespace-nowrap">{current} / {max}</span>
    </div>
  );
}

export default function ActivePlanPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [activePlanDetail, setActivePlanDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all plans for history
        const listRes = await getPlanList();
        if (listRes.data?.success) {
          const fetchedPlans = listRes.data.data || [];
          setPlans(fetchedPlans);
          
          // Check if there is an active plan
          const active = fetchedPlans.find(p => p.status === 'active');
          if (active) {
            // Fetch detailed active plan to get menus tracking
            const detailRes = await getPlanDetail(active._id);
            if (detailRes.data?.success) {
              setActivePlanDetail(detailRes.data.data);
            }
          }
        }
      } catch {
        toast.error('Failed to fetch plan data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasActive = !!activePlanDetail;

  return (
    <div className="flex flex-col gap-6">
      
      {/* CUSTOM PAGE HEADER to match mockup exactly */}
      <div className="flex flex-col gap-3 mb-2">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold font-heading">Active Plan</h1>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              className="w-9 h-9 text-muted-foreground bg-white" 
              disabled={!hasActive || !(activePlanDetail.hasPendingLossReplacement || activePlanDetail.checkResultStale)}
            >
              <MessageSquareWarning className="w-4 h-4" />
            </Button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white ${hasActive ? 'border-green-200 text-green-700' : 'border-border text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${hasActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <span className="text-xs font-medium">{hasActive ? 'Active' : 'None'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <span>
            Plan Name : <span className="font-normal text-muted-foreground">{hasActive ? activePlanDetail.name : '-'}</span>
          </span>
          <span>
            Plan Period: <span className="font-normal text-muted-foreground">
              {hasActive ? `${formatDate(activePlanDetail.startDate)} - ${formatDate(activePlanDetail.endDate)}` : '-'}
            </span>
          </span>
        </div>
      </div>

      {/* TOP SECTION: ACTIVE PLAN TRACKING */}
      <Card className="w-full shadow-sm">
        <CardContent className={hasActive ? "p-0" : "p-6"}>
          {isLoading ? (
            <div className="flex justify-center py-20 text-muted-foreground">Loading data...</div>
          ) : !hasActive ? (
            // EMPTY STATE
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No active plan!</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                There is no active production plan at the moment. Create a new plan to start production tracking.
              </p>
              <Button 
                className="bg-[#F97316] hover:bg-[#F97316]/90 text-white"
                onClick={() => navigate('/admin/production-plan/draft')}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Plan
              </Button>
            </div>
          ) : (
            // FILLED STATE
            <div className="flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 font-medium px-4 w-[30%]">Menu Name</th>
                      <th className="py-3 font-medium px-4 min-w-[200px]">Sold / Quantity</th>
                      <th className="py-3 font-medium px-4">Profit</th>
                      <th className="py-3 font-medium px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {activePlanDetail.menus?.map((menu) => {
                      const sold = menu.soldQuantity || 0;
                      const planned = menu.quantityPlanned || 0;
                      // Calculate effective price (discounted or current)
                      const effectivePrice = menu.discount?.discountPercentage > 0 
                        ? menu.discount.discountedPrice 
                        : (menu.currentPrice || 25000);
                      
                      const profit = sold * effectivePrice;
                      
                      // Assign colors based on ratio to make it interesting
                      const ratio = planned > 0 ? sold / planned : 0;
                      let colorClass = "bg-[#4E6A3E]"; // Green
                      if (ratio > 0.8) colorClass = "bg-amber-600"; // Almost sold out
                      if (ratio >= 1) colorClass = "bg-[#C4441F]"; // Sold out

                      return (
                        <tr key={menu.menuId} className="hover:bg-muted/30">
                          <td className="py-4 px-4 font-medium">{menu.name}</td>
                          <td className="py-4 px-4">
                            <ProgressBar current={sold} max={planned} colorClass={colorClass} />
                          </td>
                          <td className="py-4 px-4 font-mono">{formatRp(profit)}</td>
                          <td className="py-4 px-4 text-center">
                            <button 
                              className="text-[#F97316] font-medium text-sm hover:underline"
                              onClick={() => toast.info('Detail menu ' + menu.name)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground px-4">
                <span>Showing {activePlanDetail.menus?.length} of {activePlanDetail.menus?.length} items</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronLeft className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOTTOM SECTION: RIWAYAT PLAN */}
      <div className="flex flex-col mt-4">
        <h2 className="text-xl font-bold font-heading mb-4 px-1">Plan History</h2>
        <Card className="w-full shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/40 border-b border-border">
                  <tr>
                    <th className="py-3 px-6 font-medium">Plan Name</th>
                    <th className="py-3 px-6 font-medium">Date</th>
                    <th className="py-3 px-6 font-medium text-center">Status</th>
                    <th className="py-3 px-6 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoading ? (
                    <tr><td colSpan="4" className="py-10 text-center text-muted-foreground">Loading data...</td></tr>
                  ) : plans.length === 0 ? (
                    <tr><td colSpan="4" className="py-10 text-center text-muted-foreground">No plan history</td></tr>
                  ) : (
                    plans.map((p) => {
                      // Status mapping to match UI
                      let displayStatus = p.status;
                      if (p.status === 'completed') displayStatus = 'Executed';
                      if (p.status === 'cancelled' || p.status === 'stopped') displayStatus = 'Terminated';
                      if (p.status === 'draft') return null; // Typically history shouldn't show active drafts, but we'll map all for now

                      return (
                        <tr key={p._id} className="hover:bg-muted/30">
                          <td className="py-4 px-6 font-medium">{p.name}</td>
                          <td className="py-4 px-6 font-mono text-xs">
                            {formatDate(p.startDate)} - {formatDate(p.endDate)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <StatusBadge variant={displayStatus.toLowerCase()} />
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button 
                              className="text-[#F97316] font-medium hover:underline text-sm"
                              onClick={() => toast.info('Navigating to detail: ' + p.name)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}