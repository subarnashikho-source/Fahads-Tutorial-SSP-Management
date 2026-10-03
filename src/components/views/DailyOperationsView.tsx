import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  X,
  Save,
} from 'lucide-react';
import { getDailyOperations, saveDailyOperation, getEmployees } from '../../lib/storage';
import { DailyOperation, OperationStatus, Employee, ShiftType } from '../../types/database';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { UniversalExportOptions } from '../../lib/exportEngine';

export const DailyOperationsView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [operations, setOperations] = useState<DailyOperation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsibleEmp, setResponsibleEmp] = useState('');
  const [shift, setShift] = useState<ShiftType>('Day');
  const [priority, setPriority] = useState<DailyOperation['priority']>('Medium');
  const [handoverNotes, setHandoverNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      const [ops, emps] = await Promise.all([
        getDailyOperations(selectedDate),
        getEmployees(),
      ]);
      setOperations(ops);
      const active = emps.filter(e => e.status !== 'Archived');
      setEmployees(active);
      if (active.length > 0 && !responsibleEmp) {
        setResponsibleEmp(active[0].employee_id);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = async (op: DailyOperation) => {
    const nextStatus: OperationStatus =
      op.status === 'Completed' ? 'In Progress' : 'Completed';
    await saveDailyOperation({ id: op.id, status: nextStatus });
    loadData();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveDailyOperation({
      date: selectedDate,
      task_title: taskTitle,
      description,
      responsible_employee_id: responsibleEmp,
      shift,
      priority,
      handover_notes: handoverNotes,
      status: 'Pending',
    });

    setModalOpen(false);
    setTaskTitle('');
    setDescription('');
    setHandoverNotes('');
    loadData();
  };

  const completedCount = operations.filter(o => o.status === 'Completed').length;
  const pendingCount = operations.filter(o => o.status === 'Pending' || o.status === 'In Progress').length;

  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Daily Operations & Handover Log Report',
    baseFilename: `Fahads-Tutorial-Daily-Operations-Report-${selectedDate}`,
    period: selectedDate,
    columns: [
      { header: 'Shift', key: 'shift', width: 18 },
      { header: 'Task / Duty', key: 'task_title', width: 32 },
      { header: 'Responsible Executive', key: 'responsible_name', width: 28 },
      { header: 'Priority', key: 'priority', width: 18 },
      { header: 'Description / Instructions', key: 'description', width: 38 },
      { header: 'Handover Notes', key: 'handover_notes', width: 34 },
      { header: 'Status', key: 'status', width: 20 },
    ],
    data: operations.map(op => {
      const emp = employees.find(e => e.employee_id === op.responsible_employee_id || e.id === op.responsible_employee_id);
      return {
        shift: op.shift,
        task_title: op.task_title,
        responsible_name: emp?.name || op.responsible_employee_id || 'All Shifts',
        priority: op.priority,
        description: op.description || '—',
        handover_notes: op.handover_notes || '—',
        status: op.status,
      };
    }),
    summaryCards: [
      { label: 'Total Tasks', value: operations.length },
      { label: 'Pending / In Progress', value: pendingCount },
      { label: 'Completed', value: completedCount },
      { label: 'Date', value: selectedDate },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Daily Operations & Handover Log Official Report"
          period={selectedDate}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ListTodo className="text-rose-600" size={20} /> Shift Handover & Daily Operations
          </h2>
          <p className="text-xs text-slate-500">
            Duty assignments, follow-ups, and handover communication between Morning, Day, Evening & Night shifts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
          />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus size={15} /> Add Shift Task
          </button>
        </div>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Operations Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Shift Tasks</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{operations.length}</p>
          <span className="text-[10px] text-slate-400">Date: {selectedDate}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Completed</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{completedCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Duty verified</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Pending / In Hand</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">To be handed over</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Completion Rate</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {operations.length > 0 ? `${Math.round((completedCount / operations.length) * 100)}%` : '100%'}
          </p>
          <span className="text-[10px] text-slate-400">Shift efficiency</span>
        </div>
      </div>

      {/* Operations List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
        {operations.length > 0 ? (
          operations.map((op) => {
            const emp = employees.find(e => e.employee_id === op.responsible_employee_id);
            const isDone = op.status === 'Completed';
            return (
              <div
                key={op.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(op)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {isDone && <CheckCircle2 size={13} />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-xs font-bold ${
                          isDone
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {op.task_title}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                          op.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-700'
                            : op.priority === 'High'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {op.priority}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        [{op.shift} Shift]
                      </span>
                    </div>
                    {op.description && (
                      <p className="text-xs text-slate-500 mt-1">{op.description}</p>
                    )}
                    {op.handover_notes && (
                      <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                        <span className="font-semibold text-rose-600">Handover Note: </span>
                        {op.handover_notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {emp?.name || op.responsible_employee_id || 'Unassigned'}
                    </p>
                    <p className="text-[10px] text-slate-400">Responsible</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {op.status}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center text-xs text-slate-500">
            No shift handover tasks recorded for {selectedDate}.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Shift Task & Handover Note
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify HSC Chemistry zoom link and student attendance"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Responsible Staff
                  </label>
                  <select
                    value={responsibleEmp}
                    onChange={(e) => setResponsibleEmp(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.employee_id}>
                        {e.name} ({e.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Day">Day</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Handover Remarks for Next Shift
                </label>
                <textarea
                  rows={2}
                  placeholder="Items pending resolution or needing evening follow-up..."
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
