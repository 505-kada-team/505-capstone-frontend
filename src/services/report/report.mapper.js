export const mapPlanReport = (report = {}) => ({
  id: report._id ?? "",
  planId: report.planId ?? "",
  category: report.category ?? "",
  refId: report.refId ?? "",
  nameRef: report.nameRef ?? "",
  quantityLost: report.quantityLost ?? 0,
  incidentAt: report.incidentAt ?? null,
  isLateReport: report.isLateReport ?? false,
  reason: report.reason ?? "",
  reportedBy: report.reportedBy ?? "",
  reportedByRole: report.reportedByRole ?? "",
  status: report.status ?? "",

  reviewedBy: report.reviewedBy ?? null,
  reviewedAt: report.reviewedAt ?? null,
  adminNote: report.adminNote ?? null,

  valuation: report.valuation ?? null,

  replacementQuantity: report.replacementQuantity ?? null,
  varianceNote: report.varianceNote ?? null,
  replacementDeducted: report.replacementDeducted ?? false,
  replacementBatches: report.replacementBatches ?? [],
  replacementCost: report.replacementCost ?? null,
  replacedAt: report.replacedAt ?? null,
  replacedBy: report.replacedBy ?? null,

  createdAt: report.createdAt ?? null,
});
