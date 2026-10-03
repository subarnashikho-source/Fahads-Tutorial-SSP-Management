import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  PlaneTakeoff,
  Users,
  Shield,
  X,
} from 'lucide-react';
import {
  getAttendance,
  getLeaveRequests,
  getRoster,
  getEmployees,
} from '../../lib/storage';
import { AttendanceRecord, LeaveRequest, RosterEntry, Employee } from '../../types/database';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    date: string;
    events: { title: string; category: string; color: string; desc: string }[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadData();
  }, [year, month]);

  async function loadData() {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const [emps, att, lvs, rost] = await Promise.all([
      getEmployees(),
      getAttendance(),
      getLeaveRequests(),
      getRoster(),
    ]);
    setEmployees(emps.filter(e => e.status !== 'Archived'));
    setAttendance(att.filter(a => a.date.startsWith(monthPrefix)));
    setLeaves(lvs.filter(l => l.status === 'Approved'));
    setRoster(rost.filter(r => r.date.startsWith(monthPrefix)));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday

  // We align with Saturday as first column: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
  const adjustedFirstDay = (firstDayIndex + 1) % 7;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayNum: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayEvents: { title: string; category: string; color: string; desc: string }[] = [];

    // Attendance events
    attendance.filter(a => a.date === dateStr).forEach((a) => {
      const emp = employees.find(e => e.employee_id === a.employee_id);
      dayEvents.push({
        title: `${emp?.name || a.employee_id}: ${a.status}`,
        category: 'Attendance',
        color: a.status === 'Present' ? 'bg-emerald-500' : 'bg-amber-500',
        desc: `Shift: ${a.shift_name} | In: ${a.check_in || '—'} | Hours: ${a.working_hours}h`,
      });
    });

    // Leave events
    leaves.filter(l => dateStr >= l.start_date && dateStr <= l.end_date).forEach((l) => {
      const emp = employees.find(e => e.employee_id === l.employee_id);
      dayEvents.push({
        title: `Leave: ${emp?.name || l.employee_id}`,
        category: 'Leave',
        color: 'bg-blue-500',
        desc: `${l.leave_type} - Reason: ${l.reason}`,
      });
    });

    // Roster shifts
    roster.filter(r => r.date === dateStr).forEach((r) => {
      const emp = employees.find(e => e.employee_id === r.employee_id);
      dayEvents.push({
        title: `Shift: ${emp?.name || r.employee_id} (${r.shift_name})`,
        category: 'Roster',
        color: 'bg-purple-500',
        desc: `Hours: ${r.start_time} - ${r.end_time}`,
      });
    });

    setSelectedDayEvents({ date: dateStr, events: dayEvents });
  };

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-rose-600" size={20} /> Master SSP Operations Calendar
          </h2>
          <p className="text-xs text-slate-500">
            View attendance, roster schedules, approved leaves, and special duty assignments
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-md"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200">
            {monthName}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-md"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid (Saturday -> Friday) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-xs font-bold text-slate-600 dark:text-slate-300 py-2.5">
          <span>SAT</span>
          <span>SUN</span>
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
          {/* Empty cells before month start */}
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] bg-slate-50/40 dark:bg-slate-950/20" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayAtt = attendance.filter(a => a.date === dateStr);
            const dayLeaves = leaves.filter(l => dateStr >= l.start_date && dateStr <= l.end_date);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-[90px] p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer relative ${
                  isToday ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayAtt.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {dayAtt.length} Present
                    </span>
                  )}
                </div>

                {/* Badges preview */}
                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayLeaves.map((l, lIdx) => (
                    <div
                      key={`l-${lIdx}`}
                      className="truncate text-[10px] px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium"
                    >
                      Leave: {l.employee_id}
                    </div>
                  ))}
                  {dayAtt.slice(0, 2).map((a, aIdx) => (
                    <div
                      key={`a-${aIdx}`}
                      className="truncate text-[9px] px-1 py-0.2 rounded-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {a.employee_id}: {a.shift_name}
                    </div>
                  ))}
                  {dayAtt.length > 2 && (
                    <div className="text-[9px] text-slate-400">+{dayAtt.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Schedule Details: {selectedDayEvents.date}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayEvents.events.length} logged activities on this day
                </p>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {selectedDayEvents.events.length > 0 ? (
                selectedDayEvents.events.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{ev.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {ev.category}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">{ev.desc}</p>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-slate-400">
                  No duty shifts, leaves, or attendance logged for this date.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
