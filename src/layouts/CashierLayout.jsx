import { NavLink, Outlet } from 'react-router-dom';
import { Coffee, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { label: 'Cashier', to: '/kasir/cashier' },
  { label: 'Invoice', to: '/kasir/invoice' },
  { label: 'Overview', to: '/kasir/overview' },
  { label: 'Report Issue', to: '/kasir/report-issue' },
];

export default function CashierLayout() {
  const { user, logout } = useAuth();

  return (
    // h-screen + flex-col + overflow-hidden di root: header jadi non-scroll,
    // <main> ambil sisa tinggi layar. Halaman anak (TransaksiPage) tinggal
    // pakai h-full di root div-nya untuk ikut dibatasi ke sisa tinggi ini.
    <div className="flex h-screen min-w-[1280px] flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-2 text-primary">
          <Coffee size={20} strokeWidth={2} />
          <span className="text-lg font-semibold">Artisan Brew</span>
        </div>

        <nav className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `border-b-2 pb-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:border-accent hover:text-accent'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
            alt={user?.name}
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="text-sm text-foreground">{user?.name} (Cashier)</span>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 text-sm font-semibold text-destructive hover:text-destructive/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
          >
            <LogOut size={16} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        <Outlet />
      </main>
    </div>
  );
}