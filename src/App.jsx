/**
 * App.jsx — root routing
 *
 * Struktur route sesuai CONVENTIONS.md:
 *   /login → halaman login dan registrasi
 *   /verify-email → verifikasi email setelah registrasi
 *   /forgot-password/* → alur reset password
 *   /admin/* → AdminLayout (sidebar + topbar)
 *   /kasir/* → KasirLayout (akan ditambah nanti)
 *
 * Route yang belum dibuat menggunakan komponen ComingSoon.
 * Tambahkan route baru dengan menduplikasi pola yang ada.
 */

import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import VerifyResetCodePage from "@/pages/auth/VerifyResetCodePage";
import InventoryPage from "@/pages/admin/inventory/InventoryPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RootRedirect from "@/routes/RootRedirect";

// Kasir routes
import CashierLayout from "@/layouts/CashierLayout"
import CashierPage from "@/pages/cashier/TransactionPage"
import InvoicePage from "./pages/cashier/InvoicePage"
import OverviewPage from "./pages/cashier/OverviewPage"
import ReportIssue from "./pages/cashier/ReportIssuePage"
import DetailInventoryPage from "@/pages/admin/inventory/DetailInventoryPage";
import RecipePage from "@/pages/admin/recipes/RecipePage";
import DraftPlanPage from "@/pages/admin/production-plan/draft/DraftPlanPage";
import ActivePlanPage from "@/pages/admin/production-plan/active/ActivePlanPage";
import PlanReportPage from "@/pages/admin/production-plan/report/PlanReportPage";
import { Toaster } from "sonner";

// Placeholder untuk halaman yang belum dibuat
function ComingSoon({ name }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="text-4xl">🚧</div>
      <h2 className="font-heading text-lg font-semibold text-foreground">
        {name}
      </h2>
      <p className="text-sm text-muted-foreground">
        Halaman ini sedang dalam pengembangan.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Root — redirect berdasarkan status auth, bukan statis ke /login */}
        <Route path="/" element={<RootRedirect />} />

        {/* Authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/forgot-password/verify"
          element={<VerifyResetCodePage />}
        />
        <Route path="/forgot-password/reset" element={<ResetPasswordPage />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="inventory" replace />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/:id" element={<DetailInventoryPage />} />
            <Route path="dashboard" element={<ComingSoon name="Dashboard" />} />
            <Route path="recipes" element={<RecipePage />} />
            <Route path="production-plan/draft" element={<DraftPlanPage />} />
            <Route path="production-plan/active" element={<ActivePlanPage />} />
            <Route path="production-plan/report" element={<PlanReportPage />} />
            <Route path="report" element={<ComingSoon name="Report" />} />
            <Route
              path="ai-scan"
              element={<ComingSoon name="AI Scanning Input" />}
            />
          </Route>
        </Route>

      {/* Kasir routes */}
    <Route element={<ProtectedRoute allowedRoles={["cashier"]} />}>
      <Route path="/kasir" element={<CashierLayout   />}>
        <Route index element={<Navigate to="cashier" replace />} />
        <Route path="cashier" element={<CashierPage />} />
        <Route path="invoice" element={<InvoicePage />} />
        <Route path="invoice/:id" element={<ComingSoon name="Detail Invoice" />} />
        <Route path="barang" element={<ComingSoon name="Barang" />} />
        <Route path="report-issue" element={<ComingSoon name="Report Issue" />} />
        <Route path="report-issue/create" element={<ComingSoon name="Form Report Issue" />} />
        <Route path="report-issue/:id" element={<ComingSoon name="Detail Report Issue" />} />
      </Route>
    </Route>


        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}
