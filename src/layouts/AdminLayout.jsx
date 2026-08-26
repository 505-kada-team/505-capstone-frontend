import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import ChatWidget from '@/AI/chatbot/ui/ChatWidget';
import { LayoutDashboard, Package, BookOpen, Factory, BarChart3, Settings, Bell, History, LogOut, ChevronDown, ChevronRight, CircleHelp, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// -----------------------------------------------------------------------------
// KONFIGURASI LAYOUT
// Jika sewaktu-waktu Anda ingin kembali ke sidebar statis (tidak bisa dilipat),
// cukup ubah ENABLE_COLLAPSIBLE_SIDEBAR menjadi false.
// -----------------------------------------------------------------------------
const ENABLE_COLLAPSIBLE_SIDEBAR = true;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isProdPlanActive = location.pathname.includes('/production-plan');

  // State untuk sidebar collapse (jika fitur aktif, default terbuka. Jika nonaktif, selalu terbuka)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768; // 768px adalah breakpoint md Tailwind
    }
    return true;
  });

  // Buka accordion secara default jika kita sedang berada di child route-nya
  const [isProductionPlanOpen, setIsProductionPlanOpen] = useState(() => {
    const isSidebarInitOpen = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
    return isProdPlanActive && isSidebarInitOpen;
  });

  // Listener media query untuk auto-collapse/expand berdasarkan ukuran layar
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleTabletChange = (e) => {
      if (e.matches) {
        // Masuk ke md atau lebih kecil (tablet/mobile) -> tutup sidebar & accordion
        setIsSidebarOpen(false);
        setIsProductionPlanOpen(false);
      } else {
        // Kembali ke desktop -> buka sidebar
        setIsSidebarOpen(true);
      }
    };

    // Daftarkan listener
    mediaQuery.addEventListener('change', handleTabletChange);
    
    // Cleanup listener saat unmount
    return () => mediaQuery.removeEventListener('change', handleTabletChange);
  }, []);

  // Update accordion state jika navigasi berubah dari luar
  useEffect(() => {
    if (isProdPlanActive && isSidebarOpen) {
      setTimeout(() => {
        setIsProductionPlanOpen(true);
      }, 0);
    }
  }, [isProdPlanActive, isSidebarOpen]);

  // Fungsi pembantu untuk style NavLink aktif
  const navLinkStyle = ({ isActive }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
      isActive
        ? 'bg-accent/10 text-accent font-medium relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-accent before:rounded-r-md'
        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
    } ${!isSidebarOpen ? 'justify-center px-0' : ''}`;

  const subNavLinkStyle = ({ isActive }) =>
    `flex items-center gap-3 rounded-md py-2 transition-colors text-sm ${
      isActive ? 'text-accent font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
    } ${isSidebarOpen ? 'px-3 pl-11' : 'justify-center px-0'}`;

  const toggleSidebar = () => {
    if (!ENABLE_COLLAPSIBLE_SIDEBAR) return;

    setIsSidebarOpen(!isSidebarOpen);
    if (isSidebarOpen) {
      setIsProductionPlanOpen(false); // Tutup accordion saat sidebar ditutup agar lebih rapi
    } else if (isProdPlanActive) {
      setIsProductionPlanOpen(true); // Buka kembali jika route aktif
    }
  };

  const handleAccordionClick = () => {
    if (!isSidebarOpen) {
      // Jika sidebar ditutup lalu accordion diklik, buka sidebar sekaligus accordionnya
      setIsSidebarOpen(true);
      setIsProductionPlanOpen(true);
    } else {
      setIsProductionPlanOpen(!isProductionPlanOpen);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* SIDEBAR (Fixed Left) */}
      <aside className={`fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border flex flex-col z-20 transition-[width] duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-sidebar-border transition-[padding] duration-300 ease-in-out ${isSidebarOpen ? 'px-6 justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">AI</div>
            {/* Menggunakan opacity dan w-full transition untuk teks agar smooth */}
            <div className={`flex-1 whitespace-nowrap transition-all duration-300 ease-in-out ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}`}>
              <h1 className="font-bold text-base leading-tight tracking-tight">Artisan Inventory</h1>
              <p className="text-xs text-muted-foreground capitalize font-sans">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 overflow-x-hidden custom-scrollbar">
          <NavLink to="/admin/dashboard" className={navLinkStyle} title={!isSidebarOpen ? 'Dashboard' : undefined}>
            <LayoutDashboard size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/inventory" className={navLinkStyle} title={!isSidebarOpen ? 'Inventory' : undefined}>
            <Package size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Inventory</span>
          </NavLink>

          <NavLink to="/admin/recipes" className={navLinkStyle} title={!isSidebarOpen ? 'Recipes' : undefined}>
            <BookOpen size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Recipes</span>
          </NavLink>

          {/* Accordion Menu: Production Plan */}
          <div>
            <button
              type="button"
              onClick={handleAccordionClick}
              title={!isSidebarOpen ? 'Production Plan' : undefined}
              className={`w-full flex items-center rounded-md py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isProductionPlanOpen || isProdPlanActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-0'}`}
            >
              <div className="flex items-center gap-3">
                <Factory size={20} className={`shrink-0 ${isProductionPlanOpen || isProdPlanActive ? 'text-accent' : ''}`} />
                <span className={`font-medium whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} ${isProductionPlanOpen || isProdPlanActive ? 'font-medium' : ''}`}>Production Plan</span>
              </div>
              {isSidebarOpen && (
                <div className="shrink-0 transition-transform duration-200">{isProductionPlanOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}</div>
              )}
            </button>

            {/* Sub-menus */}
            {isSidebarOpen && (
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isProductionPlanOpen ? 'max-h-60 mt-1' : 'max-h-0 mt-0'}`}>
                <div className="space-y-1">
                  <NavLink to="/admin/production-plan/draft" className={subNavLinkStyle}>
                    <span className="whitespace-nowrap">Draft Plan</span>
                  </NavLink>
                  <NavLink to="/admin/production-plan/active" className={subNavLinkStyle}>
                    <span className="whitespace-nowrap">Active Plan</span>
                  </NavLink>
                  <NavLink to="/admin/production-plan/report" className={subNavLinkStyle}>
                    <span className="whitespace-nowrap">Plan Report</span>
                  </NavLink>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/admin/reports" className={navLinkStyle} title={!isSidebarOpen ? 'Reports' : undefined}>
            <BarChart3 size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Reports</span>
          </NavLink>

          <NavLink to="/admin/settings" className={navLinkStyle} title={!isSidebarOpen ? 'Settings' : undefined}>
            <Settings size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Settings</span>
          </NavLink>
        </nav>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button
            onClick={logout}
            title={!isSidebarOpen ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 rounded-md py-2 text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!isSidebarOpen ? 'justify-center px-0' : 'px-3'}`}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-[margin] duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* HEADER (Fixed Top) */}
        <header className={`h-16 fixed top-0 right-0 bg-background border-b border-border z-10 flex items-center justify-between px-6 transition-[left] duration-300 ease-in-out ${isSidebarOpen ? 'left-64' : 'left-20'}`}>
          {/* Toggle Sidebar Button */}
          {ENABLE_COLLAPSIBLE_SIDEBAR ? (
            <button
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1.5 hover:bg-accent/10"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
          ) : (
            <div></div> // Spacer jika tombol dihilangkan
          )}

          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1.5 hover:bg-accent/10" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1.5 hover:bg-accent/10" aria-label="History">
              <History size={20} />
            </button>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1.5 hover:bg-accent/10">
              <CircleHelp size={20} />
            </button>

            <div className="w-px h-6 bg-border mx-2"></div>

            {/* Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
                <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold font-mono">{user?.name?.charAt(0) || 'U'}</div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* OUTLET (Page Content) */}
        <main className="flex-1 mt-16 mb-16 p-6 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
