import { useNavigate } from 'react-router-dom';
import { DollarSign, Coffee, Calendar as CalendarIcon, Package, AlertTriangle, ChevronRight, TrendingUp, Layers } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { parseLocalDate, getLocalDateTimestamp, formatDateRange } from '@/lib/dateUtils';
import { formatRupiah } from '@/lib/formatCurrency';

import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import useDashboardData from '@/hooks/useDashboardData';

import AdminTopFiveMenuCard from '@/components/shared/admin/AdminTopFiveMenuCard';
import AdminPeakActivityCard from '@/components/shared/admin/AdminPeakActivityCard';
import AdminAIInsightsCard from '@/components/shared/admin/AdminAIInsightsCard';
import AdminSalesConcentrationCard from '@/components/shared/admin/AdminSalesConcentrationCard';
import AdminTopMenuRevenueShareCard from '@/components/shared/admin/AdminTopMenuRevenueShareCard';
import AdminBestRevenueHourCard from '@/components/shared/admin/AdminBestRevenueHourCard';

export default function DashboardPage() {
  const navigate = useNavigate();

  const {
    todayStr,

    selectedDate,
    setSelectedDate,

    chartMetric,
    setChartMetric,

    activePlan,
    pendingReportsCount,

    isLoading,

    chartData,
    hourlyTrends,
    menuBreakdown,

    kpi,

    averageRevenuePerCup,
    salesConcentration,
    topMenuRevenueShare,
    bestRevenueHour,

    datePickerMin,
    datePickerMax,
  } = useDashboardData();

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

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
      </div>
    );
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
          <AdminAIInsightsCard hourlyTrends={hourlyTrends} menuBreakdown={menuBreakdown} />

          <AdminTopFiveMenuCard menus={menuBreakdown} />
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
        <AdminPeakActivityCard hourlyTrends={hourlyTrends} />

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
