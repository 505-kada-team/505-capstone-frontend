import api from "@/services/api";
import { planEndpoints } from "./report.endpoint";

export const planApi = {
  // =========================
  // Plan Report
  // =========================

  createReport: (payload) =>
    api.post(planEndpoints.createReport(), payload).then((res) => res.data),

  listReports: (params) =>
    api.get(planEndpoints.listReports(), { params }).then((res) => res.data),

  reviewReport: (reportId, payload) =>
    api
      .put(planEndpoints.reviewReport(reportId), payload)
      .then((res) => res.data),

  addReportInventory: (reportId, payload) =>
    api
      .post(planEndpoints.addReportInventory(reportId), payload)
      .then((res) => res.data),
};
