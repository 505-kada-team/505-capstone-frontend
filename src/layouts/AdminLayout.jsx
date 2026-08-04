/**
 * AdminLayout.jsx — layouts/
 *
 * Layout utama untuk semua halaman admin.
 * Sidebar kiri fixed + area konten kanan.
 * Lebar sidebar: w-64, sesuai DESIGN_v1.md Section 4.
 *
 * Navigasi menggunakan NavLink dari react-router-dom untuk auto active state.
 */

import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  BookOpen,
  BarChart3,
  FileText,
  Bot,
  ChevronDown,
  Bell,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Nav item tunggal ────────────────────────────────────────
function NavItem({ to, icon, label, className }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-primary font-semibold'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
          className,
        )
      }
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </NavLink>
  );
}

// ── Nav group dengan sub-item (collapsible) ─────────────────
function NavGroup({ icon, label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Layout utama ────────────────────────────────────────────
export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        id="admin-sidebar"
        className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed top-0 left-0 z-40"
      >
        {/* Brand — dark brown header, kontras dengan sidebar cream di light mode */}
        <div className="px-5 py-6 border-b border-sidebar-border bg-[#2D241E]">  
          <h2 className="text-base font-bold font-heading text-[#E6D5C3] leading-tight">
            Artisan Brew
          </h2>
          <p className="text-xs text-[#E6D5C3]/60 mt-0.5">Inventory Manager</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavItem
            to="/admin/dashboard"
            icon={<LayoutDashboard size={16} strokeWidth={2} />}
            label="Dashboard"
          />
          <NavItem
            to="/admin/inventory"
            icon={<Package size={16} strokeWidth={2} />}
            label="Inventory"
          />
          <NavItem
            to="/admin/recipes"
            icon={<BookOpen size={16} strokeWidth={2} />}
            label="Recipes"
          />

          <NavGroup
            icon={<BarChart3 size={16} strokeWidth={2} />}
            label="Production Plan"
            defaultOpen={false}
          >
            <NavItem to="/admin/production-plan/draft"  label="Draft Plan" />
            <NavItem to="/admin/production-plan/active" label="Active Plan" />
          </NavGroup>

          <NavItem
            to="/admin/report"
            icon={<FileText size={16} strokeWidth={2} />}
            label="Report"
          />
          <NavItem
            to="/admin/ai-scan"
            icon={<Bot size={16} strokeWidth={2} />}
            label="AI Scanning Input"
          />
        </nav>
      </aside>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header
          id="admin-topbar"
          className="h-12 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-end px-6 gap-2"
        >
          <button
            id="topbar-notification"
            aria-label="Notifikasi"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Bell size={18} strokeWidth={2} />
          </button>
          <button
            id="topbar-action"
            aria-label="Aksi cepat"
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            <Play size={14} strokeWidth={2} className="ml-0.5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
