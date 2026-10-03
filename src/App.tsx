import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavigationItem } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { AuthModal } from './components/auth/AuthModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { EmployeesView } from './components/views/EmployeesView';
import { AttendanceView } from './components/views/AttendanceView';
import { RosterView } from './components/views/RosterView';
import { LeaveView } from './components/views/LeaveView';
import { OvertimeBackupView } from './components/views/OvertimeBackupView';
import { MealsView } from './components/views/MealsView';
import { MealCollectionView } from './components/views/MealCollectionView';
import { BazarExpensesView } from './components/views/BazarExpensesView';
import { DailyOperationsView } from './components/views/DailyOperationsView';
import { IncidentsView } from './components/views/IncidentsView';
import { CalendarView } from './components/views/CalendarView';
import { NotificationsView } from './components/views/NotificationsView';
import { ReportsCenterView } from './components/views/ReportsCenterView';
import { ManagementOverviewView } from './components/views/ManagementOverviewView';
import { AuditLogView } from './components/views/AuditLogView';
import { ArchiveTrashView } from './components/views/ArchiveTrashView';
import { AdminSystemControlView } from './components/views/AdminSystemControlView';
import { ProfileView } from './components/views/ProfileView';
import { HelpCenterView } from './components/views/HelpCenterView';

import { initializeDefaultSeedData } from './lib/storage';
import { LoginPage } from './components/auth/LoginPage';
import { BrandLogo } from './components/common/BrandLogo';
import { RefreshCw } from 'lucide-react';

function MainAppContent() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationItem>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Initialize seed baseline once
  useEffect(() => {
    initializeDefaultSeedData();
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Loading Splash Screen during session verification
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <BrandLogo size="lg" inverted showSubtitle />
        <div className="mt-6 flex items-center gap-2.5 text-xs text-slate-400 font-medium">
          <RefreshCw size={15} className="animate-spin text-rose-500" />
          <span>Verifying secure SSP session...</span>
        </div>
      </div>
    );
  }

  // 2. Protected Authentication Gate: If unauthenticated, show official Login Page
  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Sidebar Component */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* TopBar */}
        <TopBar
          currentTab={currentTab}
          onOpenMobile={() => setMobileDrawerOpen(true)}
          onSelectTab={setCurrentTab}
          onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
          onOpenAuthModal={() => setAuthModalOpen(true)}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onOpenEmployeeModal={() => setCurrentTab('employees')}
              onOpenAttendanceModal={() => setCurrentTab('attendance')}
            />
          )}
          {currentTab === 'employees' && <EmployeesView />}
          {currentTab === 'attendance' && <AttendanceView />}
          {currentTab === 'roster' && <RosterView />}
          {currentTab === 'leave' && <LeaveView />}
          {currentTab === 'ot_backup' && <OvertimeBackupView />}
          {currentTab === 'meals' && <MealsView />}
          {currentTab === 'meal_collection' && <MealCollectionView />}
          {currentTab === 'bazar' && <BazarExpensesView />}
          {currentTab === 'operations' && <DailyOperationsView />}
          {currentTab === 'incidents' && <IncidentsView />}
          {currentTab === 'calendar' && <CalendarView />}
          {currentTab === 'notifications' && <NotificationsView />}
          {currentTab === 'reports' && <ReportsCenterView />}
          {currentTab === 'management' && <ManagementOverviewView />}
          {currentTab === 'audit' && <AuditLogView />}
          {currentTab === 'archive' && <ArchiveTrashView />}
          {currentTab === 'admin' && <AdminSystemControlView />}
          {currentTab === 'profile' && <ProfileView />}
          {currentTab === 'help' && <HelpCenterView />}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onNavigate={setCurrentTab}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
