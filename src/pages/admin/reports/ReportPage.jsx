import { useEffect, useState } from "react";
import { Download, FileText, Filter, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import WasteReport from "./components/WasteReport";
import SalesReport from "./components/SalesReport";
import ProductionPlanReport from "./components/ProductionPlanReport";
import InventoryReport from "./components/InventoryReport";
import PlanAuditReport from "./components/PlanAuditReport";
import { useReportFilter } from "@/hooks/report/useReportFilter";
import { getPlanList } from "@/services/api";

export default function ReportPage() {
  const {
    reportType,
    setReportType,
    planId,
    setPlanId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    appliedFilter,
    exportData,
    handleApplyFilter,
    handleReset,
    handleExportDataChange,
    handleExportCsv,
  } = useReportFilter();

  const [selectablePlans, setSelectablePlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    const fetchSelectablePlans = async () => {
      setIsLoadingPlans(true);

      try {
        const response = await getPlanList({ limit: 100 });
        const plans = response.data?.data ?? [];

        const filteredPlans = Array.isArray(plans)
          ? plans.filter((plan) => plan.status !== "draft" && plan.status !== "cancelled")
          : [];

        setSelectablePlans(filteredPlans);
      } catch (error) {
        console.error("[SELECTABLE PLAN ERROR]", error);
        setSelectablePlans([]);
        toast.error("Failed to load plans.");
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchSelectablePlans();
  }, []);

  //   useEffect(() => {
  //   if (reportType === "inventory") {
  //     setPlanId("");
  //   }
  // }, [reportType, setPlanId]);

  const renderReport = () => {
    const commonProps = {
      planId: appliedFilter.planId,
      startDate: appliedFilter.startDate,
      endDate: appliedFilter.endDate,
      onExportDataChange: handleExportDataChange,
    };

    switch (appliedFilter.reportType) {
      case "sales":
        return <SalesReport {...commonProps} />;
      case "plan":
        return <ProductionPlanReport {...commonProps} />;
      case "waste":
        return <WasteReport {...commonProps} />;
      case "inventory":
        return <InventoryReport {...commonProps} />;
      case "plan_audit":
        return (
          <PlanAuditReport
            planId={appliedFilter.planId}
            onExportDataChange={handleExportDataChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader title="Report" />

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10">
            <FileText size={20} strokeWidth={2} className="text-accent" />
          </div>

          <div>
            <h2 className="text-lg font-semibold leading-none text-foreground">
              Report Generator
            </h2>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Filter operational reports by plan, type, and period.
            </p>
          </div>
        </div>

        <Separator />

        {/* Filter fields */}
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="reportType">Report Type</Label>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType" className="w-full">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="sales">Sales Report</SelectItem>
                <SelectItem value="plan">Production Plan Report</SelectItem>
                <SelectItem value="waste">Waste & Loss Report</SelectItem>
                <SelectItem value="inventory">Inventory Report</SelectItem>
                <SelectItem value="plan_audit">Plan Profit &amp; Loss Audit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="planId">Plan</Label>
              <Select
                value={
                  reportType === "inventory" || reportType === "plan"
                    ? ""
                    : planId
                }
                onValueChange={setPlanId}
                disabled={
                  reportType === "inventory" ||
                  reportType === "plan" ||
                  isLoadingPlans ||
                  selectablePlans.length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      reportType === "inventory"
                        ? "Not applicable"
                        : reportType === "plan"
                          ? "All completed plans"
                          : isLoadingPlans
                            ? "Loading plans..."
                            : selectablePlans.length === 0
                              ? "No plans found"
                              : "Select production plan"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {selectablePlans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date</Label>

            <Input
              id="startDate"
              type="date"
              value={reportType === "plan_audit" ? "" : startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={reportType === "plan_audit"}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date</Label>

            <Input
              id="endDate"
              type="date"
              value={reportType === "plan_audit" ? "" : endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={reportType === "plan_audit"}
            />
          </div>
        </div>

        {/* Action toolbar */}
        <div className="flex flex-col gap-3 bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button onClick={handleApplyFilter} className="gap-2">
              <Filter size={16} />
              Apply Filter
            </Button>

            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={exportData.rows.length === 0}
            className="gap-2"
          >
            <Download size={16} />
            Export CSV
          </Button>
        </div>
      </section>

      {renderReport()}
    </div>
  );
}