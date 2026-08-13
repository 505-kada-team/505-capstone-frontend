import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import useActiveSection from '@/hooks/useActiveSection';

const NAV_ITEMS = [
  { label: 'Platform', id: 'platform' },
  { label: 'Inventory', id: 'inventory' },
  { label: 'Planning', id: 'planning' },
  { label: 'AI & Forecasting', id: 'intelligence' },
  { label: 'POS', id: 'pos' },
];

export default function Navbar() {
  const activeSection = useActiveSection(NAV_ITEMS.map((item) => item.id));

  const handleNavigate = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            AI
          </div>

          <div className="text-left">
            <p className="text-sm font-semibold leading-none">
              Artisan Inventory
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Intelligent F&amp;B Operations
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-secondary text-foreground hover:bg-secondary/80'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Log In</Link>
          </Button>

          <Button asChild>
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}