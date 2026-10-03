import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  PlaneTakeoff,
  Clock,
  Utensils,
  Receipt,
  ShoppingBag,
  ListTodo,
  AlertTriangle,
  Calendar,
  Bell,
  FileBarChart,
  PieChart,
  History,
  Trash2,
  Sliders,
  UserCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

export type NavigationItem =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'roster'
  | 'leave'
  | 'ot_backup'
  | 'meals'
  | 'meal_collection'
  | 'bazar'
  | 'operations'
  | 'incidents'
  | 'calendar'
  | 'notifications'
  | 'reports'
  | 'management'
  | 'audit'
  | 'archive'
  | 'admin'
  | 'profile'
  | 'help';

interface SidebarProps {
  currentTab: NavigationItem;
  onSelectTab: (tab: NavigationItem) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, isSuperAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavigationItem, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees' as NavigationItem, label: 'Employees', icon: Users },
    { id: 'attendance' as NavigationItem, label: 'Attendance', icon: CalendarCheck },
    { id: 'roster' as NavigationItem, label: 'Roster / Shifts', icon: CalendarDays },
    { id: 'leave' as NavigationItem, label: 'Leave Management', icon: PlaneTakeoff },
    { id: 'ot_backup' as NavigationItem, label: 'OT & Backup', icon: Clock },
    { id: 'meals' as NavigationItem, label: 'Meals (72 TK)', icon: Utensils },
    { id: 'meal_collection' as NavigationItem, label: 'Meal Collection', icon: Receipt },
    { id: 'bazar' as NavigationItem, label: 'Bazar & Expenses', icon: ShoppingBag },
    { id: 'operations' as NavigationItem, label: 'Daily Operations', icon: ListTodo },
    { id: 'incidents' as NavigationItem, label: 'Issues & Incidents', icon: AlertTriangle },
    { id: 'calendar' as NavigationItem, label: 'Calendar', icon: Calendar },
    { id: 'notifications' as NavigationItem, label: 'Notifications', icon: Bell },
    { id: 'reports' as NavigationItem, label: 'Reports Center', icon: FileBarChart },
    { id: 'management' as NavigationItem, label: 'Management Overview', icon: PieChart },
    { id: 'audit' as NavigationItem, label: 'Audit Log', icon: History },
    { id: 'archive' as NavigationItem, label: 'Archive / Trash', icon: Trash2 },
    { id: 'admin' as NavigationItem, label: 'Admin / System Control', icon: Sliders },
    { id: 'profile' as NavigationItem, label: 'Profile', icon: UserCircle },
    { id: 'help' as NavigationItem, label: 'Help Center', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between h-16 px-4 bg-slate-950 border-b border-slate-800">
          <div className="overflow-hidden">
            {collapsed ? (
              <img
                src="/assets/official-logo.png"
                alt="Fahad's Tutorial"
                className="w-8 h-8 object-contain rounded-full mx-auto"
              />
            ) : (
              <BrandLogo size="sm" inverted showSubtitle={true} />
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-7 h-7 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Badging */}
        {!collapsed && (
          <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {(user?.full_name || 'A').trim().charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-100 truncate">
                  {user?.full_name || 'Ananya Rahman'}
                </p>
                <p className="text-[10px] text-amber-400 font-medium truncate flex items-center gap-1">
                  <ShieldCheck size={11} /> {user?.role || 'Super Admin'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/50'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon
                  size={19}
                  className={`shrink-0 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-rose-400'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        {!collapsed && (
          <div className="p-3 text-center border-t border-slate-800 text-[10px] text-slate-500 bg-slate-950/40">
            <p className="font-medium text-slate-400">Fahads Tutorial – SSP SaaS</p>
            <p className="text-slate-500">v2.5 Production Build • 2026</p>
          </div>
        )}
      </aside>
    </>
  );
};
