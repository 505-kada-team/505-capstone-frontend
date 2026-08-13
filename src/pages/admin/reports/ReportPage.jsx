import { useCallback, useState } from "react";
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

const INITIAL_FILTER = {
  reportType: "waste",
  startDate: "",
  endDate: "",
};

export default function ReportPage() {
  const [reportType, setReportType] = useState(INITIAL_FILTER.reportType);
  const [startDate, setStartDate] = useState(INITIAL_FILTER.startDate);
  const [endDate, setEndDate] = useState(INITIAL_FILTER.endDate);
  const [appliedFilter, setAppliedFilter] = useState(INITIAL_FILTER);

  const [exportData, setExportData] = useState({
    filename: "",
    columns: [],
    rows: [],
  });

  const handleExportDataChange = useCallback((data) => {
    setExportData(data);
  }, []);

  const handleApplyFilter = () => {
    if (startDate && endDate && startDate > endDate) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }

    setAppliedFilter({ reportType, startDate, endDate });
  };

  const handleReset = () => {
    setReportType(INITIAL_FILTER.reportType);
    setStartDate(INITIAL_FILTER.startDate);
    setEndDate(INITIAL_FILTER.endDate);
    setAppliedFilter(INITIAL_FILTER);
  };

  const renderReport = () => {
    const commonProps = {
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
      default:
        return null;
    }
  };

  const escapeCsvValue = (value) => {
    const text = String(value ?? "");

    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
  };

  const handleExport = () => {
    if (!exportData.rows.length) {
      toast.error("No data available to export.");
      return;
    }

    const header = exportData.columns
      .map((column) => escapeCsvValue(column.label))
      .join(",");

    const body = exportData.rows.map((row) =>
      exportData.columns
        .map((column) => escapeCsvValue(row[column.key]))
        .join(","),
    );

    const csv = [header, ...body].join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${exportData.filename || "report"}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <PageHeader title="Report" />

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10">
            <FileText size={20} strokeWidth={2} className="text-accent" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground leading-none">
              Report Generator
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Filter operational reports by type and period.
            </p>
          </div>
        </div>

        <Separator />

        {/* Filter fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
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
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date</Label>

            <Input
              id="startDate"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date</Label>

            <Input
              id="endDate"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Action toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/40 px-6 py-4">
          <div className="grid grid-cols-2 sm:flex sm:w-auto gap-2">
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
            className="gap-2 w-full sm:w-auto"
            onClick={handleExport}
            disabled={exportData.rows.length === 0}
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
