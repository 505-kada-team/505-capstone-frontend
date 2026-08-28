import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Printer, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


import api from "@/services/api";
import { getSaleHistory } from "@/services/cashierApi";
import { mapPlanDetail } from "@/services/plan/plan.mapper";
import { mapPlanReport } from "@/services/report/report.mapper";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDate } from "@/lib/formatDate";

export default function PlanAuditReport({ planId, onExportDataChange }) {
  const [plan, setPlan] = useState(null);
  const [sales, setSales] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch Audit Data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!planId) {
      const timer = setTimeout(() => {
        setPlan(null);
        setSales(null);
        setReports([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isActive = true;

    const fetchAuditData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [planRes, salesRes, reportsRes] = await Promise.all([
          api.get(`/plan/${planId}`),
          getSaleHistory({ planId }),
          api.get("/plan-reports", { params: { planId } }),
        ]);

        if (!isActive) return;

        const rawPlan = planRes.data?.data || planRes.data;
        const normalizedPlan = mapPlanDetail(rawPlan);
        if (normalizedPlan) {
          normalizedPlan.committedIngredients = rawPlan.committedIngredients || [];
        }
        
        const rawReports = reportsRes.data?.data ?? reportsRes.data ?? [];
        const mappedReports = Array.isArray(rawReports) 
          ? rawReports.map(mapPlanReport) 
          : [];

        setPlan(normalizedPlan);
        setSales(salesRes);
        setReports(mappedReports);
      } catch (err) {
        console.error("[PLAN AUDIT REPORT FETCH ERROR]", err);
        if (isActive) {
          setError(err.response?.data?.message ?? "Failed to load audit data");
          toast.error("Failed to load audit data");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchAuditData();

    return () => {
      isActive = false;
    };
  }, [planId]);

  // ── Financial Calculations ──────────────────────────────────────────────────
  const financialData = useMemo(() => {
    if (!plan || !sales) return null;

    // Aggregate sales per menu from transaction history
    const menuSalesMap = {};
    (sales.transactions || []).forEach((tx) => {
      (tx.items || []).forEach((item) => {
        const key = item.menuId;
        if (!menuSalesMap[key]) {
          menuSalesMap[key] = {
            menuId: key,
            menuName: item.menuName || "—",
            quantitySold: 0,
            revenue: 0,
            discountGiven: 0,
          };
        }
        const qty = Number(item.quantitySold || 0);
        const origPrice = Number(item.originalPrice || 0);
        const priceUsed = Number(item.priceUsed || 0);

        menuSalesMap[key].quantitySold += qty;
        menuSalesMap[key].revenue += qty * priceUsed;
        menuSalesMap[key].discountGiven += qty * Math.max(origPrice - priceUsed, 0);
      });
    });

    // Reconcile sales with plan.menus to guarantee alignment and accuracy
    const planMenuIds = new Set((plan.menus || []).map((m) => m.menuId));
    const menuSalesList = (plan.menus || []).map((menu) => {
      const txData = menuSalesMap[menu.menuId] || {
        quantitySold: 0,
        revenue: 0,
        discountGiven: 0,
      };

      // Fallback to plan's own soldQuantity and pricing (including discounts) if transaction history is empty or zero
      const hasTxData = txData.quantitySold > 0;
      const qty = hasTxData ? txData.quantitySold : (menu.soldQuantity || 0);

      // Extract original and actual (discounted) prices from plan
      const originalPrice = menu.frozenSellingPrice || menu.effectiveSellingPrice || 0;
      const actualPrice = menu.discountedPrice ?? menu.effectiveSellingPrice ?? menu.frozenSellingPrice ?? 0;

      const fallbackRevenue = qty * actualPrice;
      const fallbackDiscountGiven = qty * Math.max(originalPrice - actualPrice, 0);

      const revenue = hasTxData ? txData.revenue : fallbackRevenue;
      const discountGiven = hasTxData ? txData.discountGiven : fallbackDiscountGiven;

      return {
        menuId: menu.menuId,
        menuName: menu.name || "—",
        quantitySold: qty,
        revenue: revenue,
        discountGiven: discountGiven,
      };
    });

    // Add any menu sales from transaction history that are not in the plan menus (as safety net)
    Object.values(menuSalesMap).forEach((txData) => {
      if (!planMenuIds.has(txData.menuId)) {
        menuSalesList.push(txData);
      }
    });

    // 1. REVENUE
    const totalRevenue = menuSalesList.reduce((sum, item) => sum + item.revenue, 0);
    const totalDiscountGiven = menuSalesList.reduce((sum, item) => sum + item.discountGiven, 0);
    const totalTransactions = sales.summary?.totalTransaction || (totalRevenue > 0 ? (sales.transactions || []).length : 0);
    const totalItemsSold = menuSalesList.reduce((sum, item) => sum + item.quantitySold, 0);

    // 2. COGS / HPP
    // Committed Ingredients Cost
    let committedCost = 0;
    const committedIngredients = plan.committedIngredients || [];
    committedIngredients.forEach((ing) => {
      const batches = ing.batches || [];
      batches.forEach((batch) => {
        committedCost += Number(batch.quantityUsed || 0) * Number(batch.costPriceUsed || 0);
      });
    });

    // Replacement Cost (for approved ingredient reports that were deducted)
    const approvedIngredientReports = reports.filter(
      (r) => r.category === "ingredient" && r.status === "approved" && r.replacementDeducted === true
    );
    const replacementCost = approvedIngredientReports.reduce(
      (sum, r) => sum + Number(r.replacementCost || 0),
      0
    );

    const totalHpp = committedCost + replacementCost;

    // 3. NET PROFIT & MARGIN
    const netProfit = totalRevenue - totalHpp;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 4. OPERATIONAL WASTE & OPPORTUNITY LOSS (category menu)
    const approvedMenuReports = reports.filter(
      (r) => r.category === "menu" && r.status === "approved"
    );
    const operationalWasteCost = approvedMenuReports.reduce(
      (sum, r) => sum + Number(r.valuation?.costLoss || 0),
      0
    );
    const opportunityRevenueLoss = approvedMenuReports.reduce(
      (sum, r) => sum + Number(r.valuation?.lostRevenueEstimate || 0),
      0
    );

    return {
      totalRevenue,
      totalDiscountGiven,
      totalTransactions,
      totalItemsSold,
      menuSalesList,
      committedCost,
      replacementCost,
      totalHpp,
      netProfit,
      profitMargin,
      approvedIngredientReports,
      approvedMenuReports,
      operationalWasteCost,
      opportunityRevenueLoss,
    };
  }, [plan, sales, reports]);

  // ── CSV Export Data Synchronization ─────────────────────────────────────────
  useEffect(() => {
    if (!plan || !financialData) return;

    const {
      totalRevenue,
      totalDiscountGiven,
      totalHpp,
      netProfit,
      profitMargin,
      approvedIngredientReports,
      approvedMenuReports,
    } = financialData;

    const csvRows = [
      { section: "Artisan Inventory - Financial Plan Audit Report", category: "", quantity: "", unit: "", unitPrice: "", totalAmount: "" },
      { section: `Plan Name: ${plan.name}`, category: "", quantity: "", unit: "", unitPrice: "", totalAmount: "" },
      { section: `Period: ${plan.startDate ? new Date(plan.startDate).toISOString().slice(0,10) : "—"} to ${plan.endDate ? new Date(plan.endDate).toISOString().slice(0,10) : "—"}`, category: "", quantity: "", unit: "", unitPrice: "", totalAmount: "" },
      { section: `Status: ${plan.status.toUpperCase()}`, category: "", quantity: "", unit: "", unitPrice: "", totalAmount: "" },
      { section: "", category: "", quantity: "", unit: "", unitPrice: "", totalAmount: "" },
      
      // REVENUE
      { section: "REVENUE", category: "Total Sales Revenue", quantity: "", unit: "", unitPrice: "", totalAmount: totalRevenue },
      { section: "REVENUE", category: "Total Discounts Given", quantity: "", unit: "", unitPrice: "", totalAmount: totalDiscountGiven },
      
      // HPP COMMITTED
      ...plan.committedIngredients.flatMap(ing => (ing.batches || []).map(batch => ({
        section: "COST",
        category: `Committed Ingredient: ${ing.nameInventory}`,
        quantity: batch.quantityUsed,
        unit: "qty",
        unitPrice: batch.costPriceUsed,
        totalAmount: Number(batch.quantityUsed || 0) * Number(batch.costPriceUsed || 0)
      }))),
      
      // HPP REPLACEMENT
      ...approvedIngredientReports.map(rep => ({
        section: "COST",
        category: `Replacement Ingredient: ${rep.nameRef || rep.refId}`,
        quantity: rep.replacementQuantity ?? rep.quantityLost,
        unit: "qty",
        unitPrice: rep.replacementQuantity ? Math.round(rep.replacementCost / rep.replacementQuantity) : 0,
        totalAmount: rep.replacementCost || 0
      })),
      
      { section: "COST", category: "Total HPP (COGS)", quantity: "", unit: "", unitPrice: "", totalAmount: totalHpp },
      
      // PROFIT
      { section: "PROFIT", category: "Net Profit", quantity: "", unit: "", unitPrice: "", totalAmount: netProfit },
      { section: "PROFIT", category: "Profit Margin (%)", quantity: "", unit: "", unitPrice: "", totalAmount: `${profitMargin.toFixed(1)}%` },
      
      // WASTE
      ...approvedMenuReports.map(rep => ({
        section: "WASTE",
        category: `Operational Waste (Menu): ${rep.nameRef || rep.refId}`,
        quantity: rep.quantityLost,
        unit: "portions",
        unitPrice: rep.valuation?.unitCostAtLoss || 0,
        totalAmount: rep.valuation?.costLoss || 0
      })),
      ...approvedMenuReports.map(rep => ({
        section: "WASTE",
        category: `Opportunity Revenue Loss: ${rep.nameRef || rep.refId}`,
        quantity: rep.quantityLost,
        unit: "portions",
        unitPrice: rep.valuation?.priceUsedAtLoss || 0,
        totalAmount: rep.valuation?.lostRevenueEstimate || 0
      }))
    ];

    onExportDataChange?.({
      filename: `financial-audit-${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      columns: [
        { key: "section", label: "Section" },
        { key: "category", label: "Category/Item Name" },
        { key: "quantity", label: "Quantity" },
        { key: "unit", label: "Unit" },
        { key: "unitPrice", label: "Unit Price/Cost" },
        { key: "totalAmount", label: "Total Amount" }
      ],
      rows: csvRows,
    });
  }, [plan, financialData, onExportDataChange]);

  // ── Render Helpers ──────────────────────────────────────────────────────────
  if (!planId) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Please select a Production Plan from the filter above to begin auditing.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-border pb-5 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 bg-muted/60" />
            <Skeleton className="h-4 w-32 bg-muted/60" />
          </div>
          <div className="space-y-2 text-left md:text-right">
            <Skeleton className="h-4 w-24 bg-muted/60 ml-0 md:ml-auto" />
            <Skeleton className="h-5 w-40 bg-muted/60 ml-0 md:ml-auto" />
          </div>
        </div>

        {/* Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-card p-5 space-y-2">
              <Skeleton className="h-3 w-16 bg-muted/60" />
              <Skeleton className="h-6 w-24 bg-muted/60" />
              <Skeleton className="h-3 w-32 bg-muted/60" />
            </div>
          ))}
        </div>

        {/* Audit Details Card Skeleton */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-40 bg-muted/60" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full bg-muted/60" />
            <Skeleton className="h-8 w-full bg-muted/60" />
            <Skeleton className="h-8 w-full bg-muted/60" />
            <Skeleton className="h-8 w-full bg-muted/60" />
          </div>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive flex flex-col items-center gap-2">
        <AlertCircle size={24} />
        <p className="font-semibold">Error Loading Audit Report</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!plan || !financialData) return null;

  const {
    totalRevenue,
    totalDiscountGiven,
    totalTransactions,
    totalItemsSold,
    menuSalesList,
    committedCost,
    replacementCost,
    totalHpp,
    netProfit,
    profitMargin,
    approvedIngredientReports,
    approvedMenuReports,
    operationalWasteCost,
    opportunityRevenueLoss,
  } = financialData;

  const committedIngredients = plan.committedIngredients || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* CSS print utility stylesheet */}
      <style>{`
        @media print {
          /* Hide all UI shell elements */
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 30px;
            background: white;
            color: #2D241E;
            font-family: 'Work Sans', sans-serif;
          }
          .no-print {
            display: none !important;
          }
          /* Custom print format rules */
          tr, table, .print-card {
            page-break-inside: avoid;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border-bottom: 1px solid #E6D5C3 !important;
            color: #2D241E !important;
          }
        }
      `}</style>

      {/* Main Print Container */}
      <div id="print-area" className="flex flex-col gap-6">
        
        {/* PDF Header (styled like PT. Sukses Kemilau example) */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-border pb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground mt-1">Laporan Laba &amp; Rugi</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Plan: {plan.name}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs text-muted-foreground">Periode Plan</p>
            <p className="text-sm font-semibold text-foreground mt-1">
              {formatDate(plan.startDate)} — {formatDate(plan.endDate)}
            </p>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium uppercase ${
              plan.status === "active" ? "bg-success/10 text-success" : "bg-neutral-200 text-neutral-600"
            }`}>
              {plan.status}
            </span>
          </div>
        </div>

        {/* 1. Summary Cards (P&L KPI Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x rounded-lg border border-border bg-card p-6 print-card">
          <div className="flex flex-col gap-1 md:pr-4">
            <p className="text-xs text-muted-foreground font-medium">Total Pendapatan Bersih</p>
            <p className="text-lg font-bold text-success font-mono">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {totalTransactions > 0
                ? `${totalTransactions} transaksi tercatat`
                : `${totalItemsSold} porsi terjual (plan)`}
            </p>
          </div>
          <div className="flex flex-col gap-1 pt-4 md:pt-0 md:px-4">
            <p className="text-xs text-muted-foreground font-medium">Harga Pokok Penjualan (HPP)</p>
            <p className="text-lg font-bold text-foreground font-mono">
              {formatCurrency(totalHpp)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Bahan baku + Penggantian
            </p>
          </div>
          <div className="flex flex-col gap-1 pt-4 md:pt-0 md:px-4 bg-secondary/20 rounded-md p-2">
            <p className="text-xs text-muted-foreground font-medium">Laba Bersih Plan</p>
            <p className="text-lg font-bold text-foreground font-mono">
              {formatCurrency(netProfit)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Total Revenue - Total HPP
            </p>
          </div>
          <div className="flex flex-col gap-1 pt-4 md:pt-0 md:pl-4">
            <p className="text-xs text-muted-foreground font-medium">Profit Margin (%)</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-mono ${
                profitMargin >= 30 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              }`}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Target Margin: &gt;= 30.0%
            </p>
          </div>
        </div>

        {/* 2. Structured P&L Statement (Zahir Accounting Style) */}
        <div className="rounded-lg border border-border bg-card p-6 print-card flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground font-heading">Rincian Laba Rugi Terstruktur</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-2 px-4 font-semibold text-foreground">Deskripsi Keuangan</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-right">Rincian</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-right">Total Nominal</th>
                </tr>
              </thead>
              <tbody>
                {/* REVENUE SECTION */}
                <tr className="font-semibold text-foreground bg-muted/10">
                  <td className="py-2 px-4" colSpan={3}>PENDAPATAN</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pl-8 text-muted-foreground">Pendapatan Jual Kotor (Realisasi Kasir)</td>
                  <td className="py-2 px-4 text-right font-mono">{formatCurrency(totalRevenue + totalDiscountGiven)}</td>
                  <td className="py-2 px-4 text-right font-mono">—</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-4 pl-8 text-muted-foreground">Potongan Diskon Penjualan</td>
                  <td className="py-2 px-4 text-right font-mono">({formatCurrency(totalDiscountGiven)})</td>
                  <td className="py-2 px-4 text-right font-mono">—</td>
                </tr>
                <tr className="font-semibold text-foreground bg-muted/5">
                  <td className="py-2 px-4 pl-4">Total Pendapatan Bersih</td>
                  <td className="py-2 px-4 text-right font-mono">—</td>
                  <td className="py-2 px-4 text-right font-mono text-success">{formatCurrency(totalRevenue)}</td>
                </tr>

                {/* HPP SECTION */}
                <tr className="font-semibold text-foreground bg-muted/10">
                  <td className="py-2 px-4 mt-2" colSpan={3}>HARGA POKOK PENJUALAN (HPP)</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 pl-8 text-muted-foreground">Biaya Alokasi Bahan Baku Awal (Committed)</td>
                  <td className="py-2 px-4 text-right font-mono">{formatCurrency(committedCost)}</td>
                  <td className="py-2 px-4 text-right font-mono">—</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 px-4 pl-8 text-muted-foreground">Biaya Penggantian Stok Tambahan (Replacement)</td>
                  <td className="py-2 px-4 text-right font-mono">{formatCurrency(replacementCost)}</td>
                  <td className="py-2 px-4 text-right font-mono">—</td>
                </tr>
                <tr className="font-semibold text-foreground bg-muted/5 border-b border-border">
                  <td className="py-2 px-4 pl-4">Total Harga Pokok Penjualan</td>
                  <td className="py-2 px-4 text-right font-mono">—</td>
                  <td className="py-2 px-4 text-right font-mono">({formatCurrency(totalHpp)})</td>
                </tr>

                {/* LABA KOTOR */}
                <tr className="font-bold text-foreground bg-secondary/10">
                  <td className="py-3 px-4">LABA BERSIH OPERASIONAL PLAN</td>
                  <td className="py-3 px-4 text-right font-mono">—</td>
                  <td className="py-3 px-4 text-right font-mono text-lg">{formatCurrency(netProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2.5 Detailed Menu Sales (Revenue Breakdown) */}
        <div className="rounded-lg border border-border bg-card p-6 print-card flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground font-heading">Audit Realisasi Penjualan Menu</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-2 px-4 font-semibold text-foreground">Nama Menu</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-center">Jumlah Terjual</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-right">Diskon Diberikan</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-right">Total Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {menuSalesList.length === 0 ? (
                  <tr>
                    <td className="py-4 px-4 text-center text-muted-foreground" colSpan={4}>
                      Belum ada penjualan tercatat untuk plan ini.
                    </td>
                  </tr>
                ) : (
                  menuSalesList.map((menu) => (
                    <tr key={menu.menuId} className="border-b border-border hover:bg-muted/10">
                      <td className="py-2 px-4 text-foreground font-medium">{menu.menuName}</td>
                      <td className="py-2 px-4 text-center font-mono">{menu.quantitySold.toLocaleString("id-ID")} porsi</td>
                      <td className="py-2 px-4 text-right font-mono text-muted-foreground">
                        {menu.discountGiven > 0 ? formatCurrency(menu.discountGiven) : "—"}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-success">
                        {formatCurrency(menu.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Detailed Ingredient Costs (Cost Breakdown) */}
        <div className="rounded-lg border border-border bg-card p-6 print-card flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground font-heading">Audit Alokasi Bahan Baku (HPP Awal)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-2 px-4 font-semibold text-foreground">Nama Bahan Baku</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-center">Jumlah Dipakai</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-right">Estimasi Biaya Satuan</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-right">Total Biaya Alokasi</th>
                </tr>
              </thead>
              <tbody>
                {committedIngredients.length === 0 ? (
                  <tr>
                    <td className="py-4 px-4 text-center text-muted-foreground" colSpan={4}>
                      No committed ingredients found for this plan.
                    </td>
                  </tr>
                ) : (
                  committedIngredients.flatMap((ing) => {
                    const batches = ing.batches || [];
                    if (batches.length === 0) {
                      return (
                        <tr key={ing.inventoryId} className="border-b border-border">
                          <td className="py-2 px-4 text-foreground">{ing.nameInventory}</td>
                          <td className="py-2 px-4 text-center font-mono">—</td>
                          <td className="py-2 px-4 text-right font-mono">—</td>
                          <td className="py-2 px-4 text-right font-mono">—</td>
                        </tr>
                      );
                    }

                    return batches.map((batch, index) => (
                      <tr key={`${ing.inventoryId}-${batch.subInventoryId}`} className="border-b border-border hover:bg-muted/10">
                        <td className="py-2 px-4 text-foreground">
                          {index === 0 ? ing.nameInventory : ""}
                          {index > 0 && <span className="text-[10px] text-muted-foreground block pl-2">↳ Batch: {batch.subInventoryId}</span>}
                        </td>
                        <td className="py-2 px-4 text-center font-mono">
                          {batch.quantityUsed.toLocaleString("id-ID")} {ing.unit || ""}
                        </td>
                        <td className="py-2 px-4 text-right font-mono">
                          {formatCurrency(batch.costPriceUsed)}
                        </td>
                        <td className="py-2 px-4 text-right font-mono">
                          {formatCurrency(Number(batch.quantityUsed || 0) * Number(batch.costPriceUsed || 0))}
                        </td>
                      </tr>
                    ));
                  })
                )}
                <tr className="font-semibold text-foreground bg-muted/20">
                  <td className="py-2 px-4" colSpan={3}>Subtotal Biaya Bahan Baku Awal (Committed)</td>
                  <td className="py-2 px-4 text-right font-mono">{formatCurrency(committedCost)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Replacement Stock Audit (Additional Costs) */}
        {replacementCost > 0 && (
          <div className="rounded-lg border border-border bg-card p-6 print-card flex flex-col gap-4">
            <h2 className="text-base font-semibold text-foreground font-heading">Audit Biaya Penggantian Insiden (Replacement COGS)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="py-2 px-4 font-semibold text-foreground">Bahan Baku Pengganti</th>
                    <th className="py-2 px-4 font-semibold text-foreground text-center">Jumlah Penggantian</th>
                    <th className="py-2 px-4 font-semibold text-foreground text-right">Total Biaya Penggantian</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedIngredientReports.map((rep) => (
                    <tr key={rep.id} className="border-b border-border hover:bg-muted/10">
                      <td className="py-2 px-4 text-foreground">
                        <div>
                          <p>{rep.nameRef || rep.refId}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Alasan: {rep.reason}</p>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-center font-mono">
                        {Number(rep.replacementQuantity ?? rep.quantityLost).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {formatCurrency(rep.replacementCost)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold text-foreground bg-muted/20">
                    <td className="py-2 px-4" colSpan={2}>Subtotal Biaya Tambahan (Replacement)</td>
                    <td className="py-2 px-4 text-right font-mono">{formatCurrency(replacementCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Waste & Opportunity Loss Audit (Operational Auditing) */}
        <div className="rounded-lg border border-border bg-card p-6 print-card flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground font-heading">Audit Kerugian &amp; Inefisiensi</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Taksiran kerugian operasional dan potensi omzet yang terbuang</p>
            </div>
            <div className="flex flex-wrap gap-4 text-right">
              <div>
                <p className="text-[10px] text-muted-foreground">Total Kerugian HPP (Waste)</p>
                <p className="text-sm font-semibold text-destructive font-mono">{formatCurrency(operationalWasteCost)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Estimasi Kehilangan Omzet</p>
                <p className="text-sm font-semibold text-warning font-mono">{formatCurrency(opportunityRevenueLoss)}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="py-2 px-4 font-semibold text-foreground">Menu Rusak/Hilang</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-center">Jumlah Rugi</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-right">Kerugian HPP</th>
                  <th className="py-2 px-4 font-semibold text-foreground text-right">Estimasi Potensi Omzet</th>
                </tr>
              </thead>
              <tbody>
                {approvedMenuReports.length === 0 ? (
                  <tr>
                    <td className="py-4 px-4 text-center text-muted-foreground" colSpan={4}>
                      Tidak ada laporan kerusakan porsi menu yang disetujui.
                    </td>
                  </tr>
                ) : (
                  approvedMenuReports.map((rep) => (
                    <tr key={rep.id} className="border-b border-border hover:bg-muted/10">
                      <td className="py-2 px-4 text-foreground">
                        <div>
                          <p className="font-medium">{rep.nameRef || rep.refId}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDate(rep.incidentAt)} • Alasan: {rep.reason}
                          </p>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-center font-mono">
                        {rep.quantityLost} porsi
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-destructive">
                        {formatCurrency(rep.valuation?.costLoss)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-warning">
                        {formatCurrency(rep.valuation?.lostRevenueEstimate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            *Catatan: Kerugian HPP (Waste) merupakan bagian dari Biaya Alokasi Bahan Baku Awal (Committed Cost) yang sudah terbuang sia-sia akibat insiden dapur/kasir.
          </p>
        </div>

        {/* 6. Signature Area (Print only) */}
        <div className="mt-12 hidden print:flex justify-between items-center px-12 pt-6">
          <div className="flex flex-col items-center">
            <p className="text-xs text-foreground">Prepared by,</p>
            <div className="h-20 w-40 border-b border-dashed border-muted-foreground/40 mt-2"></div>
            <p className="text-xs font-semibold text-foreground mt-2">( Cashier / Auditor Admin )</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-xs text-foreground">Approved by,</p>
            <div className="h-20 w-40 border-b border-dashed border-muted-foreground/40 mt-2"></div>
            <p className="text-xs font-semibold text-foreground mt-2">( Owner / Store Manager )</p>
          </div>
        </div>

      </div>

      {/* Action Toolbar (Screen only) */}
      <div className="flex justify-end no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 h-9 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        >
          <Printer size={16} />
          Export PDF (Print)
        </button>
      </div>
    </div>
  );
}
