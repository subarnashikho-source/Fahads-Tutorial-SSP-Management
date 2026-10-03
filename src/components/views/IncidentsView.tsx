import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Clock,
  Filter,
  Calendar,
  X,
  Save,
} from 'lucide-react';
import { getIncidents, saveIncident, getEmployees } from '../../lib/storage';
import { IncidentRecord, IncidentStatus, Employee } from '../../types/database';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { UniversalExportOptions } from '../../lib/exportEngine';

export const IncidentsView: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personInvolved, setPersonInvolved] = useState('');
  const [category, setCategory] = useState<IncidentRecord['category']>('Shift Disruption');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('Ananya Rahman');
  const [status, setStatus] = useState<IncidentStatus>('Open');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [incs, emps] = await Promise.all([getIncidents(), getEmployees()]);
      setIncidents(incs);
      setEmployees(emps.filter(e => e.status !== 'Archived'));
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveIncident({
      date,
      person_involved_name: personInvolved,
      category,
      description,
      action_taken: actionTaken,
      responsible_person: responsiblePerson,
      status,
    });

    setModalOpen(false);
    setDescription('');
    setActionTaken('');
    loadData();
  };

  const handleUpdateStatus = async (id: string, newStatus: IncidentStatus) => {
    await saveIncident({ id, status: newStatus });
    loadData();
  };

  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Operational Issues & Incident Logs Report',
    baseFilename: 'Fahads-Tutorial-Incidents-Report',
    columns: [
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Involved Person / Student', key: 'person_involved', width: 32 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Action Taken', key: 'action_taken', width: 35 },
      { header: 'Responsible Person', key: 'responsible_person', width: 28 },
      { header: 'Status', key: 'status', width: 20 },
    ],
    data: incidents.map(inc => ({
      date: inc.date,
      category: inc.category,
      person_involved: inc.person_involved_name || inc.person_involved_id || '—',
      description: inc.description,
      action_taken: inc.action_taken || 'Pending investigation',
      responsible_person: inc.responsible_person || 'Ananya Rahman',
      status: inc.status,
    })),
    summaryCards: [
      { label: 'Total Incidents', value: incidents.length },
      { label: 'Open', value: incidents.filter(i => i.status === 'Open').length },
      { label: 'In Progress', value: incidents.filter(i => i.status === 'In Progress').length },
      { label: 'Resolved', value: incidents.filter(i => i.status === 'Resolved').length },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Operational Issues & Incident Logs Official Report"
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} /> Operational Issues & Incidents
          </h2>
          <p className="text-xs text-slate-500">
            Log student support disruptions, platform issues, hardware/network escalations and resolution actions
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Plus size={15} /> Log Incident
        </button>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Incident Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* Incidents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Involved Person / Student</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {incidents.length > 0 ? (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {inc.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {inc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {inc.person_involved_name || 'General / System'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {inc.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {inc.action_taken || 'Under investigation'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          inc.status === 'Resolved' || inc.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inc.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inc.status !== 'Resolved' ? (
                        <button
                          onClick={() => handleUpdateStatus(inc.id, 'Resolved')}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                    No incidents logged. All shift operations running smoothly!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Log New Incident / Issue
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="Shift Disruption">Shift Disruption</option>
                    <option value="Student Escalation">Student Escalation</option>
                    <option value="Equipment">Equipment / Network</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Person / Student Involved
                </label>
                <input
                  type="text"
                  placeholder="e.g. HSC batch student inquiry or staff member"
                  value={personInvolved}
                  onChange={(e) => setPersonInvolved(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issue Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail what occurred during the shift..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Immediate Action Taken
                </label>
                <textarea
                  rows={2}
                  placeholder="Mitigation steps applied by shift lead..."
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
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
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
