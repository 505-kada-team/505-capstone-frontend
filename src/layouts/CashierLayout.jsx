import { NavLink, Outlet } from 'react-router-dom';
import { Coffee, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { label: 'Cashier', to: '/kasir/transaksi' },
  { label: 'Invoice', to: '/kasir/invoice' },
  { label: 'Barang', to: '/kasir/barang' },
  { label: 'Report Issue', to: '/kasir/report-issue' },
];

export default function CashierLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen min-w-[1280px] bg-background">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
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
                    : 'text-muted-foreground hover:text-foreground border-transparent'
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
            className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            <LogOut size={16} strokeWidth={2} />
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
