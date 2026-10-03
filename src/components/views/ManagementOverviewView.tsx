import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Users,
  CalendarCheck,
  PlaneTakeoff,
  Clock,
  Utensils,
  Receipt,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import {
  getEmployees,
  getAttendance,
  getDailyMeals,
  getMealCollections,
  getBazarTransactions,
  getOvertime,
  getBackupHours,
  calculateBazarSummary,
} from '../../lib/storage';

export const ManagementOverviewView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    presentDays: 0,
    lateCount: 0,
    leaveDays: 0,
    otHours: 0,
    backupHours: 0,
    mealCost: 0,
    outstandingDue: 0,
    bazarSpent: 0,
    bazarBalance: 0,
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  async function loadData() {
    setLoading(true);
    try {
      const [emps, att, meals, cols, bzr, ot, bck] = await Promise.all([
        getEmployees(),
        getAttendance(),
        getDailyMeals(),
        getMealCollections(selectedMonth),
        getBazarTransactions(selectedMonth),
        getOvertime(selectedMonth),
        getBackupHours(selectedMonth),
      ]);

      const activeEmps = emps.filter(e => e.status !== 'Archived');
      const monthlyAtt = att.filter(a => a.date.startsWith(selectedMonth));
      const monthlyMeals = meals.filter(m => m.date.startsWith(selectedMonth));

      const present = monthlyAtt.filter(a => a.status === 'Present' || a.status === 'Late').length;
      const late = monthlyAtt.filter(a => a.status === 'Late' || a.late_duration > 0).length;
      const leaves = monthlyAtt.filter(a => a.status === 'Leave').length;

      const otSum = ot.reduce((s, o) => s + o.hours, 0);
      const bckSum = bck.reduce((s, b) => s + b.backup_hours, 0);
      const mCost = monthlyMeals.reduce((s, m) => s + (m.total_meal_cost || 0), 0);
      const dues = cols.reduce((s, c) => s + (c.outstanding_amount || 0), 0);

      const bSum = calculateBazarSummary(bzr);

      setMetrics({
        totalEmployees: activeEmps.length,
        presentDays: present,
        lateCount: late,
        leaveDays: leaves,
        otHours: otSum,
        backupHours: bckSum,
        mealCost: mCost,
        outstandingDue: dues,
        bazarSpent: bSum.totalSpent,
        bazarBalance: bSum.currentBalance,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="text-rose-600" size={20} /> Management Executive Overview
          </h2>
          <p className="text-xs text-slate-500">
            High-level metrics for Ananya Rahman (Head of SSP) and Senior Leadership
          </p>
        </div>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
        />
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Users size={14} className="text-blue-500" /> Active Staff
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {metrics.totalEmployees}
          </p>
          <span className="text-[10px] text-slate-400">SSP Team Members</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CalendarCheck size={14} className="text-emerald-500" /> Attendance Shifts
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{metrics.presentDays}</p>
          <span className="text-[10px] text-slate-400">{metrics.lateCount} Late instances</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Clock size={14} className="text-amber-500" /> OT & Backup
          </span>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {metrics.otHours + metrics.backupHours} <span className="text-xs font-normal">hrs</span>
          </p>
          <span className="text-[10px] text-slate-400">
            {metrics.otHours}h OT • {metrics.backupHours}h Backup
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Utensils size={14} className="text-rose-500" /> Dining Cost
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {metrics.mealCost} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-rose-600 font-medium">
            {metrics.outstandingDue} TK Due
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-purple-500" /> Bazar Spent
          </span>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {metrics.bazarSpent} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-slate-400">Bal: {metrics.bazarBalance} TK</span>
        </div>
      </div>

      {/* Visual Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-rose-600" /> Operational Efficiency Indicators
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Punctuality Rate</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metrics.presentDays > 0
                    ? `${Math.round(((metrics.presentDays - metrics.lateCount) / metrics.presentDays) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: `${
                      metrics.presentDays > 0
                        ? Math.round(((metrics.presentDays - metrics.lateCount) / metrics.presentDays) * 100)
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Dining Collection Recovery</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metrics.mealCost > 0
                    ? `${Math.round(((metrics.mealCost - metrics.outstandingDue) / metrics.mealCost) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-rose-500 h-2 rounded-full"
                  style={{
                    width: `${
                      metrics.mealCost > 0
                        ? Math.max(0, Math.round(((metrics.mealCost - metrics.outstandingDue) / metrics.mealCost) * 100))
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Head of SSP Mandate & Control
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Super Admin: <strong>Ananya Rahman</strong>. Oversees end-to-end Student Support Program
            execution for Fahads Tutorial. Controls shift assignments across Morning (07:00-15:30),
            Day (10:00-18:30), Evening (15:00-23:30), and Night (23:00-07:30).
          </p>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Organization:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Fahad's Tutorial</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Headquarters:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Mirpur, Dhaka - 1216</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contact:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">01601929244</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
