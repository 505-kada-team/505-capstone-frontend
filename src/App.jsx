/**
 * App.jsx — root routing
 *
 * Struktur route sesuai CONVENTIONS.md:
 *   /admin/*  → AdminLayout (sidebar + topbar)
 *   /kasir/*  → KasirLayout (akan ditambah nanti)
 *
 * Route yang belum dibuat → placeholder redirect ke /admin/inventory.
 * Tambahkan route baru dengan menduplikasi pola yang ada.
 */

import { Routes, Route, Navigate } from 'react-router';
import AdminLayout    from '@/layouts/AdminLayout';
import InventoryPage  from '@/pages/admin/inventory/InventoryPage';
import DetailInventoryPage from '@/pages/admin/inventory/DetailInventoryPage';

// Placeholder untuk halaman yang belum dibuat
function ComingSoon({ name }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="text-4xl">🚧</div>
      <h2 className="text-lg font-semibold font-heading text-foreground">{name}</h2>
      <p className="text-sm text-muted-foreground">Halaman ini sedang dalam pengembangan.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Root redirect → inventory */}
      <Route path="/" element={<Navigate to="/admin/inventory" replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="inventory" replace />} />
        <Route path="inventory"            element={<InventoryPage />} />
        <Route path="inventory/:id"        element={<DetailInventoryPage />} />
        <Route path="dashboard"            element={<ComingSoon name="Dashboard" />} />
        <Route path="recipes"              element={<ComingSoon name="Recipes" />} />
        <Route path="production-plan/draft"  element={<ComingSoon name="Draft Plan" />} />
        <Route path="production-plan/active" element={<ComingSoon name="Active Plan" />} />
        <Route path="report"               element={<ComingSoon name="Report" />} />
        <Route path="ai-scan"              element={<ComingSoon name="AI Scanning Input" />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/admin/inventory" replace />} />
    </Routes>
  );
}
