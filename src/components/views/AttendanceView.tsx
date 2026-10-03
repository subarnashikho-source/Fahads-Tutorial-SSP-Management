import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  X,
  History,
  Plus,
} from 'lucide-react';
import { getAttendance, saveAttendanceRecord, getEmployees } from '../../lib/storage';
import { AttendanceRecord, AttendanceStatus, Employee } from '../../types/database';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportOptions } from '../../lib/exportEngine';

interface AttendanceViewProps {
  initialOpenModal?: boolean;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialOpenModal = false }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(initialOpenModal);
  const [editRecord, setEditRecord] = useState<Partial<AttendanceRecord> | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      const [att, emps] = await Promise.all([
        getAttendance(selectedDate, selectedDate),
        getEmployees(),
      ]);
      setAttendanceList(att);
      setEmployees(emps.filter(e => e.status !== 'Archived'));
    } finally {
      setLoading(false);
    }
  }

  const handleOpenEdit = (rec?: AttendanceRecord, employeeId?: string) => {
    if (rec) {
      setEditRecord(rec);
      setCorrectionReason(rec.correction_reason || '');
    } else {
      setEditRecord({
        employee_id: employeeId || employees[0]?.employee_id || '',
        date: selectedDate,
        shift_name: 'Day',
        scheduled_start: '10:00',
        scheduled_end: '18:30',
        check_in: '10:00',
        check_out: '',
        break_minutes: 45,
        status: 'Present',
        notes: '',
        is_corrected: false,
      });
      setCorrectionReason('');
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord || !editRecord.employee_id) return;

    await saveAttendanceRecord({
      ...editRecord,
      date: selectedDate,
      correction_reason: correctionReason,
      is_corrected: Boolean(correctionReason),
    });

    setModalOpen(false);
    setEditRecord(null);
    setCorrectionReason('');
    loadData();
  };

  // Metrics for selected day
  const totalEmployees = employees.length;
  const presentRecords = attendanceList.filter(a => a.status === 'Present' || a.status === 'Late');
  const lateRecords = attendanceList.filter(a => a.status === 'Late' || a.late_duration > 0);
  const leaveRecords = attendanceList.filter(a => a.status === 'Leave');
  const totalHoursWorked = attendanceList.reduce((sum, a) => sum + (a.working_hours || 0), 0);

  // Universal Export Options (Print, PDF, Excel, CSV)
  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Attendance & Working Hours Report',
    baseFilename: `Fahads-Tutorial-Attendance-Report-${selectedDate}`,
    period: selectedDate,
    filterDescription: `Date: ${selectedDate}`,
    columns: [
      { header: 'Employee ID', key: 'employee_id', width: 25 },
      { header: 'Employee Name', key: 'name', width: 35 },
      { header: 'Shift', key: 'shift_name', width: 20 },
      { header: 'Scheduled', key: 'scheduled', width: 25 },
      { header: 'Check In', key: 'check_in', width: 20 },
      { header: 'Check Out', key: 'check_out', width: 20 },
      { header: 'Break (min)', key: 'break_minutes', width: 18, align: 'right' },
      { header: 'Hours', key: 'working_hours', width: 18, align: 'right' },
      { header: 'Late (min)', key: 'late_duration', width: 18, align: 'right' },
      { header: 'Status', key: 'status', width: 20 },
    ],
    data: employees.map(emp => {
      const rec = attendanceList.find(a => a.employee_id === emp.employee_id || a.employee_id === emp.id);
      return {
        employee_id: emp.employee_id,
        name: emp.name,
        shift_name: rec?.shift_name || emp.default_shift || 'Day',
        scheduled: `${rec?.scheduled_start || '10:00'} - ${rec?.scheduled_end || '18:30'}`,
        check_in: rec?.check_in || '—',
        check_out: rec?.check_out || '—',
        break_minutes: rec?.break_minutes || 45,
        working_hours: rec?.working_hours ? `${rec.working_hours}h` : '0h',
        late_duration: rec?.late_duration || 0,
        status: rec?.status || 'Unrecorded',
      };
    }),
    summaryCards: [
      { label: 'Present', value: presentRecords.length },
      { label: 'Late', value: lateRecords.length },
      { label: 'On Leave', value: leaveRecords.length },
      { label: 'Total Hours', value: `${totalHoursWorked.toFixed(1)} hrs` },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Attendance & Working Hours Official Report"
          period={selectedDate}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="text-rose-600" size={20} /> Attendance & Hours Tracking
          </h2>
          <p className="text-xs text-slate-500">
            Official check-in, check-out, overnight shift hours, late deduction, and audit corrections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
          />
          <button
            onClick={() => handleOpenEdit()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus size={15} /> Record Attendance
          </button>
        </div>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Attendance Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* KPI Cards for the Selected Date */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Present</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{presentRecords.length}</p>
          <span className="text-[10px] text-slate-400">Out of {totalEmployees} Active</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Late Check-ins</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{lateRecords.length}</p>
          <span className="text-[10px] text-slate-400">Grace period: 10 mins</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Approved Leave</span>
          <p className="text-xl font-bold text-blue-600 mt-1">{leaveRecords.length}</p>
          <span className="text-[10px] text-slate-400">Synchronized from Leave</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Worked Hours</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {totalHoursWorked.toFixed(1)} <span className="text-xs font-normal">hrs</span>
          </p>
          <span className="text-[10px] text-slate-400">Net of break duration</span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Shift & Scheduled</th>
                <th className="py-3 px-4">Check-in</th>
                <th className="py-3 px-4">Check-out</th>
                <th className="py-3 px-4">Break</th>
                <th className="py-3 px-4">Working Hours</th>
                <th className="py-3 px-4">Late / Remarks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => {
                const rec = attendanceList.find(
                  a => a.employee_id === emp.employee_id || a.employee_id === emp.id
                );
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{emp.employee_id} • {emp.position}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{rec?.shift_name || emp.default_shift || 'Day'}</div>
                      <div className="text-[10px] text-slate-400">
                        {rec?.scheduled_start || '10:00'} - {rec?.scheduled_end || '18:30'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {rec?.check_in || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-200">
                      {rec?.check_out || (rec?.check_in ? <span className="text-amber-500">In Progress</span> : '—')}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {rec?.break_minutes ? `${rec.break_minutes}m` : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {rec?.working_hours ? `${rec.working_hours}h` : '0h'}
                    </td>
                    <td className="py-3 px-4">
                      {rec?.late_duration && rec.late_duration > 0 ? (
                        <span className="text-amber-600 font-semibold text-[11px]">
                          +{rec.late_duration}m late
                        </span>
                      ) : (
                        <span className="text-slate-400">{rec?.notes || 'Normal'}</span>
                      )}
                      {rec?.is_corrected && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-sm bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-bold">
                          AUDITED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {rec ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : rec.status === 'Late'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : rec.status === 'Leave'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {rec.status}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Not marked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(rec, emp.employee_id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                      >
                        {rec ? 'Edit' : 'Mark'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Modal */}
      {modalOpen && editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record / Correct Attendance
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee
                </label>
                <select
                  disabled={Boolean(editRecord.id)}
                  value={editRecord.employee_id}
                  onChange={(e) => setEditRecord({ ...editRecord, employee_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.employee_id}>
                      {e.name} ({e.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-in Time (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={editRecord.check_in || ''}
                    onChange={(e) => setEditRecord({ ...editRecord, check_in: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Check-out Time (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={editRecord.check_out || ''}
                    onChange={(e) => setEditRecord({ ...editRecord, check_out: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Break Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={editRecord.break_minutes || 0}
                    onChange={(e) => setEditRecord({ ...editRecord, break_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Override
                  </label>
                  <select
                    value={editRecord.status || 'Present'}
                    onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value as AttendanceStatus })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Leave">On Leave</option>
                    <option value="Off">Scheduled Off</option>
                    <option value="Backup">Backup Duty</option>
                  </select>
                </div>
              </div>

              {editRecord.id && (
                <div>
                  <label className="block text-[11px] font-semibold text-amber-600 mb-1 flex items-center gap-1">
                    <History size={13} /> Correction Reason (Required for Audit Log)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. In-charge corrected missing punch"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
