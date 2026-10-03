import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Archive,
  RotateCcw,
  Edit,
  Eye,
  Phone,
  Mail,
  Calendar,
  Building,
  CreditCard,
  X,
  Save,
  AlertCircle,
  RefreshCw,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import {
  getEmployees,
  saveEmployee,
  deleteEmployee,
  archiveEmployee,
  restoreEmployee,
} from '../../lib/storage';
import { Employee, EmployeeStatus, ShiftType } from '../../types/database';
import { BrandLogo } from '../common/BrandLogo';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportOptions } from '../../lib/exportEngine';
import { safeLower, safeTrim, safeIncludes, safeInitial } from '../../lib/safeStrings';
import { useAuth } from '../../context/AuthContext';

interface EmployeesViewProps {
  initialOpenModal?: boolean;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ initialOpenModal = false }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | EmployeeStatus>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(initialOpenModal);
  const [editingEmp, setEditingEmp] = useState<Partial<Employee> | null>(null);
  const [selectedEmpForCard, setSelectedEmpForCard] = useState<Employee | null>(null);
  const [deleteConfirmEmp, setDeleteConfirmEmp] = useState<Employee | null>(null);
  const [archiveModalEmp, setArchiveModalEmp] = useState<Employee | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployees();
      // Ensure data is array and each element is defensive
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to load employee records: ${msg}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenNew = () => {
    const nextNum = employees.length + 1;
    const nextCode = `SSP-${String(nextNum).padStart(3, '0')}`;
    setEditingEmp({
      employee_code: nextCode,
      employee_id: nextCode,
      full_name: '',
      name: '',
      email: '',
      phone: '',
      designation: 'SSP Executive',
      position: 'SSP Executive',
      department: 'Student Support Team',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      default_shift: 'Day',
      emergency_contact: '',
      emergency_phone: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp({
      ...emp,
      employee_code: emp.employee_code || emp.employee_id || '',
      employee_id: emp.employee_code || emp.employee_id || '',
      full_name: emp.full_name || emp.name || '',
      name: emp.full_name || emp.name || '',
      designation: emp.designation || emp.position || 'SSP Executive',
      position: emp.designation || emp.position || 'SSP Executive',
      department: emp.department || 'Student Support Team',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    setActionLoading(true);
    try {
      await saveEmployee(editingEmp, user?.full_name || 'Ananya Rahman');
      setModalOpen(false);
      setEditingEmp(null);
      await loadEmployees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not save employee: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmEmp) return;
    setActionLoading(true);
    try {
      await deleteEmployee(deleteConfirmEmp.id, user?.full_name || 'Ananya Rahman');
      setDeleteConfirmEmp(null);
      await loadEmployees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not delete employee: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveModalEmp) return;
    setActionLoading(true);
    try {
      await archiveEmployee(archiveModalEmp.id, archiveReason, user?.full_name || 'Ananya Rahman');
      setArchiveModalEmp(null);
      setArchiveReason('');
      await loadEmployees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not archive employee: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    setActionLoading(true);
    try {
      await restoreEmployee(id, user?.full_name || 'Ananya Rahman');
      await loadEmployees();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not restore employee: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Distinct departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      const d = safeTrim(emp.department);
      if (d) set.add(d);
    });
    return Array.from(set);
  }, [employees]);

  // Completely NULL/undefined safe filtering
  const filteredEmployees = useMemo(() => {
    const s = safeTrim(search);
    return employees.filter((emp) => {
      if (!emp) return false;

      const matchesSearch =
        !s ||
        safeIncludes(emp.full_name, s) ||
        safeIncludes(emp.name, s) ||
        safeIncludes(emp.employee_code, s) ||
        safeIncludes(emp.employee_id, s) ||
        safeIncludes(emp.email, s) ||
        safeIncludes(emp.phone, s) ||
        safeIncludes(emp.designation, s) ||
        safeIncludes(emp.position, s) ||
        safeIncludes(emp.department, s) ||
        safeIncludes(emp.notes, s);

      const matchesStatus =
        statusFilter === 'All'
          ? true
          : safeLower(emp.status) === safeLower(statusFilter);

      const matchesDept =
        deptFilter === 'All'
          ? true
          : safeLower(emp.department) === safeLower(deptFilter);

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [employees, search, statusFilter, deptFilter]);

  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Official SSP Staff Directory Report',
    baseFilename: 'Fahads-Tutorial-Employee-Directory',
    filterDescription:
      statusFilter !== 'All' ? `Status: ${statusFilter}` : undefined,
    columns: [
      { header: 'Employee Code', key: 'employee_code', width: 22 },
      { header: 'Full Name', key: 'full_name', width: 32 },
      { header: 'Designation', key: 'designation', width: 30 },
      { header: 'Department', key: 'department', width: 26 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Phone', key: 'phone', width: 22 },
      { header: 'Joining Date', key: 'joining_date', width: 20 },
      { header: 'Status', key: 'status', width: 18 },
    ],
    data: filteredEmployees.map((e) => ({
      ...e,
      employee_code: e.employee_code || e.employee_id || '—',
      full_name: e.full_name || e.name || '—',
      designation: e.designation || e.position || '—',
      department: e.department || 'Student Support Team',
    })),
    summaryCards: [
      { label: 'Total Staff', value: employees.length },
      {
        label: 'Active',
        value: employees.filter((e) => safeLower(e.status) === 'active').length,
      },
      {
        label: 'On Leave',
        value: employees.filter((e) => safeLower(e.status) === 'on leave').length,
      },
      { label: 'Filtered Result', value: filteredEmployees.length },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Official Employee Staff Directory"
          period="Active Registry • Student Support Program"
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-rose-600" size={20} /> Employee Directory & Profiles
          </h2>
          <p className="text-xs text-slate-500">
            Manage SSP executives, official designations, contacts, and identity credentials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadEmployees()}
            disabled={loading}
            title="Refresh database records"
            className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadEmployees()}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold rounded-md transition shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Staff Export & Print Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, SSP code, email, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Department Filter */}
          {departments.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Building size={13} /> Dept:
              </span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Filter size={13} /> Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="All">All Statuses ({employees.length})</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          /* Loading State */
          <div className="p-12 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-rose-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Loading employee staff directory from database...
            </p>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Code / ID</th>
                  <th className="py-3 px-4">Name & Designation</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEmployees.map((emp) => {
                  const displayName = emp.full_name || emp.name || 'Unnamed Employee';
                  const displayCode = emp.employee_code || emp.employee_id || 'SSP-000';
                  const displayDesignation = emp.designation || emp.position || 'SSP Executive';
                  const displayDepartment = emp.department || 'Student Support Team';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {displayCode}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {safeInitial(displayName, 'E')}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-slate-500">{displayDesignation}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Building size={11} className="text-slate-400" />
                          <span>{displayDepartment}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {emp.email ? (
                          <div className="flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            <span>{emp.email}</span>
                          </div>
                        ) : null}
                        {emp.phone ? (
                          <div className="flex items-center gap-1 mt-0.5 text-slate-500">
                            <Phone size={12} className="text-slate-400" />
                            <span>{emp.phone}</span>
                          </div>
                        ) : null}
                        {!emp.email && !emp.phone && <span className="text-slate-400">—</span>}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                        {emp.joining_date || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {emp.default_shift || 'Day'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            safeLower(emp.status) === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : safeLower(emp.status) === 'on leave'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : safeLower(emp.status) === 'archived'
                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {emp.status || 'Active'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedEmpForCard(emp)}
                            title="View Official Digital ID Card"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                          >
                            <CreditCard size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit Employee Details"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                          >
                            <Edit size={15} />
                          </button>

                          {safeLower(emp.status) === 'archived' ? (
                            <button
                              onClick={() => handleRestore(emp.id)}
                              title="Restore Employee to Active"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                            >
                              <RotateCcw size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setArchiveModalEmp(emp)}
                              title="Move to Archive"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                            >
                              <Archive size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteConfirmEmp(emp)}
                            title="Permanently Delete Employee"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="py-14 px-4 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {search || statusFilter !== 'All' || deptFilter !== 'All'
                  ? 'No employees match the filter criteria.'
                  : 'No employees found in the directory.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {search || statusFilter !== 'All' || deptFilter !== 'All'
                  ? 'Try adjusting your search keywords or resetting filters.'
                  : 'Get started by creating your first Student Support Program staff member.'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              {search || statusFilter !== 'All' || deptFilter !== 'All' ? (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('All');
                    setDeptFilter('All');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={handleOpenNew}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <Plus size={14} /> Add First Employee
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {modalOpen && editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-rose-600" />
                <span>{editingEmp.id ? 'Edit Employee Details' : 'Add New SSP Employee'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Code / ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmp.employee_code || editingEmp.employee_id || ''}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        employee_code: e.target.value,
                        employee_id: e.target.value,
                      })
                    }
                    placeholder="SSP-001"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmp.full_name || editingEmp.name || ''}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        full_name: e.target.value,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Tanvir Hossain"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEmp.designation || editingEmp.position || ''}
                    onChange={(e) =>
                      setEditingEmp({
                        ...editingEmp,
                        designation: e.target.value,
                        position: e.target.value,
                      })
                    }
                    placeholder="e.g. Senior SSP Executive"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingEmp.department || 'Student Support Team'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, department: e.target.value })}
                    placeholder="Student Support Team"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingEmp.email || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, email: e.target.value })}
                    placeholder="tanvir.ssp@gmail.com"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingEmp.phone || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={editingEmp.joining_date || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, joining_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Shift
                  </label>
                  <select
                    value={editingEmp.default_shift || 'Day'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, default_shift: e.target.value as ShiftType })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Morning">Morning (07:00 - 15:30)</option>
                    <option value="Day">Day (10:00 - 18:30)</option>
                    <option value="Evening">Evening (15:00 - 23:30)</option>
                    <option value="Night">Night (23:00 - 07:30)</option>
                    <option value="Backup">Backup Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={editingEmp.status || 'Active'}
                  onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as EmployeeStatus })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={editingEmp.emergency_contact || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, emergency_contact: e.target.value })}
                    placeholder="Parent / Spouse"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={editingEmp.emergency_phone || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, emergency_phone: e.target.value })}
                    placeholder="018xxxxxxxx"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Operational Notes
                </label>
                <textarea
                  rows={2}
                  value={editingEmp.notes || ''}
                  onChange={(e) => setEditingEmp({ ...editingEmp, notes: e.target.value })}
                  placeholder="Subject specialization, duties, responsibilities..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} /> {actionLoading ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/50 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Permanently Delete Employee?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete{' '}
                <strong className="text-slate-900 dark:text-white">
                  {deleteConfirmEmp.full_name || deleteConfirmEmp.name}
                </strong>{' '}
                ({deleteConfirmEmp.employee_code || deleteConfirmEmp.employee_id})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmEmp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteConfirm}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={14} /> {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Archive Employee Record?
            </h3>
            <p className="text-xs text-slate-500">
              Moving <strong className="text-slate-900 dark:text-white">{archiveModalEmp.full_name || archiveModalEmp.name}</strong> to the archive keeps historical data safe while removing them from active operations.
            </p>
            <input
              type="text"
              placeholder="Reason for archiving (optional)..."
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setArchiveModalEmp(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Digital ID Card Modal */}
      {selectedEmpForCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              onClick={() => setSelectedEmpForCard(null)}
              className="absolute top-3 right-3 z-10 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-900/60"
            >
              <X size={16} />
            </button>

            {/* Official ID Card Layout */}
            <div className="p-6 text-center bg-slate-950 text-white relative">
              <div className="flex justify-center mb-2">
                <BrandLogo size="sm" inverted showSubtitle={false} />
              </div>
              <p className="text-[10px] tracking-widest uppercase font-semibold text-amber-400">
                Student Support Program • Identity Card
              </p>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-rose-500 flex items-center justify-center text-rose-600 dark:text-rose-400 text-2xl font-black shadow-md">
                {safeInitial(selectedEmpForCard.full_name || selectedEmpForCard.name, 'E')}
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedEmpForCard.full_name || selectedEmpForCard.name}
                </h4>
                <p className="text-xs text-rose-600 font-semibold">
                  {selectedEmpForCard.designation || selectedEmpForCard.position || 'SSP Executive'}
                </p>
                <p className="text-xs font-mono font-bold text-slate-500 mt-1">
                  ID: {selectedEmpForCard.employee_code || selectedEmpForCard.employee_id}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedEmpForCard.department || 'Student Support Team'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Default Shift:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedEmpForCard.default_shift || 'Day'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Official Contact:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {selectedEmpForCard.phone || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-emerald-600">
                    {selectedEmpForCard.status || 'Active'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Printer size={14} /> Print Employee Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
