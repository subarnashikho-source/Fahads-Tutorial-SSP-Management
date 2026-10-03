import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  Database,
  CloudCheck,
  CloudOff,
  Calendar,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationItem } from './Sidebar';
import { isLiveSupabaseConfigured } from '../../lib/supabase';

interface TopBarProps {
  currentTab: NavigationItem;
  onOpenMobile: () => void;
  onSelectTab: (tab: NavigationItem) => void;
  onOpenGlobalSearch: () => void;
  onOpenAuthModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onOpenMobile,
  onSelectTab,
  onOpenGlobalSearch,
  onOpenAuthModal,
}) => {
  const { user, signOut, isSuperAdmin } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isLive = isLiveSupabaseConfigured();

  const tabTitles: Record<NavigationItem, string> = {
    dashboard: 'SSP Command Center & Dashboard',
    employees: 'Employee Directory & Profiles',
    attendance: 'Attendance & Working Hours Tracking',
    roster: 'Weekly Roster & Shift Scheduling',
    leave: 'Leave Requests & Approvals',
    ot_backup: 'Overtime & Backup Hours Accounting',
    meals: 'Daily Meal Management (72 TK / Day)',
    meal_collection: 'Meal Collections & Payment Accounts',
    bazar: 'Daily Bazar & Operating Expenses',
    operations: 'Daily Shift Operations & Handover',
    incidents: 'Issues & Incident Escalations',
    calendar: 'Master SSP Calendar',
    notifications: 'Notifications & Announcements',
    reports: 'Centralized Reports & Exports',
    management: 'Management Overview & Team KPI',
    audit: 'System Audit History & Security Log',
    archive: 'Archived Employees & Trash Recovery',
    admin: 'System Control & Company Settings',
    profile: 'User Profile & Security',
    help: 'Help Center & Documentation',
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Left Title & Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
          className="p-2 text-slate-600 dark:text-slate-300 rounded-lg lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {tabTitles[currentTab] || 'SSP Management System'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-2">
            <span>Fahads Tutorial</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {todayStr}
            </span>
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          title="Search employees, shifts, records..."
        >
          <Search size={14} />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline px-1 py-0.5 text-[10px] bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Database Mode Indicator */}
        <button
          onClick={() => onSelectTab('admin')}
          title={isLive ? 'Supabase PostgreSQL Cloud Sync Active' : 'Local Persistent Storage Mode (Click to configure Supabase)'}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border transition ${
            isLive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800'
          }`}
        >
          <Database size={13} />
          <span className="hidden sm:inline">{isLive ? 'Cloud DB' : 'Local Persistence'}</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => onSelectTab('notifications')}
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          aria-label="View notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
          >
            <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
              {(user?.full_name || 'A').trim().charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="text-left hidden md:block pr-2">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">
                {user?.full_name || 'Ananya Rahman'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                {user?.designation || user?.role || 'Head of Student Support Team'}
              </p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setProfileMenuOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {user?.full_name || 'Ananya Rahman'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'ananya@gmail.com'}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-medium rounded-full">
                  {user?.role || 'Super Admin'}
                </span>
              </div>

              <button
                onClick={() => {
                  onSelectTab('profile');
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <User size={14} /> My Profile & Security
              </button>

              <button
                onClick={() => {
                  onSelectTab('admin');
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Sliders size={14} /> System Settings & DB
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ShieldCheck size={14} /> Switch / Register Gmail
              </button>

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
