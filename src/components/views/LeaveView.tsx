import React, { useState, useEffect } from 'react';
import {
  PlaneTakeoff,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Calendar,
  User,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  getLeaveRequests,
  submitLeaveRequest,
  updateLeaveStatus,
  getEmployees,
  DEFAULT_LEAVE_TYPES,
} from '../../lib/storage';
import { LeaveRequest, LeaveStatus, Employee } from '../../types/database';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { UniversalExportOptions } from '../../lib/exportEngine';

export const LeaveView: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | LeaveStatus>('All');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'Approved' | 'Declined'>('Approved');
  const [decisionComments, setDecisionComments] = useState('');

  // Form state
  const [empId, setEmpId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [reqs, emps] = await Promise.all([
        getLeaveRequests(),
        getEmployees(),
      ]);
      setRequests(reqs);
      const active = emps.filter(e => e.status !== 'Archived');
      setEmployees(active);
      if (active.length > 0 && !empId) {
        setEmpId(active[0].employee_id);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    await submitLeaveRequest({
      employee_id: empId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      days_count: days,
      reason,
      status: 'Pending',
    });

    setNewModalOpen(false);
    setReason('');
    loadData();
  };

  const handleOpenDecision = (req: LeaveRequest, status: 'Approved' | 'Declined') => {
    setSelectedRequest(req);
    setDecisionStatus(status);
    setDecisionComments(status === 'Approved' ? 'Approved for operational cover.' : 'Shift duties required.');
    setDecisionModalOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedRequest) return;
    await updateLeaveStatus(selectedRequest.id, decisionStatus, decisionComments);
    setDecisionModalOpen(false);
    setSelectedRequest(null);
    loadData();
  };

  const filteredRequests = requests.filter(r =>
    statusFilter === 'All' ? true : r.status === statusFilter
  );

  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Leave Requests & Approvals Report',
    baseFilename: `Fahads-Tutorial-Leave-Report-${statusFilter}`,
    filterDescription: statusFilter !== 'All' ? `Status: ${statusFilter}` : undefined,
    columns: [
      { header: 'Employee ID', key: 'employee_id', width: 22 },
      { header: 'Employee Name', key: 'employee_name', width: 32 },
      { header: 'Leave Type', key: 'leave_type', width: 22 },
      { header: 'Start Date', key: 'start_date', width: 22 },
      { header: 'End Date', key: 'end_date', width: 22 },
      { header: 'Days', key: 'total_days', width: 14, align: 'right' },
      { header: 'Reason', key: 'reason', width: 38 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Approved/Reviewed By', key: 'approved_by', width: 28 },
    ],
    data: filteredRequests.map(r => {
      const emp = employees.find(e => e.employee_id === r.employee_id || e.id === r.employee_id);
      return {
        employee_id: r.employee_id,
        employee_name: emp?.name || r.employee_id,
        leave_type: r.leave_type,
        start_date: r.start_date,
        end_date: r.end_date,
        total_days: r.days_count,
        reason: r.reason || '—',
        status: r.status,
        approved_by: r.decision_by || '—',
      };
    }),
    summaryCards: [
      { label: 'Total Requests', value: requests.length },
      { label: 'Pending', value: requests.filter(r => r.status === 'Pending').length },
      { label: 'Approved', value: requests.filter(r => r.status === 'Approved').length },
      { label: 'Declined', value: requests.filter(r => r.status === 'Declined').length },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Leave Requests & Approvals Official Report"
          filterInfo={statusFilter !== 'All' ? `Status: ${statusFilter}` : undefined}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlaneTakeoff className="text-rose-600" size={20} /> Leave Management & Approvals
          </h2>
          <p className="text-xs text-slate-500">
            Casual, Sick, Emergency & Unpaid Leave. Automatic cross-module synchronization to Attendance and Calendar.
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Plus size={15} /> Apply Leave Request
        </button>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Leave Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter size={14} /> Filter Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="All">All Requests ({requests.length})</option>
            <option value="Pending">Pending ({requests.filter(r => r.status === 'Pending').length})</option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400">
          Syncs with daily attendance roster automatically
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => {
                  const emp = employees.find(e => e.employee_id === req.employee_id || e.id === req.employee_id);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {emp?.name || req.employee_id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.employee_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {req.leave_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {req.start_date} → {req.end_date}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {req.days_count} {req.days_count === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {req.reason || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{req.submitted_date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : req.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDecision(req, 'Approved')}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 rounded-md transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenDecision(req, 'Declined')}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 rounded-md transition"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            by {req.decision_by || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Leave Application Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Submit Leave Application
              </h3>
              <button
                onClick={() => setNewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee
                </label>
                <select
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
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
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  {DEFAULT_LEAVE_TYPES.map(lt => (
                    <option key={lt.id} value={lt.name}>
                      {lt.name} ({lt.days_allowed} days allowed)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Leave
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Medical, family engagement, or emergency reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decisionModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Confirm {decisionStatus} Decision
            </h3>
            <p className="text-xs text-slate-500">
              {decisionStatus === 'Approved'
                ? 'This will automatically update the daily attendance and roster for this employee.'
                : 'The employee will remain on active duty roster.'}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admin Comments / Instructions
              </label>
              <input
                type="text"
                value={decisionComments}
                onChange={(e) => setDecisionComments(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs ${
                  decisionStatus === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {decisionStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
