import { type ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/lib/constants';
import { cn, getInitials } from '@/lib/utils';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import {
  LayoutDashboard, Users, UserCheck, GraduationCap,
  ClipboardList, Wallet, Plane, BarChart3, Settings, Calendar,
  LogOut, Menu, X, Bell, Search, Building2, CheckSquare,
  Sun, Moon,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { to: '/leads', label: 'Leads', icon: <Users className="w-[18px] h-[18px]" /> },
  { to: '/students', label: 'Mature Students', icon: <UserCheck className="w-[18px] h-[18px]" /> },
  { to: '/applications', label: 'Applications', icon: <GraduationCap className="w-[18px] h-[18px]" /> },
  { to: '/tasks', label: 'Tasks', icon: <CheckSquare className="w-[18px] h-[18px]" /> },
  { to: '/universities', label: 'Universities', icon: <Building2 className="w-[18px] h-[18px]" /> },
  { to: '/calendar', label: 'Calendar', icon: <Calendar className="w-[18px] h-[18px]" /> },
  { to: '/finance', label: 'Finance', icon: <Wallet className="w-[18px] h-[18px]" /> },
  { to: '/visa', label: 'Visa', icon: <Plane className="w-[18px] h-[18px]" /> },
  { to: '/reports', label: 'Reports', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
  { to: '/settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={cn('min-h-screen flex', darkMode ? 'bg-slate-950' : 'bg-gray-50')}>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          darkMode ? 'bg-slate-900 text-white border-r border-slate-800' : 'bg-slate-900 text-white'
        )}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">EduCRM</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium">
              {profile ? getInitials(profile.full_name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-400">{profile ? ROLE_LABELS[profile.role] : ''}</p>
            </div>
            <button onClick={handleSignOut} className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className={cn(
          'h-16 border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 transition-colors',
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        )}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={cn('lg:hidden p-2 -ml-2', darkMode ? 'text-gray-300' : 'text-gray-600')}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students, leads, applications..."
                className={cn(
                  'w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
                  darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-gray-50 border-gray-200'
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                'p-2 rounded-lg transition',
                darkMode ? 'text-amber-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'
              )}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <NotificationsDropdown darkMode={darkMode} />
          </div>
        </header>

        {/* Page content */}
        <main className={cn('flex-1 p-4 lg:p-6 overflow-x-hidden', darkMode ? 'text-gray-100' : '')}>
          {children}
        </main>
      </div>
    </div>
  );
}
