import React, { useState, useEffect } from 'react';
import { Search, X, Users, CalendarCheck, CalendarDays, Utensils, ShoppingBag, ArrowRight } from 'lucide-react';
import { getEmployees, getAttendance, getRoster, getBazarTransactions } from '../../lib/storage';
import { NavigationItem } from '../layout/Sidebar';
import { safeLower, safeTrim, safeIncludes } from '../../lib/safeStrings';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    type: 'employee' | 'attendance' | 'roster' | 'bazar';
    title: string;
    subtitle: string;
    targetTab: NavigationItem;
  }[]>([]);

  useEffect(() => {
    const q = safeTrim(query);
    if (!q) {
      setResults([]);
      return;
    }

    Promise.all([
      getEmployees(),
      getAttendance(),
      getRoster(),
      getBazarTransactions(),
    ]).then(([employees, attendance, roster, bazar]) => {
      const matched: typeof results = [];

      // Employees
      (Array.isArray(employees) ? employees : []).forEach((emp) => {
        if (!emp) return;
        if (
          safeIncludes(emp.full_name, q) ||
          safeIncludes(emp.name, q) ||
          safeIncludes(emp.employee_code, q) ||
          safeIncludes(emp.employee_id, q) ||
          safeIncludes(emp.email, q) ||
          safeIncludes(emp.designation, q) ||
          safeIncludes(emp.position, q)
        ) {
          const empName = emp.full_name || emp.name || 'Staff';
          const empId = emp.employee_code || emp.employee_id || '';
          const empTitle = emp.designation || emp.position || 'SSP Team';
          matched.push({
            type: 'employee',
            title: `${empName} (${empId})`,
            subtitle: `${empTitle} • ${emp.status || 'Active'}`,
            targetTab: 'employees',
          });
        }
      });

      // Attendance
      (Array.isArray(attendance) ? attendance : []).forEach((att) => {
        if (!att) return;
        if (
          safeIncludes(att.employee_id, q) ||
          safeIncludes(att.date, q) ||
          safeIncludes(att.shift_name, q) ||
          safeIncludes(att.notes, q)
        ) {
          matched.push({
            type: 'attendance',
            title: `Attendance: ${att.employee_id || 'Staff'} on ${att.date || '—'}`,
            subtitle: `Status: ${att.status || 'Present'} • Hours: ${att.working_hours || 0}h • ${att.shift_name || 'Shift'}`,
            targetTab: 'attendance',
          });
        }
      });

      // Bazar
      (Array.isArray(bazar) ? bazar : []).forEach((b) => {
        if (!b) return;
        if (
          safeIncludes(b.description, q) ||
          safeIncludes(b.category, q) ||
          safeIncludes(b.provider, q)
        ) {
          matched.push({
            type: 'bazar',
            title: `Bazar: ${b.category || 'Expense'} (${b.amount_spent || 0} TK)`,
            subtitle: `${b.date || '—'} • ${b.description || 'Groceries'}`,
            targetTab: 'bazar',
          });
        }
      });

      setResults(matched.slice(0, 15));
    });
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Input */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, IDs, attendance, roster, bazar..."
            className="w-full pl-3 pr-8 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onNavigate(item.targetTab);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/60 group-hover:text-rose-600 transition shrink-0">
                      {item.type === 'employee' && <Users size={16} />}
                      {item.type === 'attendance' && <CalendarCheck size={16} />}
                      {item.type === 'roster' && <CalendarDays size={16} />}
                      {item.type === 'bazar' && <ShoppingBag size={16} />}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2"
                  />
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for "{query}".
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Type to search employees (e.g. "SSP-001" or "Ananya"), attendance dates, or expenses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
