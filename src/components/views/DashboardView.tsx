import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Utensils,
  Receipt,
  ShoppingBag,
  AlertCircle,
  PlusCircle,
  CalendarCheck,
  TrendingUp,
  PlaneTakeoff,
  ShieldAlert,
  ArrowRight,
  Megaphone,
} from 'lucide-react';
import {
  getEmployees,
  getAttendance,
  getDailyMeals,
  getMealCollections,
  getBazarTransactions,
  calculateBazarSummary,
  getLeaveRequests,
  getAnnouncements,
  getOvertime,
  getBackupHours,
} from '../../lib/storage';
import { Employee, AttendanceRecord, DailyMealRecord, Announcement } from '../../types/database';
import { NavigationItem } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavigationItem) => void;
  onOpenEmployeeModal: () => void;
  onOpenAttendanceModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenEmployeeModal,
  onOpenAttendanceModal,
}) => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [todayMeals, setTodayMeals] = useState<DailyMealRecord[]>([]);
  const [bazarBalance, setBazarBalance] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayOtHours, setTodayOtHours] = useState(0);
  const [todayBackupHours, setTodayBackupHours] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = todayStr.substring(0, 7);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [
        emps,
        att,
        meals,
        collections,
        bazar,
        leaves,
        anns,
        ot,
        bck,
      ] = await Promise.all([
        getEmployees(),
        getAttendance(todayStr, todayStr),
        getDailyMeals(todayStr),
        getMealCollections(currentMonth),
        getBazarTransactions(currentMonth),
        getLeaveRequests(),
        getAnnouncements(),
        getOvertime(currentMonth),
        getBackupHours(currentMonth),
      ]);

      const activeEmployees = emps.filter(e => e.status !== 'Archived');
      setEmployees(activeEmployees);
      setTodayAttendance(att);
      setTodayMeals(meals);

      const bazarSum = calculateBazarSummary(bazar);
      setBazarBalance(bazarSum.currentBalance);

      const outstanding = collections.reduce((s, c) => s + (c.outstanding_amount || 0), 0);
      setTotalOutstanding(outstanding);

      const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
      setPendingLeaveCount(pendingLeaves);

      setAnnouncements(anns.filter(a => a.is_active));

      const todayOt = ot.filter(o => o.date === todayStr).reduce((s, o) => s + o.hours, 0);
      setTodayOtHours(todayOt);

      const todayBck = bck.filter(b => b.date === todayStr).reduce((s, b) => s + b.backup_hours, 0);
      setTodayBackupHours(todayBck);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }

  // Attendance metrics
  const totalEmployeesCount = employees.length;
  const presentCount = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const lateCount = todayAttendance.filter(a => a.status === 'Late' || a.late_duration > 0).length;
  const leaveCount = todayAttendance.filter(a => a.status === 'Leave').length;
  const absentCount = todayAttendance.filter(a => a.status === 'Absent').length;

  // Meal metrics
  const mealCountToday = todayMeals.reduce(
    (count, m) => count + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0),
    0
  );
  const mealCostToday = todayMeals.reduce((cost, m) => cost + (m.total_meal_cost || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-2">
              SSP Daily Command
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Fahads Tutorial – Student Support Operations
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Command overview for Ananya Rahman (Head of SSP). Live monitoring of team attendance,
              duty rosters, meals, expenses, and incident follow-ups.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onOpenAttendanceModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <CalendarCheck size={15} /> Quick Check-in
            </button>
            <button
              onClick={onOpenEmployeeModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 shadow-md transition"
            >
              <PlusCircle size={15} /> + Employee
            </button>
          </div>
        </div>
      </div>

      {/* Announcements Banner if present */}
      {announcements.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs">
          <div className="flex items-start gap-3">
            <Megaphone className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
                  Notice: {announcements[0].title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-semibold">
                  {announcements[0].priority}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                {announcements[0].content}
              </p>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs text-amber-700 dark:text-amber-400 font-medium hover:underline shrink-0"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Employees */}
        <div
          onClick={() => onNavigate('employees')}
          className="cursor-pointer p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-400 transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Staff</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalEmployeesCount}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">SSP Active Members</p>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Present Today</span>
            <UserCheck size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {presentCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {lateCount > 0 ? `${lateCount} Late Check-in` : 'On schedule'}
          </p>
        </div>

        {/* Absent / Leave */}
        <div
          onClick={() => onNavigate('leave')}
          className="cursor-pointer p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Leave / Pending</span>
            <PlaneTakeoff size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {pendingLeaveCount}
          </p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            {pendingLeaveCount > 0 ? 'Action required' : 'All clear'}
          </p>
        </div>

        {/* Daily Meals */}
        <div
          onClick={() => onNavigate('meals')}
          className="cursor-pointer p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-400 transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Meals Today</span>
            <Utensils size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {mealCountToday}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{mealCostToday} TK Total</p>
        </div>

        {/* Outstanding Collection */}
        <div
          onClick={() => onNavigate('meal_collection')}
          className="cursor-pointer p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Meal Due</span>
            <Receipt size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalOutstanding} <span className="text-xs font-normal">TK</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Current Month Dues</p>
        </div>

        {/* Bazar Balance */}
        <div
          onClick={() => onNavigate('bazar')}
          className="cursor-pointer p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Bazar Balance</span>
            <ShoppingBag size={16} className="text-emerald-500" />
          </div>
          <p className={`text-2xl font-bold mt-2 ${bazarBalance < 500 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>
            {bazarBalance} <span className="text-xs font-normal">TK</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Available Funds</p>
        </div>
      </div>

      {/* Main Content Split: Today's Shift Attendance & Quick Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Attendance Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-rose-600" /> Today's Shift Attendance
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time check-in and shift completion tracking
              </p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
            >
              Full Roster <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3">Check-in</th>
                  <th className="py-2.5 px-3">Check-out</th>
                  <th className="py-2.5 px-3">Hours</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.slice(0, 6).map((emp) => {
                  const att = todayAttendance.find(
                    a => a.employee_id === emp.employee_id || a.employee_id === emp.id
                  );
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {emp.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{emp.employee_id} • {emp.position}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {att?.shift_name || emp.default_shift || 'Day'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-200">
                        {att?.check_in || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-200">
                        {att?.check_out || (att?.check_in ? 'In Progress' : '—')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                        {att?.working_hours ? `${att.working_hours}h` : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        {att ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              att.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : att.status === 'Late'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : att.status === 'Leave'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {att.status} {att.late_duration > 0 && `(+${att.late_duration}m)`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unrecorded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Quick Actions & Operational Alerts */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Daily Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('roster')}
                className="p-3 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Weekly Roster
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Sat → Fri shifts</div>
              </button>

              <button
                onClick={() => onNavigate('leave')}
                className="p-3 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Approve Leave
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">{pendingLeaveCount} pending</div>
              </button>

              <button
                onClick={() => onNavigate('meals')}
                className="p-3 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Record Meals
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">72 TK daily baseline</div>
              </button>

              <button
                onClick={() => onNavigate('bazar')}
                className="p-3 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Bazar & Voucher
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Log grocery spend</div>
              </button>

              <button
                onClick={() => onNavigate('ot_backup')}
                className="p-3 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  OT & Backup
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{todayOtHours}h OT today</div>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="p-3 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Print Reports
                </div>
                <div className="text-[10px] text-rose-600 mt-0.5">A4 with Watermark</div>
              </button>
            </div>
          </div>

          {/* Operational Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-amber-500" /> Operational Alerts
            </h3>
            <div className="space-y-2.5">
              {pendingLeaveCount > 0 && (
                <div
                  onClick={() => onNavigate('leave')}
                  className="cursor-pointer p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs"
                >
                  <span className="text-amber-800 dark:text-amber-300">
                    {pendingLeaveCount} pending leave application awaiting decision
                  </span>
                  <ArrowRight size={13} className="text-amber-700 dark:text-amber-400" />
                </div>
              )}

              {bazarBalance < 1000 && (
                <div
                  onClick={() => onNavigate('bazar')}
                  className="cursor-pointer p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs"
                >
                  <span className="text-rose-800 dark:text-rose-300">
                    Bazar fund balance is low ({bazarBalance} TK). Request HR funding.
                  </span>
                  <ArrowRight size={13} className="text-rose-700 dark:text-rose-400" />
                </div>
              )}

              {totalOutstanding > 0 && (
                <div
                  onClick={() => onNavigate('meal_collection')}
                  className="cursor-pointer p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs"
                >
                  <span className="text-indigo-800 dark:text-indigo-300">
                    {totalOutstanding} TK meal fees pending collection for {currentMonth}
                  </span>
                  <ArrowRight size={13} className="text-indigo-700 dark:text-indigo-400" />
                </div>
              )}

              <div
                onClick={() => onNavigate('roster')}
                className="cursor-pointer p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs"
              >
                <span className="text-emerald-800 dark:text-emerald-300">
                  Saturday → Friday shift schedule configured & synchronized
                </span>
                <ArrowRight size={13} className="text-emerald-700 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
