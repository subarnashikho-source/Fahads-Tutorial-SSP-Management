import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Calendar,
  Check,
  X,
  Receipt,
  Coffee,
  Sun,
  Moon,
  Save,
} from 'lucide-react';
import { getDailyMeals, saveDailyMeal, getEmployees, getSystemSettings } from '../../lib/storage';
import { DailyMealRecord, Employee, SystemSettings } from '../../types/database';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportOptions } from '../../lib/exportEngine';

export const MealsView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<DailyMealRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(getSystemSettings());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeals();
  }, [selectedDate]);

  async function loadMeals() {
    setLoading(true);
    try {
      const [mealsData, emps] = await Promise.all([
        getDailyMeals(selectedDate),
        getEmployees(),
      ]);
      setMeals(mealsData);
      setEmployees(emps.filter(e => e.status !== 'Archived'));
      setSettings(getSystemSettings());
    } finally {
      setLoading(false);
    }
  }

  const handleToggleMeal = async (
    empId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner'
  ) => {
    const existing = meals.find(m => m.employee_id === empId && m.date === selectedDate);
    const updated = {
      employee_id: empId,
      date: selectedDate,
      breakfast: existing ? existing.breakfast : false,
      lunch: existing ? existing.lunch : false,
      dinner: existing ? existing.dinner : false,
      [mealType]: existing ? !existing[mealType] : true,
    };

    await saveDailyMeal(updated);
    loadMeals();
  };

  const handleToggleAllThree = async (empId: string) => {
    const existing = meals.find(m => m.employee_id === empId && m.date === selectedDate);
    const allChecked = existing && existing.breakfast && existing.lunch && existing.dinner;

    await saveDailyMeal({
      employee_id: empId,
      date: selectedDate,
      breakfast: !allChecked,
      lunch: !allChecked,
      dinner: !allChecked,
    });
    loadMeals();
  };

  // Metrics calculation
  const breakfastCount = meals.filter(m => m.breakfast).length;
  const lunchCount = meals.filter(m => m.lunch).length;
  const dinnerCount = meals.filter(m => m.dinner).length;
  const totalMealsCount = breakfastCount + lunchCount + dinnerCount;
  const totalCost = meals.reduce((sum, m) => sum + (m.total_meal_cost || 0), 0);

  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Daily Dining & Meals Ledger (72 TK)',
    baseFilename: `Fahads-Tutorial-Meals-Report-${selectedDate}`,
    period: selectedDate,
    columns: [
      { header: 'Staff ID', key: 'employee_id', width: 25 },
      { header: 'Employee Name', key: 'name', width: 35 },
      { header: 'Breakfast (20 TK)', key: 'breakfast', width: 25 },
      { header: 'Lunch (35 TK)', key: 'lunch', width: 25 },
      { header: 'Dinner (17 TK)', key: 'dinner', width: 25 },
      { header: 'Daily Total (TK)', key: 'total_cost', width: 25, align: 'right' },
    ],
    data: employees.map(emp => {
      const rec = meals.find(m => m.employee_id === emp.employee_id && m.date === selectedDate);
      return {
        employee_id: emp.employee_id,
        name: emp.name,
        breakfast: rec?.breakfast ? 'Yes (20 TK)' : 'No',
        lunch: rec?.lunch ? 'Yes (35 TK)' : 'No',
        dinner: rec?.dinner ? 'Yes (17 TK)' : 'No',
        total_cost: `${rec?.total_meal_cost || 0} TK`,
      };
    }),
    summaryCards: [
      { label: 'Breakfasts', value: breakfastCount },
      { label: 'Lunches', value: lunchCount },
      { label: 'Dinners', value: dinnerCount },
      { label: 'Total Servings', value: totalMealsCount },
      { label: 'Day Bill', value: `${totalCost} TK` },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Daily Dining & Meals Ledger (72 TK Default)"
          period={selectedDate}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Utensils className="text-rose-600" size={20} /> Daily Meal Management (72 TK Default)
          </h2>
          <p className="text-xs text-slate-500">
            Track daily Breakfast (20 TK), Lunch (35 TK), and Dinner (17 TK). Full day package: 72 TK.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar size={14} /> Date:
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
          />
        </div>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Meal Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Coffee size={13} className="text-amber-500" /> Breakfast (20 TK)
          </span>
          <p className="text-xl font-bold text-amber-600 mt-1">{breakfastCount}</p>
          <span className="text-[10px] text-slate-400">{breakfastCount * (settings.breakfast_price || 20)} TK</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Sun size={13} className="text-orange-500" /> Lunch (35 TK)
          </span>
          <p className="text-xl font-bold text-orange-600 mt-1">{lunchCount}</p>
          <span className="text-[10px] text-slate-400">{lunchCount * (settings.lunch_price || 35)} TK</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Moon size={13} className="text-indigo-500" /> Dinner (17 TK)
          </span>
          <p className="text-xl font-bold text-indigo-600 mt-1">{dinnerCount}</p>
          <span className="text-[10px] text-slate-400">{dinnerCount * (settings.dinner_price || 17)} TK</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Servings</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalMealsCount}</p>
          <span className="text-[10px] text-slate-400">Total plates served</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Day Total Bill</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{totalCost} TK</p>
          <span className="text-[10px] text-emerald-600">Syncs to Collection</span>
        </div>
      </div>

      {/* Meals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4 text-center">Breakfast (20 TK)</th>
                <th className="py-3 px-4 text-center">Lunch (35 TK)</th>
                <th className="py-3 px-4 text-center">Dinner (17 TK)</th>
                <th className="py-3 px-4 text-center">All Day (72 TK)</th>
                <th className="py-3 px-4 text-right">Daily Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => {
                const rec = meals.find(
                  m => m.employee_id === emp.employee_id && m.date === selectedDate
                );
                const hasBf = Boolean(rec?.breakfast);
                const hasLn = Boolean(rec?.lunch);
                const hasDn = Boolean(rec?.dinner);
                const allThree = hasBf && hasLn && hasDn;
                const cost = rec?.total_meal_cost || 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{emp.employee_id} • {emp.position}</div>
                    </td>

                    {/* Breakfast */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleMeal(emp.employee_id, 'breakfast')}
                        className={`w-7 h-7 rounded-lg border inline-flex items-center justify-center transition ${
                          hasBf
                            ? 'bg-amber-500 border-amber-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-slate-400'
                        }`}
                      >
                        <Check size={14} className={hasBf ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    </td>

                    {/* Lunch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleMeal(emp.employee_id, 'lunch')}
                        className={`w-7 h-7 rounded-lg border inline-flex items-center justify-center transition ${
                          hasLn
                            ? 'bg-orange-500 border-orange-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-slate-400'
                        }`}
                      >
                        <Check size={14} className={hasLn ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    </td>

                    {/* Dinner */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleMeal(emp.employee_id, 'dinner')}
                        className={`w-7 h-7 rounded-lg border inline-flex items-center justify-center transition ${
                          hasDn
                            ? 'bg-indigo-500 border-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-slate-400'
                        }`}
                      >
                        <Check size={14} className={hasDn ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    </td>

                    {/* Quick All 3 (72 TK) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleAllThree(emp.employee_id)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition ${
                          allThree
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {allThree ? 'Full Day (72 TK)' : 'Select All'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {cost} TK
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
