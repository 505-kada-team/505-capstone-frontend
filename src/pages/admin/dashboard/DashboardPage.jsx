import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DollarSign, Coffee, Calendar as CalendarIcon, Sparkles, Clock, Package, AlertTriangle, ChevronRight, TrendingUp, Layers, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import ComingSoonCard from '@/components/shared/ComingSoonCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { getDashboardSummary, getPlanList, getPlanReportList } from '@/services/api';

import AdminTopFiveMenuCard from '@/components/shared/admin/AdminTopFiveMenuCard';
import AdminPeakActivityCard from '@/components/shared/admin/AdminPeakActivityCard';
import AdminAIInsightsCard from '@/components/shared/admin/AdminAIInsightsCard';
import AdminSalesConcentrationCard from '@/components/shared/admin/AdminSalesConcentrationCard';
import AdminTopMenuRevenueShareCard from '@/components/shared/admin/AdminTopMenuRevenueShareCard';
import AdminBestRevenueHourCard from '@/components/shared/admin/AdminBestRevenueHourCard';

export default function DashboardPage() {
  const navigate = useNavigate();

  // Helper for today YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();

    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

    const yyyy = wib.getFullYear();
    const mm = String(wib.getMonth() + 1).padStart(2, '0');
    const dd = String(wib.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const parseLocalDate = (dateString) => {
    if (!dateString) return null;

    const [year, month, day] = dateString.split('-').map(Number);

    return new Date(year, month - 1, day);
  };

  const getLocalDateTimestamp = (dateString, endOfDay = false) => {
    const date = parseLocalDate(dateString);

    if (!date) return null;

    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date.getTime();
  };

  // Filter & Data States
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [chartMetric, setChartMetric] = useState('revenue'); // "revenue" | "cups"

  // Data State
  const [summaryData, setSummaryData] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Format Currency
  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);

  // Fetch Active Plan (to constrain date range & display Active Plan card)
  useEffect(() => {
    async function fetchActivePlan() {
      try {
        const res = await getPlanList({ status: 'active' });
        if (res.data?.success && res.data.data?.length > 0) {
          const plan = res.data.data[0];
          setActivePlan(plan);
          console.log('=== ACTIVE PLAN OBJECT ===');
          console.log(plan);
          console.log('=== POSSIBLE IDS ===');
          console.log('_id:', plan?._id);
          console.log('id:', plan?.id);
          console.log('planId:', plan?.planId);

          if (plan.startDate && plan.endDate) {
            const planStart = plan.startDate.split('T')[0];
            const planEnd = plan.endDate.split('T')[0];

            if (todayStr >= planStart && todayStr <= planEnd) {
              // Hari ini masih berada dalam periode plan
              setSelectedDate(todayStr);
            } else if (todayStr < planStart) {
              // Plan belum dimulai
              setSelectedDate(planStart);
            } else {
              // Plan sudah berakhir
              setSelectedDate(planEnd);
            }
          }
        } else {
          setActivePlan(null);
        }
      } catch (err) {
        console.error('Failed to load active plan:', err);
      }
    }
    fetchActivePlan();
  }, [todayStr]);

  // Fetch Pending Reports Count
  useEffect(() => {
    async function fetchPendingReports() {
      if (!activePlan?._id) {
        setPendingReportsCount(0);
        return;
      }

      try {
        const res = await getPlanReportList({
          planId: activePlan._id,
          status: 'pending',
        });

        if (res.data?.success) {
          setPendingReportsCount(res.data.data?.length || 0);
        } else {
          setPendingReportsCount(0);
        }
      } catch (err) {
        console.error('Failed to load pending reports:', err);
        setPendingReportsCount(0);
      }
    }

    fetchPendingReports();
  }, [activePlan]);

  // Fetch Dashboard Summary Data for Selected Date
  useEffect(() => {
    async function fetchSummary() {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      try {
        const res = await getDashboardSummary({
          planId: activePlan._id,
          date: selectedDate,
        });
        if (res.data?.success) {
          setSummaryData(res.data.data);
          // }
          // if (res.data?.success) {
          //   const data = res.data.data;

          //   // TEST MAPPING UI
          //   data.totalRevenue = 100000;
          //   data.totalUnitsSold = 8;

          //   data.hourlyTrends = data.hourlyTrends.map((item) =>
          //     item.hour === 10
          //       ? {
          //           ...item,
          //           revenue: 50000,
          //           unitsSold: 4,
          //         }
          //       : item,
          //   );

          //   console.log('TEST DATA:', data);

          //   setSummaryData(data);
        } else {
          setSummaryData(null);
        }
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
        toast.error('Failed to retrieve dashboard summary');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSummary();
  }, [activePlan, selectedDate]);

  // Date Picker Boundaries based on Active Plan
  const datePickerMin = useMemo(() => {
    if (!activePlan?.startDate) return undefined;
    return activePlan.startDate.split('T')[0];
  }, [activePlan]);

  const datePickerMax = useMemo(() => {
    if (!activePlan?.endDate) return todayStr;
    const planEnd = activePlan.endDate.split('T')[0];
    return planEnd < todayStr ? planEnd : todayStr;
  }, [activePlan, todayStr]);

  // 24-Hour Continuous Chart Data
  const chartData = useMemo(() => {
    const rawHourly = summaryData?.hourlyTrends || [];

    return Array.from({ length: 24 }, (_, i) => {
      const hourStr = `${String(i).padStart(2, '0')}:00`;
      const found = rawHourly.find((item) => item.hour === i);

      return {
        hour: hourStr,
        revenue: found?.revenue || 0,
        cups: found?.unitsSold || 0,
        // transactions: found?.totalTransactions || 0,
      };
    });
  }, [summaryData]);

  const dashboardHourlyTrends = summaryData?.hourlyTrends || [];
  const dashboardMenuBreakdown = summaryData?.menuBreakdown || [];

  // ============================================================
  // Dashboard Derived Analytics
  // ============================================================

  const averageRevenuePerCup = useMemo(() => {
    const totalRevenue = Number(summaryData?.totalRevenue || 0);
    const totalUnitsSold = Number(summaryData?.totalUnitsSold || 0);

    if (totalUnitsSold <= 0) {
      return 0;
    }

    return totalRevenue / totalUnitsSold;
  }, [summaryData]);

  const salesConcentration = useMemo(() => {
    const totalRevenue = Number(summaryData?.totalRevenue || 0);

    if (totalRevenue <= 0) {
      return {
        percentage: 0,
        revenue: 0,
        hours: [],
      };
    }

    const topHours = [...dashboardHourlyTrends]
      .filter((item) => Number(item.revenue || 0) > 0)
      .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
      .slice(0, 3);

    const concentratedRevenue = topHours.reduce((sum, item) => sum + Number(item.revenue || 0), 0);

    return {
      percentage: (concentratedRevenue / totalRevenue) * 100,
      revenue: concentratedRevenue,
      hours: topHours,
    };
  }, [summaryData, dashboardHourlyTrends]);

  const topMenuRevenueShare = useMemo(() => {
    const totalRevenue = Number(summaryData?.totalRevenue || 0);

    if (totalRevenue <= 0 || dashboardMenuBreakdown.length === 0) {
      return {
        menu: null,
        percentage: 0,
      };
    }

    const topMenu = [...dashboardMenuBreakdown].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0)).at(0);

    return {
      menu: topMenu,
      percentage: (Number(topMenu.revenue || 0) / totalRevenue) * 100,
    };
  }, [summaryData, dashboardMenuBreakdown]);

  const bestRevenueHour = useMemo(() => {
    const activeHours = dashboardHourlyTrends.filter((item) => Number(item.revenue || 0) > 0);

    if (activeHours.length === 0) {
      return null;
    }

    return [...activeHours].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))[0];
  }, [dashboardHourlyTrends]);

  // Format Date for Card
  const formatDateRange = (start, end) => {
    if (!start || !end) return '-';
    const s = new Date(start).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const e = new Date(end).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${s} - ${e}`;
  };

  // Custom Recharts Tooltip
  // eslint-disable-next-line react/prop-types
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-md text-xs font-sans space-y-1.5 min-w-[160px]">
          <div className="font-bold text-foreground font-heading border-b border-border pb-1">Time: {label}</div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Revenue:</span>
            <span className="font-semibold font-mono text-foreground">{formatRupiah(data.revenue)}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Cups Sold:</span>
            <span className="font-semibold font-mono text-orange-600 dark:text-orange-400">{data.cups} cups</span>
          </div>
          {/* <div className="flex justify-between items-center text-muted-foreground">
            <span>Transactions:</span>
            <span className="font-semibold font-mono text-foreground">{data.transactions} txns</span>
          </div> */}
        </div>
      );
    }
    return null;
  };

  const kpi = {
    totalRevenue: summaryData?.totalRevenue || 0,
    totalCupsSold: summaryData?.totalUnitsSold || 0,
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header with Action / Date Control */}
      <PageHeader
        title="Dashboard"
        action={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('h-9 justify-start text-left font-mono text-xs border-border bg-card gap-2 px-3', !selectedDate && 'text-muted-foreground')}>
                <CalendarIcon size={14} className="text-orange-600 shrink-0" />
                <span>{selectedDate ? format(parseLocalDate(selectedDate), 'dd MMM yyyy') : 'Select Date'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                defaultMonth={selectedDate ? parseLocalDate(selectedDate) : parseLocalDate(todayStr)}
                selected={selectedDate ? parseLocalDate(selectedDate) : undefined}
                onSelect={(d) => {
                  if (d) {
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    setSelectedDate(`${yyyy}-${mm}-${dd}`);
                  }
                }}
                disabled={(d) => {
                  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

                  const min = datePickerMin ? getLocalDateTimestamp(datePickerMin) : null;

                  const max = datePickerMax ? getLocalDateTimestamp(datePickerMax, true) : null;

                  return (min && day < min) || (max && day > max);
                }}
              />
            </PopoverContent>
          </Popover>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={formatRupiah(kpi.totalRevenue)} subtitle={`Sales on ${selectedDate}`} icon={DollarSign} />
        <StatCard title="Total Cups Sold" value={`${kpi.totalCupsSold.toLocaleString()} cups`} subtitle={`Volume on ${selectedDate}`} icon={Coffee} />
        <StatCard title="Avg. Revenue / Cup" value={formatRupiah(averageRevenuePerCup)} subtitle={kpi.totalCupsSold > 0 ? `Based on ${kpi.totalCupsSold} cups sold` : 'No sales recorded'} icon={TrendingUp} />
        {/* Active Plan Card */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Active Plan</CardTitle>
            <Layers className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {activePlan ? (
              <div>
                <div className="text-lg font-bold font-heading text-foreground truncate">{activePlan.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{formatDateRange(activePlan.startDate, activePlan.endDate)}</p>
              </div>
            ) : (
              <div>
                <div className="text-sm font-semibold text-muted-foreground">No Active Plan</div>
                <p className="text-xs text-muted-foreground mt-1">No production plan running currently.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Section: Sales Performance Chart & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart Card (Spans 2 Columns) */}
        <Card className="lg:col-span-2 bg-card border-border shadow-xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-bold font-heading flex items-center gap-2">
                <TrendingUp size={18} className="text-orange-600" />
                Sales Performance
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Hourly transaction volume & revenue tracking for {selectedDate}</p>
            </div>

            {/* Metric Toggle Button Group */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs">
              <Button
                variant={chartMetric === 'revenue' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartMetric('revenue')}
                className={`h-7 text-xs ${chartMetric === 'revenue' ? 'bg-[#F97316] text-white hover:bg-[#F97316]/90' : 'text-muted-foreground'}`}
              >
                Revenue
              </Button>
              <Button
                variant={chartMetric === 'cups' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartMetric('cups')}
                className={`h-7 text-xs ${chartMetric === 'cups' ? 'bg-[#F97316] text-white hover:bg-[#F97316]/90' : 'text-muted-foreground'}`}
              >
                Cups Sold
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-2 pb-4">
            {isLoading ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">Loading sales trend...</div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground font-mono" tickLine={false} axisLine={false} interval={2} />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      className="text-muted-foreground font-mono"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (chartMetric === 'revenue' ? (val >= 1000 ? `${val / 1000}k` : val) : val)}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area type="monotone" dataKey={chartMetric === 'revenue' ? 'revenue' : 'cups'} stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMetric)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel: AI Insights & Top 5 Menu (Coming Soon) */}
        <div className="flex flex-col gap-6">
          <AdminAIInsightsCard hourlyTrends={dashboardHourlyTrends} menuBreakdown={dashboardMenuBreakdown} />

          <AdminTopFiveMenuCard menus={dashboardMenuBreakdown} />
        </div>
      </div>

      {/* Derived Sales Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminSalesConcentrationCard percentage={salesConcentration.percentage} revenue={salesConcentration.revenue} hours={salesConcentration.hours} />

        <AdminTopMenuRevenueShareCard menu={topMenuRevenueShare.menu} percentage={topMenuRevenueShare.percentage} />

        <AdminBestRevenueHourCard hour={bestRevenueHour} />
      </div>

      {/* Bottom Grid: Peak Activity, Most Used Inventory, and Plan Report Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminPeakActivityCard hourlyTrends={dashboardHourlyTrends} />
        <ComingSoonCard title="Most Used Inventory" description="Raw ingredient consumption metrics and usage rate tracking." icon={Package} />

        {/* Live Plan Report Card */}
        <Card className="bg-card border-border shadow-xs flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Plan Report</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="text-2xl font-bold font-mono text-amber-600">{pendingReportsCount} reports</div>
              <p className="text-xs text-muted-foreground mt-1">Incident reports currently pending review from admin.</p>
            </div>

            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/production-plan/report?planId=${activePlan?._id}`)} className="w-full justify-between mt-1 text-xs border-border">
              <span>View Reports</span>
              <ChevronRight size={14} />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
