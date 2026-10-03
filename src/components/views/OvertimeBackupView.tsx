import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Shield,
  Calendar,
  User,
  Filter,
  TrendingUp,
  X,
  Save,
} from 'lucide-react';
import {
  getOvertime,
  saveOvertime,
  getBackupHours,
  saveBackupHour,
  getEmployees,
} from '../../lib/storage';
import { OvertimeRecord, BackupHourRecord, Employee } from '../../types/database';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { UniversalExportOptions } from '../../lib/exportEngine';

export const OvertimeBackupView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ot' | 'backup'>('ot');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [otList, setOtList] = useState<OvertimeRecord[]>([]);
  const [bckList, setBckList] = useState<BackupHourRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [bckModalOpen, setBckModalOpen] = useState(false);

  // Forms
  const [otForm, setOtForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    hours: 2,
    multiplier: 1.5,
    reason: 'Peak HSC exam question answering rush',
  });

  const [bckForm, setBckForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    backup_hours: 4,
    assigned_shift: 'Night',
    reason: 'On-call standby support for night live session',
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  async function loadData() {
    setLoading(true);
    try {
      const [emps, ot, bck] = await Promise.all([
        getEmployees(),
        getOvertime(selectedMonth),
        getBackupHours(selectedMonth),
      ]);
      const active = emps.filter(e => e.status !== 'Archived');
      setEmployees(active);
      setOtList(ot);
      setBckList(bck);
      if (active.length > 0 && !otForm.employee_id) {
        setOtForm(prev => ({ ...prev, employee_id: active[0].employee_id }));
        setBckForm(prev => ({ ...prev, employee_id: active[0].employee_id }));
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSaveOt = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveOvertime({
      employee_id: otForm.employee_id,
      date: otForm.date,
      hours: Number(otForm.hours),
      rate_multiplier: Number(otForm.multiplier),
      reason: otForm.reason,
    });
    setOtModalOpen(false);
    loadData();
  };

  const handleSaveBck = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBackupHour({
      employee_id: bckForm.employee_id,
      date: bckForm.date,
      backup_hours: Number(bckForm.backup_hours),
      assigned_shift: bckForm.assigned_shift,
      reason: bckForm.reason,
    });
    setBckModalOpen(false);
    loadData();
  };

  const totalOtHours = otList.reduce((sum, o) => sum + o.hours, 0);
  const totalBckHours = bckList.reduce((sum, b) => sum + b.backup_hours, 0);

  const exportOptions: UniversalExportOptions = {
    reportTitle: activeTab === 'ot' ? 'Monthly Overtime Hours Report' : 'Monthly Standby Backup Hours Report',
    baseFilename: activeTab === 'ot'
      ? `Fahads-Tutorial-Overtime-Report-${selectedMonth}`
      : `Fahads-Tutorial-Backup-Hours-Report-${selectedMonth}`,
    period: selectedMonth,
    columns: activeTab === 'ot'
      ? [
          { header: 'Employee ID', key: 'employee_id', width: 22 },
          { header: 'Employee Name', key: 'employee_name', width: 32 },
          { header: 'Date', key: 'date', width: 22 },
          { header: 'OT Hours', key: 'hours', width: 18, align: 'right' },
          { header: 'Rate Multiplier', key: 'rate_multiplier', width: 18, align: 'right' },
          { header: 'Reason / Task', key: 'reason', width: 40 },
          { header: 'Status', key: 'status', width: 20 },
        ]
      : [
          { header: 'Employee ID', key: 'employee_id', width: 22 },
          { header: 'Employee Name', key: 'employee_name', width: 32 },
          { header: 'Date', key: 'date', width: 22 },
          { header: 'Backup Hours', key: 'backup_hours', width: 20, align: 'right' },
          { header: 'Assigned Shift', key: 'assigned_shift', width: 22 },
          { header: 'Reason / Shift Covered', key: 'reason', width: 40 },
          { header: 'Status', key: 'status', width: 20 },
        ],
    data: activeTab === 'ot'
      ? otList.map(item => {
          const emp = employees.find(e => e.employee_id === item.employee_id || e.id === item.employee_id);
          return {
            employee_id: item.employee_id,
            employee_name: emp?.name || item.employee_id,
            date: item.date,
            hours: `${item.hours}h`,
            rate_multiplier: `${item.rate_multiplier}x`,
            reason: item.reason || '—',
            status: item.approved_by ? `Approved (${item.approved_by})` : 'Approved',
          };
        })
      : bckList.map(item => {
          const emp = employees.find(e => e.employee_id === item.employee_id || e.id === item.employee_id);
          return {
            employee_id: item.employee_id,
            employee_name: emp?.name || item.employee_id,
            date: item.date,
            backup_hours: `${item.backup_hours}h`,
            assigned_shift: item.assigned_shift,
            reason: item.reason || '—',
            status: 'Logged',
          };
        }),
    summaryCards: activeTab === 'ot'
      ? [
          { label: 'Total OT Hours', value: `${totalOtHours} hrs` },
          { label: 'Claimants', value: otList.length },
          { label: 'Period', value: selectedMonth },
        ]
      : [
          { label: 'Total Backup Hours', value: `${totalBckHours} hrs` },
          { label: 'Covered Shifts', value: bckList.length },
          { label: 'Period', value: selectedMonth },
        ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title={activeTab === 'ot' ? 'Monthly Overtime Hours Official Report' : 'Monthly Standby Backup Hours Official Report'}
          period={selectedMonth}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="text-rose-600" size={20} /> Overtime & Standby Backup Hours
          </h2>
          <p className="text-xs text-slate-500">
            Approved duty extensions, 1.5x overtime rate multiplier, and night backup coverage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
          />
          {activeTab === 'ot' ? (
            <button
              onClick={() => setOtModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus size={15} /> Log Overtime
            </button>
          ) : (
            <button
              onClick={() => setBckModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus size={15} /> Log Backup Hours
            </button>
          )}
        </div>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {activeTab === 'ot' ? 'Overtime' : 'Backup Hours'} Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Overtime Hours</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{totalOtHours} hrs</p>
          <span className="text-[10px] text-slate-400">Month: {selectedMonth}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Backup Hours</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{totalBckHours} hrs</p>
          <span className="text-[10px] text-slate-400">Standby on-call support</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">OT Multiplier</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">1.5x</p>
          <span className="text-[10px] text-slate-400">Configurable rate</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Active Claimants</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {new Set([...otList.map(o => o.employee_id), ...bckList.map(b => b.employee_id)]).size}
          </p>
          <span className="text-[10px] text-slate-400">Staff with logged hours</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('ot')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'ot'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overtime Records ({otList.length})
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === 'backup'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Standby Backup Hours ({bckList.length})
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'ot' ? (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">OT Hours</th>
                  <th className="py-3 px-4">Rate Multiplier</th>
                  <th className="py-3 px-4">Effective Equivalent</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {otList.length > 0 ? (
                  otList.map((rec) => {
                    const emp = employees.find(e => e.employee_id === rec.employee_id);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {rec.date}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {emp?.name || rec.employee_id}
                          <span className="text-[10px] text-slate-400 block font-normal">{rec.employee_id}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-600">{rec.hours} hrs</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{rec.rate_multiplier}x</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {(rec.hours * rec.rate_multiplier).toFixed(1)} hrs
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.reason}</td>
                        <td className="py-3 px-4 text-slate-500">{rec.approved_by}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                      No overtime logged for {selectedMonth}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Backup Hours</th>
                  <th className="py-3 px-4">Assigned Shift</th>
                  <th className="py-3 px-4">Standby Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bckList.length > 0 ? (
                  bckList.map((rec) => {
                    const emp = employees.find(e => e.employee_id === rec.employee_id);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {rec.date}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {emp?.name || rec.employee_id}
                          <span className="text-[10px] text-slate-400 block font-normal">{rec.employee_id}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-600">{rec.backup_hours} hrs</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                            {rec.assigned_shift}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.reason}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                      No backup duty hours logged for {selectedMonth}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log OT Modal */}
      {otModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Overtime Hours
              </h3>
              <button onClick={() => setOtModalOpen(false)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveOt} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee
                </label>
                <select
                  value={otForm.employee_id}
                  onChange={(e) => setOtForm({ ...otForm, employee_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={otForm.date}
                    onChange={(e) => setOtForm({ ...otForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={otForm.hours}
                    onChange={(e) => setOtForm({ ...otForm, hours: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={otForm.reason}
                  onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setOtModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg"
                >
                  Save OT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Backup Modal */}
      {bckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Standby Backup Hours
              </h3>
              <button onClick={() => setBckModalOpen(false)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveBck} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee
                </label>
                <select
                  value={bckForm.employee_id}
                  onChange={(e) => setBckForm({ ...bckForm, employee_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={bckForm.date}
                    onChange={(e) => setBckForm({ ...bckForm, date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Backup Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={bckForm.backup_hours}
                    onChange={(e) => setBckForm({ ...bckForm, backup_hours: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Shift
                </label>
                <select
                  value={bckForm.assigned_shift}
                  onChange={(e) => setBckForm({ ...bckForm, assigned_shift: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
                >
                  <option value="Morning">Morning Standby</option>
                  <option value="Day">Day Standby</option>
                  <option value="Evening">Evening Standby</option>
                  <option value="Night">Night Standby</option>
                  <option value="Backup">General Backup</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={bckForm.reason}
                  onChange={(e) => setBckForm({ ...bckForm, reason: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setBckModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg"
                >
                  Save Backup Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
