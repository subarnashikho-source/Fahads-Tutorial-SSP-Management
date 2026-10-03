import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Save,
  X,
} from 'lucide-react';
import { getRoster, saveRosterEntries, getEmployees, DEFAULT_SHIFTS } from '../../lib/storage';
import { RosterEntry, Employee, Shift } from '../../types/database';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { UniversalExportOptions } from '../../lib/exportEngine';

export const RosterView: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getRecentSaturday(new Date()));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: string;
    date: string;
    shiftName: string;
    isBackup: boolean;
  } | null>(null);

  // Helper to get nearest previous or current Saturday
  function getRecentSaturday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    const diff = (day === 6 ? 0 : -(day + 1));
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // 7 days of the roster week (Saturday to Friday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      dayName: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i],
      formatted: `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`,
    };
  });

  const startDateStr = weekDays[0].date;
  const endDateStr = weekDays[6].date;

  useEffect(() => {
    loadRoster();
  }, [currentWeekStart]);

  async function loadRoster() {
    setLoading(true);
    try {
      const [emps, roster] = await Promise.all([
        getEmployees(),
        getRoster(startDateStr, endDateStr),
      ]);
      setEmployees(emps.filter(e => e.status !== 'Archived'));
      setRosterEntries(roster);
    } finally {
      setLoading(false);
    }
  }

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleCellClick = (empId: string, dateStr: string) => {
    const existing = rosterEntries.find(r => r.employee_id === empId && r.date === dateStr);
    setSelectedCell({
      employeeId: empId,
      date: dateStr,
      shiftName: existing?.shift_name || 'Day',
      isBackup: Boolean(existing?.is_backup),
    });
    setEditModalOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;

    const shiftObj = DEFAULT_SHIFTS.find(s => s.name === selectedCell.shiftName) || DEFAULT_SHIFTS[1];

    await saveRosterEntries([
      {
        employee_id: selectedCell.employeeId,
        date: selectedCell.date,
        shift_name: selectedCell.shiftName,
        shift_id: shiftObj.id,
        start_time: shiftObj.start_time,
        end_time: shiftObj.end_time,
        is_backup: selectedCell.isBackup,
      },
    ]);

    setEditModalOpen(false);
    loadRoster();
  };

  const handleDuplicateWeek = async () => {
    if (rosterEntries.length === 0) return;
    const nextSat = new Date(currentWeekStart);
    nextSat.setDate(nextSat.getDate() + 7);

    const newEntries = rosterEntries.map((entry) => {
      const originalDate = new Date(entry.date);
      const clonedDate = new Date(originalDate);
      clonedDate.setDate(clonedDate.getDate() + 7);
      return {
        employee_id: entry.employee_id,
        date: clonedDate.toISOString().split('T')[0],
        shift_name: entry.shift_name,
        shift_id: entry.shift_id,
        start_time: entry.start_time,
        end_time: entry.end_time,
        is_backup: entry.is_backup,
      };
    });

    await saveRosterEntries(newEntries);
    setCurrentWeekStart(nextSat);
  };

  // Shift color mapper
  const getShiftBadge = (shiftName: string, isBackup: boolean) => {
    if (isBackup) {
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
    }
    switch (shiftName) {
      case 'Morning':
        return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300';
      case 'Day':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'Evening':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300';
      case 'Night':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Universal Export Options (Print, PDF, Excel, CSV)
  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Weekly Shift & Duty Roster Report',
    baseFilename: `Fahads-Tutorial-Shift-Roster-Report-${startDateStr}`,
    period: `${weekDays[0].formatted} – ${weekDays[6].formatted}`,
    orientation: 'landscape',
    columns: [
      { header: 'Employee ID', key: 'employee_id', width: 22 },
      { header: 'Employee Name', key: 'name', width: 32 },
      ...weekDays.map(d => ({
        header: `${d.dayName} (${d.formatted})`,
        key: d.date,
        width: 20,
        align: 'center' as const,
      })),
    ],
    data: employees.map(emp => {
      const row: Record<string, any> = {
        employee_id: emp.employee_id,
        name: emp.name,
      };
      weekDays.forEach(d => {
        const entry = rosterEntries.find(r => (r.employee_id === emp.employee_id || r.employee_id === emp.id) && r.date === d.date);
        row[d.date] = entry ? `${entry.shift_name}${entry.is_backup ? ' (Backup)' : ''}` : 'Off';
      });
      return row;
    }),
    summaryCards: [
      { label: 'Total Scheduled Staff', value: employees.length },
      { label: 'Week Period', value: `${weekDays[0].formatted} – ${weekDays[6].formatted}` },
      { label: 'Total Shifts Assigned', value: rosterEntries.length },
      { label: 'Standby / Backup Slots', value: rosterEntries.filter(r => r.is_backup).length },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Weekly Shift & Duty Roster Official Report"
          period={`${weekDays[0].formatted} – ${weekDays[6].formatted}`}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="text-rose-600" size={20} /> Weekly Shift Roster (Sat → Fri)
          </h2>
          <p className="text-xs text-slate-500">
            Fahads Tutorial standard weekly rotation: Morning, Day, Evening, Night & Standby Backup
          </p>
        </div>

        {/* Navigation & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-xs">
            <button
              onClick={handlePrevWeek}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-md"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
              {weekDays[0].formatted} – {weekDays[6].formatted}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-md"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={handleDuplicateWeek}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition"
          >
            <Copy size={13} /> Copy to Next Week
          </button>
        </div>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Roster Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* Shifts Legend */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300">Shift Timings:</span>
        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold">
          Morning: 07:00 – 15:30
        </span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
          Day: 10:00 – 18:30
        </span>
        <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-semibold">
          Evening: 15:00 – 23:30
        </span>
        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-semibold">
          Night: 23:00 – 07:30
        </span>
        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
          Backup / Standby
        </span>
      </div>

      {/* Roster Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-48 border-r border-slate-200 dark:border-slate-700">
                  SSP Executive
                </th>
                {weekDays.map((d) => (
                  <th
                    key={d.date}
                    className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-w-[110px]"
                  >
                    <div className="font-bold text-slate-900 dark:text-white uppercase">{d.dayName}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{d.formatted}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700">
                    <div>{emp.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{emp.employee_id}</div>
                  </td>
                  {weekDays.map((d) => {
                    const entry = rosterEntries.find(
                      r => r.employee_id === emp.employee_id && r.date === d.date
                    );
                    const shift = entry ? entry.shift_name : (emp.default_shift || 'Day');
                    const isBck = entry ? entry.is_backup : false;
                    return (
                      <td
                        key={d.date}
                        onClick={() => handleCellClick(emp.employee_id, d.date)}
                        className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border transition shadow-2xs ${getShiftBadge(
                            shift,
                            isBck
                          )}`}
                        >
                          {shift} {isBck && '★'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Shift Assignment Modal */}
      {editModalOpen && selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Assign Shift Duty
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee ID: {selectedCell.employeeId} • Date: {selectedCell.date}
                </label>
                <select
                  value={selectedCell.shiftName}
                  onChange={(e) => setSelectedCell({ ...selectedCell, shiftName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Morning">Morning (07:00 – 15:30)</option>
                  <option value="Day">Day (10:00 – 18:30)</option>
                  <option value="Evening">Evening (15:00 – 23:30)</option>
                  <option value="Night">Night (23:00 – 07:30)</option>
                  <option value="Backup">Backup / Standby</option>
                  <option value="Off">Scheduled Off</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="backupCheck"
                  checked={selectedCell.isBackup}
                  onChange={(e) => setSelectedCell({ ...selectedCell, isBackup: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="backupCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Designate as Standby / Backup Support
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
