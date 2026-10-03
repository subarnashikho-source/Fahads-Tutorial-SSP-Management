import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Users,
  Search,
  AlertCircle,
  Calendar,
  ShieldCheck,
  X,
} from 'lucide-react';
import { getEmployees, restoreEmployee } from '../../lib/storage';
import { Employee } from '../../types/database';
import { safeLower, safeTrim, safeIncludes, safeInitial } from '../../lib/safeStrings';

export const ArchiveTrashView: React.FC = () => {
  const [archivedEmployees, setArchivedEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadArchived();
  }, []);

  async function loadArchived() {
    setLoading(true);
    try {
      const data = await getEmployees();
      setArchivedEmployees(
        Array.isArray(data)
          ? data.filter(e => safeLower(e.status) === 'archived')
          : []
      );
    } finally {
      setLoading(false);
    }
  }

  const handleRestore = async (id: string) => {
    await restoreEmployee(id);
    loadArchived();
  };

  const filtered = useMemo(() => {
    const s = safeTrim(search);
    return archivedEmployees.filter((emp) => {
      if (!emp) return false;
      return (
        !s ||
        safeIncludes(emp.full_name, s) ||
        safeIncludes(emp.name, s) ||
        safeIncludes(emp.employee_code, s) ||
        safeIncludes(emp.employee_id, s) ||
        safeIncludes(emp.designation, s) ||
        safeIncludes(emp.position, s) ||
        safeIncludes(emp.department, s)
      );
    });
  }, [archivedEmployees, search]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="text-rose-600" size={20} /> Archived Records & Trash Recovery
          </h2>
          <p className="text-xs text-slate-500">
            Soft-deleted employees and historical items preserved safely with one-click restoration
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg">
          Total Archived: <strong className="text-slate-900 dark:text-white">{archivedEmployees.length}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search archived employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Archived Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length > 0 ? (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {emp.employee_code || emp.employee_id || 'SSP-000'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {emp.full_name || emp.name || 'Unnamed Employee'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {emp.designation || emp.position || 'SSP Executive'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {emp.archived_at ? new Date(emp.archived_at).toLocaleString() : 'Archived'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRestore(emp.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-2xs"
                      >
                        <RotateCcw size={13} /> Restore to Active
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                    Trash is empty. No archived employees.
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
