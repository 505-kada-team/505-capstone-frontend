const REPORT_BASE = "/plan-reports";

export const planEndpoints = {
  // =========================
  // Plan Report
  // =========================

  createReport: () => REPORT_BASE,
  listReports: () => REPORT_BASE,
  reviewReport: (reportId) => `${REPORT_BASE}/${reportId}/review`,
  addReportInventory: (reportId) => `${REPORT_BASE}/${reportId}/add-inventory`,
};
