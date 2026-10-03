import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { getAuditLogs } from '../../lib/storage';
import { AuditLog } from '../../types/database';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { UniversalExportOptions } from '../../lib/exportEngine';
import { safeLower, safeTrim, safeIncludes } from '../../lib/safeStrings';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (!log) return false;
    const s = safeTrim(search);
    const matchesSearch =
      !s ||
      safeIncludes(log.module, s) ||
      safeIncludes(log.action, s) ||
      safeIncludes(log.record_title, s) ||
      safeIncludes(log.performed_by, s) ||
      safeIncludes(log.reason, s);

    const matchesModule = moduleFilter === 'All' ? true : safeLower(log.module) === safeLower(moduleFilter);
    return matchesSearch && matchesModule;
  });

  const modules = ['All', ...Array.from(new Set(logs.map(l => l.module)))];

  const exportOptions: UniversalExportOptions = {
    reportTitle: 'System Audit Trail & Security History Report',
    baseFilename: 'Fahads-Tutorial-Audit-Log-Report',
    filterDescription: moduleFilter !== 'All' ? `Module: ${moduleFilter}` : undefined,
    columns: [
      { header: 'Timestamp', key: 'created_at', width: 25 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Action', key: 'action', width: 18 },
      { header: 'Record Details', key: 'record_title', width: 35 },
      { header: 'Performed By', key: 'performed_by', width: 28 },
      { header: 'Reason / Notes', key: 'reason', width: 35 },
    ],
    data: filteredLogs.map(l => ({
      created_at: new Date(l.created_at).toLocaleString(),
      module: l.module,
      action: l.action,
      record_title: l.record_title || '—',
      performed_by: l.performed_by,
      reason: l.reason || '—',
    })),
    summaryCards: [
      { label: 'Total Events Logged', value: logs.length },
      { label: 'Filtered Count', value: filteredLogs.length },
      { label: 'Modules Tracked', value: modules.length - 1 },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="System Audit Trail & Security History Official Report"
          filterInfo={moduleFilter !== 'All' ? `Module: ${moduleFilter}` : undefined}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="text-rose-600" size={20} /> System Audit Trail & Security History
          </h2>
          <p className="text-xs text-slate-500">
            Immutable log of all employee changes, attendance corrections, leave approvals, and financial entries
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-semibold">
          <Lock size={13} /> Read-Only Security Vault
        </div>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Audit Trail Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by module, user, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter size={14} /> Module:
          </span>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Record</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Reason / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {log.module}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.action === 'UPDATE' || log.action === 'AUTH'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : log.action === 'APPROVE'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : log.action === 'ARCHIVE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium max-w-xs truncate">
                      {log.record_title || log.record_id || 'System'}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                      {log.performed_by}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate">
                      {log.reason || 'Normal system operation'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-500">
                    No audit records match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
