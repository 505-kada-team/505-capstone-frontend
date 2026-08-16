import { useEffect, useMemo, useState } from 'react';
import {
  getDashboardSummary,
  getPlanList,
  getPlanReportList,
} from '@/services/api';

const WIB_OFFSET = 7;

const convertUtcHourToWib = (hour) => {
  const utcHour = Number(hour);

  if (!Number.isFinite(utcHour)) {
    return null;
  }

  return (utcHour + WIB_OFFSET) % 24;
};

const getTodayWIB = () => {
  const now = new Date();

  const wib = new Date(
    now.toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    }),
  );

  const yyyy = wib.getFullYear();
  const mm = String(wib.getMonth() + 1).padStart(2, '0');
  const dd = String(wib.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

const useDashboardData = () => {
  const todayStr = useMemo(() => getTodayWIB(), []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [chartMetric, setChartMetric] = useState('revenue');

  const [summaryData, setSummaryData] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  // ============================================================
  // Fetch Active Plan
  // ============================================================

  useEffect(() => {
    async function fetchActivePlan() {
      setIsPlanLoading(true);

      try {
        const res = await getPlanList({
          status: 'active',
        });

        if (
          res.data?.success &&
          res.data.data?.length > 0
        ) {
          const plan = res.data.data[0];

          setActivePlan(plan);

          if (plan.startDate && plan.endDate) {
            const planStart =
              plan.startDate.split('T')[0];

            const planEnd =
              plan.endDate.split('T')[0];

            if (
              todayStr >= planStart &&
              todayStr <= planEnd
            ) {
              setSelectedDate(todayStr);
            } else if (todayStr < planStart) {
              setSelectedDate(planStart);
            } else {
              setSelectedDate(planEnd);
            }
          }
        } else {
          setActivePlan(null);
        }
      } catch (error) {
        console.error(
          'Failed to load active plan:',
          error,
        );

        setActivePlan(null);
      } finally {
        setIsPlanLoading(false);
      }
    }

    fetchActivePlan();
  }, [todayStr]);

  // ============================================================
  // Fetch Dashboard Summary
  // ============================================================

  useEffect(() => {
    async function fetchSummary() {
      if (!activePlan?._id) {
        setSummaryData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const res = await getDashboardSummary({
          planId: activePlan._id,
          date: selectedDate,
        });

        if (res.data?.success) {
          setSummaryData(res.data.data);
        } else {
          setSummaryData(null);
        }
      } catch (error) {
        console.error(
          'Failed to load dashboard summary:',
          error,
        );

        setSummaryData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [activePlan, selectedDate]);

  // ============================================================
  // Fetch Pending Plan Reports
  // ============================================================

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
          setPendingReportsCount(
            res.data.data?.length || 0,
          );
        } else {
          setPendingReportsCount(0);
        }
      } catch (error) {
        console.error(
          'Failed to load pending reports:',
          error,
        );

        setPendingReportsCount(0);
      }
    }

    fetchPendingReports();
  }, [activePlan]);

  // ============================================================
  // Normalize Hourly Trends UTC -> WIB
  // ============================================================

  const hourlyTrends = useMemo(() => {
    const trends =
      summaryData?.hourlyTrends || [];

    return trends
      .map((item) => {
        const wibHour =
          convertUtcHourToWib(item.hour);

        if (wibHour === null) {
          return null;
        }

        return {
          ...item,
          hour: wibHour,
        };
      })
      .filter(Boolean);
  }, [summaryData]);

  // ============================================================
  // Chart Data
  // ============================================================

  const chartData = useMemo(() => {
    return Array.from(
      { length: 24 },
      (_, hour) => {
        const found = hourlyTrends.find(
          (item) => item.hour === hour,
        );

        return {
          hour: `${String(hour).padStart(
            2,
            '0',
          )}:00`,
          revenue: Number(
            found?.revenue || 0,
          ),
          cups: Number(
            found?.unitsSold || 0,
          ),
        };
      },
    );
  }, [hourlyTrends]);

  // ============================================================
  // Dashboard Source Data
  // ============================================================

  const menuBreakdown =
    summaryData?.menuBreakdown || [];

  // ============================================================
  // Derived Analytics
  // ============================================================

  const averageRevenuePerCup = useMemo(() => {
    const revenue = Number(
      summaryData?.totalRevenue || 0,
    );

    const cups = Number(
      summaryData?.totalUnitsSold || 0,
    );

    return cups > 0
      ? revenue / cups
      : 0;
  }, [summaryData]);

  const salesConcentration = useMemo(() => {
    const totalRevenue = Number(
      summaryData?.totalRevenue || 0,
    );

    if (totalRevenue <= 0) {
      return {
        percentage: 0,
        revenue: 0,
        hours: [],
      };
    }

    const topHours = [...hourlyTrends]
      .filter(
        (item) =>
          Number(item.revenue || 0) > 0,
      )
      .sort(
        (a, b) =>
          Number(b.revenue || 0) -
          Number(a.revenue || 0),
      )
      .slice(0, 3);

    const concentratedRevenue =
      topHours.reduce(
        (sum, item) =>
          sum +
          Number(item.revenue || 0),
        0,
      );

    return {
      percentage:
        (concentratedRevenue /
          totalRevenue) *
        100,
      revenue: concentratedRevenue,
      hours: topHours,
    };
  }, [summaryData, hourlyTrends]);

  const topMenuRevenueShare = useMemo(() => {
    const totalRevenue = Number(
      summaryData?.totalRevenue || 0,
    );

    if (
      totalRevenue <= 0 ||
      menuBreakdown.length === 0
    ) {
      return {
        menu: null,
        percentage: 0,
      };
    }

    const topMenu = [...menuBreakdown].sort(
      (a, b) =>
        Number(b.revenue || 0) -
        Number(a.revenue || 0),
    )[0];

    return {
      menu: topMenu,
      percentage:
        (Number(
          topMenu.revenue || 0,
        ) /
          totalRevenue) *
        100,
    };
  }, [summaryData, menuBreakdown]);

  const bestRevenueHour = useMemo(() => {
    return (
      [...hourlyTrends]
        .filter(
          (item) =>
            Number(item.revenue || 0) >
            0,
        )
        .sort(
          (a, b) =>
            Number(b.revenue || 0) -
            Number(a.revenue || 0),
        )[0] || null
    );
  }, [hourlyTrends]);

  // ============================================================
  // Date Picker Boundaries
  // ============================================================

  const datePickerMin = useMemo(() => {
    return activePlan?.startDate?.split(
      'T',
    )[0];
  }, [activePlan]);

  const datePickerMax = useMemo(() => {
    if (!activePlan?.endDate) {
      return todayStr;
    }

    const planEnd =
      activePlan.endDate.split('T')[0];

    return planEnd < todayStr
      ? planEnd
      : todayStr;
  }, [activePlan, todayStr]);

  // ============================================================
  // KPI
  // ============================================================

  const kpi = {
    totalRevenue: Number(
      summaryData?.totalRevenue || 0,
    ),
    totalCupsSold: Number(
      summaryData?.totalUnitsSold || 0,
    ),
  };

  return {
    todayStr,

    selectedDate,
    setSelectedDate,

    chartMetric,
    setChartMetric,

    summaryData,
    activePlan,
    pendingReportsCount,

    isLoading,
    isPlanLoading,

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
  };
};

export default useDashboardData;