import { useCallback, useState } from "react";
import { toast } from "sonner";

const INITIAL_FILTER = {
  reportType: "waste",
  planId: "",
  startDate: "",
  endDate: "",
};

export function useReportFilter() {
  const [reportType, setReportType] = useState(INITIAL_FILTER.reportType);
  const [planId, setPlanId] = useState(INITIAL_FILTER.planId);
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

  const handleApplyFilter = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }

    setAppliedFilter({ reportType, startDate, endDate });
  }, [reportType, planId, startDate, endDate]);

  const handleReset = useCallback(() => {
    setReportType(INITIAL_FILTER.reportType);
    setStartDate(INITIAL_FILTER.startDate);
    setEndDate(INITIAL_FILTER.endDate);
    setAppliedFilter(INITIAL_FILTER);
  }, []);

  const escapeCsvValue = (value) => {
    if (value == null) return "";

    const stringValue = String(value);

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const handleExportCsv = useCallback(() => {
    if (!exportData.rows.length) {
      toast.error("No data available to export.");
      return;
    }

    if (!exportData.columns.length) {
      toast.error("Export columns are not available.");
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

    const csv = [header, ...body].join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const filename = exportData.filename?.endsWith(".csv")
      ? exportData.filename
      : `${exportData.filename || "report"}.csv`;

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }, [exportData]);

  return {
    reportType,
    setReportType,
    planId,
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
  };
}
