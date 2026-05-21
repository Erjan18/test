import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, HelpCircle, Users, BarChart3,
  ChevronLeft, ChevronRight, Zap, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const navItems = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Обзор', color: 'text-blue-400' },
  { to: '/admin/tests', icon: BookOpen, label: 'Тесты', color: 'text-cyan-400' },
  { to: '/admin/questions', icon: HelpCircle, label: 'Вопросы', color: 'text-emerald-400' },
  { to: '/admin/users', icon: Users, label: 'Пользователи', color: 'text-amber-400' },
  { to: '/admin/stats', icon: BarChart3, label: 'Статистика', color: 'text-rose-400' },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      {/* Logo area */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <div className="text-white font-bold text-sm leading-none">ГрамТест</div>
            <div className="text-blue-300 text-xs mt-0.5">Панель управления</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, end, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }
          >
            <Icon className={`w-4 h-4 shrink-0 ${color}`} />
            {(!collapsed || mobile) && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-slate-400 shrink-0" /> : <Sun className="w-4 h-4 text-slate-400 shrink-0" />}
          {(!collapsed || mobile) && <span className="text-sm font-medium">Тема</span>}
        </button>
        <NavLink
          to="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && <span className="text-sm font-medium">На сайт</span>}
        </NavLink>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {(!collapsed || mobile) && <span className="text-sm font-medium">Выйти</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/10 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
        <Sidebar />
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-16 -right-3 w-6 h-6 bg-slate-800 border border-white/20 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10 hidden lg:flex"
          style={{ position: 'fixed', left: collapsed ? '52px' : '212px' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col">
            <Sidebar mobile />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-white/10 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <span className="text-xs text-slate-500 font-mono">admin@gramtest</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500">Система активна</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
