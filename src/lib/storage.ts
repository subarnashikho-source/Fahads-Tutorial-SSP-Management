import {
  Employee,
  AttendanceRecord,
  RosterEntry,
  LeaveRequest,
  OvertimeRecord,
  BackupHourRecord,
  DailyMealRecord,
  MealCollection,
  BazarTransaction,
  DailyOperation,
  IncidentRecord,
  CalendarEventItem,
  Announcement,
  NotificationItem,
  MonthlyClosing,
  AuditLog,
  SystemSettings,
  Shift,
  LeaveType,
  MealPrice,
  Profile,
} from '../types/database';
import { getSupabaseClient, isLiveSupabaseConfigured } from './supabase';
import { safeLower, safeTrim, safeInitial } from './safeStrings';

const PREFIX = 'ft_ssp_db_';

// UUID validation and generation helpers
export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Defensive Database <-> Frontend Employee Mapper
 * Ensures that missing or null fields never crash the UI,
 * and maintains compatibility with both DB columns and frontend aliases.
 */
export function mapDbToEmployee(row: any): Employee {
  if (!row || typeof row !== 'object') {
    return {
      id: generateUuid(),
      employee_code: 'SSP-000',
      employee_id: 'SSP-000',
      full_name: 'SSP Staff Member',
      name: 'SSP Staff Member',
      designation: 'SSP Executive',
      position: 'SSP Executive',
      department: 'Student Support Team',
      email: '',
      phone: '',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: '',
      default_shift: 'Day',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const code = safeTrim(row.employee_code || row.employee_id) || 'SSP-001';
  const fullName = safeTrim(row.full_name || row.name) || 'SSP Executive';
  const designation = safeTrim(row.designation || row.position) || 'SSP Executive';
  const department = safeTrim(row.department) || 'Student Support Team';
  const rawStatus = safeTrim(row.status);
  const status = (rawStatus === 'Active' || rawStatus === 'Inactive' || rawStatus === 'On Leave' || rawStatus === 'Archived')
    ? rawStatus
    : 'Active';

  return {
    id: String(row.id || generateUuid()),
    profile_id: row.profile_id && isValidUuid(row.profile_id) ? row.profile_id : null,
    employee_code: code,
    employee_id: code,
    full_name: fullName,
    name: fullName,
    designation,
    position: designation,
    department,
    email: safeTrim(row.email),
    phone: safeTrim(row.phone),
    joining_date: safeTrim(row.joining_date) || new Date().toISOString().split('T')[0],
    status,
    notes: String(row.notes || ''),
    default_shift: row.default_shift || 'Day',
    emergency_contact: String(row.emergency_contact || ''),
    emergency_phone: String(row.emergency_phone || ''),
    profile_photo: String(row.profile_photo || ''),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString()),
    archived_at: row.archived_at ? String(row.archived_at) : undefined,
  };
}

/**
 * Transforms an Employee model into the exact Supabase database schema columns:
 * id, profile_id, employee_code, full_name, designation, department,
 * phone, email, joining_date, status, notes, created_at, updated_at
 */
export function mapEmployeeToDb(emp: Partial<Employee>): Record<string, any> {
  const code = safeTrim(emp.employee_code || emp.employee_id) || 'SSP-001';
  const fullName = safeTrim(emp.full_name || emp.name) || 'SSP Executive';
  const designation = safeTrim(emp.designation || emp.position) || 'SSP Executive';
  const department = safeTrim(emp.department) || 'Student Support Team';
  const id = emp.id && isValidUuid(emp.id) ? emp.id : generateUuid();

  return {
    id,
    profile_id: emp.profile_id && isValidUuid(emp.profile_id) ? emp.profile_id : null,
    employee_code: code,
    full_name: fullName,
    designation,
    department,
    phone: safeTrim(emp.phone),
    email: safeTrim(emp.email),
    joining_date: safeTrim(emp.joining_date) || new Date().toISOString().split('T')[0],
    status: safeTrim(emp.status) || 'Active',
    notes: String(emp.notes || ''),
    created_at: emp.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Initial default settings
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  company_name: "Fahad's Tutorial",
  app_title: 'Fahads Tutorial – SSP Management System',
  head_of_ssp: 'Ananya Rahman',
  late_threshold_minutes: 15,
  grace_period_minutes: 10,
  default_daily_meal_price: 72,
  breakfast_price: 20,
  lunch_price: 35,
  dinner_price: 17,
  default_ot_multiplier: 1.5,
  saturday_first_day_of_week: true,
  contact_email: 'fahadstutorial@gmail.com',
  contact_phone: '01601929244',
  theme_mode: 'light',
};

export const DEFAULT_SHIFTS: Shift[] = [
  { id: 'shift-1', name: 'Morning', code: 'MOR', start_time: '07:00', end_time: '15:30', break_minutes: 45, color: '#0284c7', description: 'Morning Shift', created_at: '2026-01-01T00:00:00Z' },
  { id: 'shift-2', name: 'Day', code: 'DAY', start_time: '10:00', end_time: '18:30', break_minutes: 60, color: '#16a34a', description: 'Regular Day Shift', created_at: '2026-01-01T00:00:00Z' },
  { id: 'shift-3', name: 'Evening', code: 'EVE', start_time: '15:00', end_time: '23:30', break_minutes: 45, color: '#ea580c', description: 'Evening Shift', created_at: '2026-01-01T00:00:00Z' },
  { id: 'shift-4', name: 'Night', code: 'NIT', start_time: '23:00', end_time: '07:30', break_minutes: 60, color: '#7c3aed', description: 'Overnight Shift', created_at: '2026-01-01T00:00:00Z' },
  { id: 'shift-5', name: 'Backup', code: 'BCK', start_time: '12:00', end_time: '20:30', break_minutes: 45, color: '#eab308', description: 'On-Call / Standby Support', created_at: '2026-01-01T00:00:00Z' },
];

export const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-1', name: 'Casual Leave', days_allowed: 14, is_paid: true, description: 'Standard casual / personal leave' },
  { id: 'lt-2', name: 'Sick Leave', days_allowed: 14, is_paid: true, description: 'Medical and health recuperation' },
  { id: 'lt-3', name: 'Emergency Leave', days_allowed: 5, is_paid: true, description: 'Urgent unplanned events' },
  { id: 'lt-4', name: 'Unpaid Leave', days_allowed: 30, is_paid: false, description: 'Extended absence without pay' },
];

export const DEFAULT_MEAL_PRICES: MealPrice = {
  id: 'mp-default',
  breakfast_price: 20,
  lunch_price: 35,
  dinner_price: 17,
  daily_total_price: 72, // 72 TK default required
  effective_from: '2026-01-01',
};

// Generic Local Storage Helpers
function readLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));

    // Automatically sync supported data to Supabase
    void syncToSupabase(key, value);
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

const SUPABASE_TABLES: Record<string, string> = {
  employees: 'employees',
  attendance: 'attendance',
  rosters: 'rosters',
  leave_requests: 'leave_requests',
  overtime: 'overtime',
  backup_hours: 'backup_hours',
  meals: 'meals',
  meal_collections: 'meal_collections',
  bazar_transactions: 'bazar_transactions',
  daily_operations: 'daily_operations',
  incidents: 'incidents',
  announcements: 'announcements',
  notifications: 'notifications',
  monthly_closings: 'monthly_closings',
  audit_logs: 'audit_logs',
  profiles: 'profiles',
  shifts: 'shifts',
  leave_types: 'leave_types',
  meal_prices: 'meal_prices',
  system_settings: 'system_settings',
};

async function syncToSupabase<T>(
  key: string,
  value: T
): Promise<void> {
  if (!isLiveSupabaseConfigured()) return;

  const table = SUPABASE_TABLES[key];

  if (!table) return;

  try {
    const client = getSupabaseClient();

    if (!Array.isArray(value)) return;

    if (value.length === 0) return;

    const rows = value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === 'object' &&
        Boolean((item as Record<string, unknown>).id)
    );

    if (rows.length === 0) return;

    let rowsToUpsert = rows;
    if (key === 'employees') {
      rowsToUpsert = rows.map(r => mapEmployeeToDb(r as any));
    }

    const { error } = await client
      .from(table)
      .upsert(rowsToUpsert, { onConflict: 'id' });

    if (error) {
      console.warn(
        `[Supabase] ${table} sync failed:`,
        error.message
      );
    }
  } catch (error) {
    console.warn(
      `[Supabase] ${table} sync error:`,
      error
    );
  }
}

// Audit logger
export async function recordAudit(
  module: string,
  action: AuditLog['action'],
  recordId?: string,
  recordTitle?: string,
  prevValue?: string,
  newValue?: string,
  reason?: string,
  performedBy: string = 'Ananya Rahman (Head of SSP)'
): Promise<AuditLog> {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    module,
    action,
    record_id: recordId,
    record_title: recordTitle,
    previous_value: prevValue,
    new_value: newValue,
    performed_by: performedBy,
    reason,
    created_at: new Date().toISOString(),
  };

  const logs = readLocal<AuditLog[]>('audit_logs', []);
  logs.unshift(log);
  writeLocal('audit_logs', logs.slice(0, 1000)); // maintain recent 1000

  if (isLiveSupabaseConfigured()) {
  try {
    const { error } = await getSupabaseClient()
      .from('audit_logs')
      .upsert([log], { onConflict: 'id' });

    if (error) {
      console.warn(
        'Could not push audit log to Supabase:',
        error.message
      );
    }
  } catch (e) {
    console.warn('Could not push audit log to Supabase:', e);
  }
}

  return log;
}

// ----------------- EMPLOYEES REPOSITORY -----------------
export async function getEmployees(): Promise<Employee[]> {
  if (isLiveSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('employees')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapDbToEmployee);
        writeLocal('employees', mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Falling back to local employees storage', e);
    }
  }

  const local = readLocal<any[]>('employees', []);
  if (local.length > 0) {
    return local.map(mapDbToEmployee);
  }

  // If local is also empty, seed default baseline records
  initializeDefaultSeedData();
  return readLocal<any[]>('employees', []).map(mapDbToEmployee);
}

export async function saveEmployee(
  emp: Partial<Employee>,
  currentUser: string = 'Ananya Rahman'
): Promise<Employee> {
  const existing = await getEmployees();
  let saved: Employee;

  const code = safeTrim(emp.employee_code || emp.employee_id);
  const fullName = safeTrim(emp.full_name || emp.name);
  const designation = safeTrim(emp.designation || emp.position) || 'SSP Executive';
  const department = safeTrim(emp.department) || 'Student Support Team';

  if (emp.id) {
    const prev = existing.find(e => e.id === emp.id || e.employee_id === emp.id || e.employee_code === emp.id);
    const validId = isValidUuid(emp.id) ? emp.id : (prev?.id && isValidUuid(prev.id) ? prev.id : generateUuid());

    saved = mapDbToEmployee({
      ...(prev || {}),
      ...emp,
      id: validId,
      employee_code: code || prev?.employee_code || prev?.employee_id || 'SSP-001',
      employee_id: code || prev?.employee_id || prev?.employee_code || 'SSP-001',
      full_name: fullName || prev?.full_name || prev?.name || 'SSP Staff',
      name: fullName || prev?.name || prev?.full_name || 'SSP Staff',
      designation: designation || prev?.designation || prev?.position || 'SSP Executive',
      position: designation || prev?.position || prev?.designation || 'SSP Executive',
      department: department || prev?.department || 'Student Support Team',
      updated_at: new Date().toISOString(),
    });

    const updated = existing.map(e => (e.id === saved.id ? saved : e));
    writeLocal('employees', updated);
    await recordAudit('Employees', 'UPDATE', saved.id, saved.full_name, JSON.stringify(prev), JSON.stringify(saved), 'Employee details updated', currentUser);
  } else {
    // Generate next SSP ID
    const count = existing.length + 1;
    const nextCode = `SSP-${String(count).padStart(3, '0')}`;
    const newId = generateUuid();

    saved = mapDbToEmployee({
      id: newId,
      profile_id: emp.profile_id && isValidUuid(emp.profile_id) ? emp.profile_id : null,
      employee_code: code || nextCode,
      employee_id: code || nextCode,
      full_name: fullName || 'New Employee',
      name: fullName || 'New Employee',
      designation: designation || 'SSP Executive',
      position: designation || 'SSP Executive',
      department: department || 'Student Support Team',
      email: safeTrim(emp.email),
      phone: safeTrim(emp.phone),
      joining_date: safeTrim(emp.joining_date) || new Date().toISOString().split('T')[0],
      status: emp.status || 'Active',
      notes: emp.notes || '',
      default_shift: emp.default_shift || 'Day',
      emergency_contact: emp.emergency_contact || '',
      emergency_phone: emp.emergency_phone || '',
      profile_photo: emp.profile_photo || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    existing.push(saved);
    writeLocal('employees', existing);
    await recordAudit('Employees', 'CREATE', saved.id, saved.full_name, undefined, JSON.stringify(saved), 'New employee created', currentUser);
  }

  if (isLiveSupabaseConfigured()) {
    try {
      const dbRow = mapEmployeeToDb(saved);
      const { error } = await getSupabaseClient()
        .from('employees')
        .upsert([dbRow], { onConflict: 'id' });
      if (error) {
        console.warn('[Supabase] saveEmployee upsert warning:', error.message);
      }
    } catch (e) {
      console.warn('Could not sync employee to Supabase', e);
    }
  }

  return saved;
}

export async function deleteEmployee(id: string, currentUser: string = 'Ananya Rahman'): Promise<void> {
  const existing = await getEmployees();
  const emp = existing.find(e => e.id === id || e.employee_id === id);
  const targetId = emp ? emp.id : id;

  const updated = existing.filter(e => e.id !== targetId && e.employee_id !== id);
  writeLocal('employees', updated);
  await recordAudit(
    'Employees',
    'DELETE',
    targetId,
    emp ? (emp.full_name || emp.name) : targetId,
    JSON.stringify(emp),
    undefined,
    'Employee permanently deleted from database',
    currentUser
  );

  if (isLiveSupabaseConfigured()) {
    try {
      const { error } = await getSupabaseClient()
        .from('employees')
        .delete()
        .eq('id', targetId);
      if (error) {
        console.warn('[Supabase] deleteEmployee warning:', error.message);
      }
    } catch (e) {
      console.warn('Could not delete employee on Supabase', e);
    }
  }
}

export async function archiveEmployee(id: string, reason?: string, currentUser: string = 'Ananya Rahman'): Promise<void> {
  const existing = await getEmployees();
  const emp = existing.find(e => e.id === id || e.employee_id === id);
  if (!emp) return;

  const updatedEmp: Employee = {
    ...emp,
    status: 'Archived',
    archived_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = existing.map(e => (e.id === emp.id ? updatedEmp : e));
  writeLocal('employees', updated);
  await recordAudit('Employees', 'ARCHIVE', emp.id, emp.name, 'Active', 'Archived', reason || 'Archived employee', currentUser);

  if (isLiveSupabaseConfigured()) {
    try {
      await getSupabaseClient()
        .from('employees')
        .update({ status: 'Archived', updated_at: updatedEmp.updated_at })
        .eq('id', emp.id);
    } catch (e) {
      console.warn('Could not archive employee on Supabase', e);
    }
  }
}

export async function restoreEmployee(id: string, currentUser: string = 'Ananya Rahman'): Promise<void> {
  const existing = await getEmployees();
  const emp = existing.find(e => e.id === id || e.employee_id === id);
  if (!emp) return;

  const updatedEmp: Employee = {
    ...emp,
    status: 'Active',
    archived_at: undefined,
    updated_at: new Date().toISOString(),
  };

  const updated = existing.map(e => (e.id === emp.id ? updatedEmp : e));
  writeLocal('employees', updated);
  await recordAudit('Employees', 'RESTORE', emp.id, emp.name, 'Archived', 'Active', 'Restored from archive', currentUser);

  if (isLiveSupabaseConfigured()) {
    try {
      await getSupabaseClient()
        .from('employees')
        .update({ status: 'Active', updated_at: updatedEmp.updated_at })
        .eq('id', emp.id);
    } catch (e) {
      console.warn('Could not restore employee on Supabase', e);
    }
  }
}

// ----------------- ATTENDANCE REPOSITORY -----------------
export function calculateWorkingHours(checkIn?: string, checkOut?: string, breakMins: number = 0): {
  workingHours: number;
  lateMinutes: number;
} {
  if (!checkIn || !checkOut || !checkIn.includes(':') || !checkOut.includes(':')) {
    return { workingHours: 0, lateMinutes: 0 };
  }

  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);

  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
    return { workingHours: 0, lateMinutes: 0 };
  }

  let inMinutes = inH * 60 + inM;
  let outMinutes = outH * 60 + outM;

  // Handle overnight shift
  if (outMinutes < inMinutes) {
    outMinutes += 24 * 60;
  }

  const totalMins = Math.max(0, outMinutes - inMinutes - breakMins);
  const workingHours = Number((totalMins / 60).toFixed(2));

  return { workingHours, lateMinutes: 0 };
}

export async function getAttendance(startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
  let records: AttendanceRecord[] = [];
  if (isLiveSupabaseConfigured()) {
    try {
      let query = getSupabaseClient().from('attendance').select('*').order('date', { ascending: false });
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      const { data, error } = await query;
      if (!error && data) {
        records = data as AttendanceRecord[];
        writeLocal('attendance', records);
        return records;
      }
    } catch (e) {
      console.warn('Falling back to local attendance storage', e);
    }
  }

  records = readLocal<AttendanceRecord[]>('attendance', []);
  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);
  return records;
}

export async function saveAttendanceRecord(record: Partial<AttendanceRecord>, currentUser: string = 'Ananya Rahman'): Promise<AttendanceRecord> {
  const existing = readLocal<AttendanceRecord[]>('attendance', []);
  const settings = readLocal<SystemSettings>('system_settings', DEFAULT_SYSTEM_SETTINGS);

  const { workingHours } = calculateWorkingHours(record.check_in, record.check_out, record.break_minutes || 0);

  // Late calculation
  let lateMinutes = 0;
  if (
    record.scheduled_start &&
    record.check_in &&
    record.scheduled_start.includes(':') &&
    record.check_in.includes(':')
  ) {
    const [sH, sM] = record.scheduled_start.split(':').map(Number);
    const [aH, aM] = record.check_in.split(':').map(Number);
    if (!isNaN(sH) && !isNaN(sM) && !isNaN(aH) && !isNaN(aM)) {
      const diff = (aH * 60 + aM) - (sH * 60 + sM);
      if (diff > (settings.grace_period_minutes || 10)) {
        lateMinutes = diff;
      }
    }
  }

  let saved: AttendanceRecord;
  const matchIndex = existing.findIndex(r => r.employee_id === record.employee_id && r.date === record.date);

  if (matchIndex >= 0) {
    const prev = existing[matchIndex];
    saved = {
      ...prev,
      ...record,
      working_hours: workingHours,
      late_duration: lateMinutes,
      status: record.status || (lateMinutes > 0 ? 'Late' : (record.check_in ? 'Present' : prev.status)),
      updated_by: currentUser,
      updated_at: new Date().toISOString(),
    } as AttendanceRecord;
    existing[matchIndex] = saved;
    await recordAudit('Attendance', 'UPDATE', saved.id, `${saved.employee_id} - ${saved.date}`, JSON.stringify(prev), JSON.stringify(saved), record.correction_reason || 'Attendance updated', currentUser);
  } else {
    saved = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employee_id: record.employee_id!,
      date: record.date || new Date().toISOString().split('T')[0],
      shift_name: record.shift_name || 'Day',
      scheduled_start: record.scheduled_start || '10:00',
      scheduled_end: record.scheduled_end || '18:30',
      check_in: record.check_in,
      check_out: record.check_out,
      break_minutes: record.break_minutes || 45,
      working_hours: workingHours,
      late_duration: lateMinutes,
      early_leave_minutes: record.early_leave_minutes || 0,
      status: record.status || (lateMinutes > 0 ? 'Late' : (record.check_in ? 'Present' : 'Absent')),
      notes: record.notes || '',
      is_corrected: Boolean(record.is_corrected),
      correction_reason: record.correction_reason,
      updated_by: currentUser,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    existing.push(saved);
    await recordAudit('Attendance', 'CREATE', saved.id, `${saved.employee_id} - ${saved.date}`, undefined, JSON.stringify(saved), 'Attendance recorded', currentUser);
  }

  writeLocal('attendance', existing);

  if (isLiveSupabaseConfigured()) {
    try {
      await getSupabaseClient().from('attendance').upsert([saved]);
    } catch (e) {
      console.warn('Could not sync attendance to Supabase', e);
    }
  }

  return saved;
}

// ----------------- ROSTER REPOSITORY -----------------
export async function getRoster(startDate?: string, endDate?: string): Promise<RosterEntry[]> {
  let records: RosterEntry[] = [];
  if (isLiveSupabaseConfigured()) {
    try {
      let query = getSupabaseClient().from('rosters').select('*').order('date', { ascending: true });
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      const { data, error } = await query;
      if (!error && data) {
        records = data as RosterEntry[];
        writeLocal('rosters', records);
        return records;
      }
    } catch (e) {
      console.warn('Falling back to local roster', e);
    }
  }
  records = readLocal<RosterEntry[]>('rosters', []);
  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);
  return records;
}

export async function saveRosterEntries(entries: Partial<RosterEntry>[], currentUser: string = 'Ananya Rahman'): Promise<RosterEntry[]> {
  const existing = readLocal<RosterEntry[]>('rosters', []);
  const savedList: RosterEntry[] = [];

  for (const entry of entries) {
    const idx = existing.findIndex(r => r.employee_id === entry.employee_id && r.date === entry.date);
    let item: RosterEntry;
    if (idx >= 0) {
      item = {
        ...existing[idx],
        ...entry,
        updated_at: new Date().toISOString(),
      } as RosterEntry;
      existing[idx] = item;
    } else {
      item = {
        id: `roster-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employee_id: entry.employee_id!,
        date: entry.date!,
        shift_id: entry.shift_id || 'shift-2',
        shift_name: entry.shift_name || 'Day',
        start_time: entry.start_time || '10:00',
        end_time: entry.end_time || '18:30',
        is_backup: Boolean(entry.is_backup),
        notes: entry.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      existing.push(item);
    }
    savedList.push(item);
  }

  writeLocal('rosters', existing);
  await recordAudit('Roster', 'UPDATE', undefined, `Updated ${entries.length} roster assignments`, undefined, undefined, 'Roster assignment modified', currentUser);

  if (isLiveSupabaseConfigured()) {
    try {
      await getSupabaseClient().from('rosters').upsert(savedList);
    } catch (e) {
      console.warn('Could not sync roster to Supabase', e);
    }
  }

  return savedList;
}

// ----------------- LEAVE REPOSITORY (WITH CROSS-MODULE SYNC) -----------------
export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  if (isLiveSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabaseClient().from('leave_requests').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        writeLocal('leave_requests', data);
        return data as LeaveRequest[];
      }
    } catch (e) {
      console.warn('Falling back to local leave requests', e);
    }
  }
  return readLocal<LeaveRequest[]>('leave_requests', []);
}

export async function submitLeaveRequest(req: Partial<LeaveRequest>, currentUser: string = 'Ananya Rahman'): Promise<LeaveRequest> {
  const existing = readLocal<LeaveRequest[]>('leave_requests', []);
  const newReq: LeaveRequest = {
    id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    employee_id: req.employee_id!,
    leave_type: req.leave_type || 'Casual Leave',
    start_date: req.start_date || new Date().toISOString().split('T')[0],
    end_date: req.end_date || new Date().toISOString().split('T')[0],
    days_count: req.days_count || 1,
    reason: req.reason || '',
    submitted_date: new Date().toISOString().split('T')[0],
    status: req.status || 'Pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  existing.unshift(newReq);
  writeLocal('leave_requests', existing);
  await recordAudit('Leave', 'CREATE', newReq.id, `${newReq.employee_id} - ${newReq.leave_type}`, undefined, JSON.stringify(newReq), 'Leave application submitted', currentUser);

  if (isLiveSupabaseConfigured()) {
    try {
      await getSupabaseClient().from('leave_requests').insert([newReq]);
    } catch (e) {
      console.warn('Could not sync leave to Supabase', e);
    }
  }

  return newReq;
}

export async function updateLeaveStatus(
  id: string,
  status: 'Approved' | 'Declined' | 'Cancelled',
  comments?: string,
  currentUser: string = 'Ananya Rahman'
): Promise<LeaveRequest> {
  const existing = readLocal<LeaveRequest[]>('leave_requests', []);
  const idx = existing.findIndex(l => l.id === id);
  if (idx < 0) throw new Error('Leave request not found');

  const req = existing[idx];
  const updatedReq: LeaveRequest = {
    ...req,
    status,
    decision_by: currentUser,
    decision_date: new Date().toISOString(),
    comments: comments || req.comments,
    updated_at: new Date().toISOString(),
  };

  existing[idx] = updatedReq;
  writeLocal('leave_requests', existing);
  await recordAudit('Leave', status === 'Approved' ? 'APPROVE' : 'REJECT', id, `${req.employee_id} - ${req.leave_type}`, req.status, status, comments, currentUser);

  // Cross-module synchronization: If APPROVED, auto-update Attendance, Calendar, and Employee status
  if (status === 'Approved') {
    // Generate dates between start_date and end_date
    const start = new Date(req.start_date);
    const end = new Date(req.end_date);
    const dateList: string[] = [];
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      dateList.push(dt.toISOString().split('T')[0]);
    }

    const attendanceRecords = readLocal<AttendanceRecord[]>('attendance', []);
    for (const d of dateList) {
      const attIdx = attendanceRecords.findIndex(a => a.employee_id === req.employee_id && a.date === d);
      const leaveAttendance: AttendanceRecord = {
        id: attIdx >= 0 ? attendanceRecords[attIdx].id : `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employee_id: req.employee_id,
        date: d,
        shift_name: 'Leave',
        break_minutes: 0,
        working_hours: 0,
        late_duration: 0,
        early_leave_minutes: 0,
        status: 'Leave',
        notes: `Approved Leave: ${req.leave_type}`,
        is_corrected: false,
        updated_by: currentUser,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (attIdx >= 0) attendanceRecords[attIdx] = leaveAttendance;
      else attendanceRecords.push(leaveAttendance);
    }
    writeLocal('attendance', attendanceRecords);

    // Update employee status to 'On Leave' if current date falls in range
    const today = new Date().toISOString().split('T')[0];
    if (today >= req.start_date && today <= req.end_date) {
      const employees = readLocal<Employee[]>('employees', []);
      const empIdx = employees.findIndex(e => e.id === req.employee_id || e.employee_id === req.employee_id);
      if (empIdx >= 0 && employees[empIdx].status === 'Active') {
        employees[empIdx].status = 'On Leave';
        employees[empIdx].updated_at = new Date().toISOString();
        writeLocal('employees', employees);
      }
    }
  }

  if (isLiveSupabaseConfigured()) {
    try {
      await getSupabaseClient().from('leave_requests').update({
        status,
        decision_by: currentUser,
        decision_date: updatedReq.decision_date,
        comments: updatedReq.comments,
      }).eq('id', id);
    } catch (e) {
      console.warn('Could not update leave on Supabase', e);
    }
  }

  return updatedReq;
}

// ----------------- OVERTIME & BACKUP HOURS REPOSITORY -----------------
export async function getOvertime(month?: string): Promise<OvertimeRecord[]> {
  let records = readLocal<OvertimeRecord[]>('overtime', []);
  if (month) records = records.filter(r => r.date.startsWith(month));
  return records;
}

export async function saveOvertime(ot: Partial<OvertimeRecord>, currentUser: string = 'Ananya Rahman'): Promise<OvertimeRecord> {
  const existing = readLocal<OvertimeRecord[]>('overtime', []);
  const newOt: OvertimeRecord = {
    id: ot.id || `ot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    employee_id: ot.employee_id!,
    date: ot.date || new Date().toISOString().split('T')[0],
    hours: Number(ot.hours || 0),
    rate_multiplier: ot.rate_multiplier || 1.5,
    reason: ot.reason || 'Peak student support inquiries',
    approved_by: currentUser,
    notes: ot.notes || '',
    created_at: new Date().toISOString(),
  };

  existing.push(newOt);
  writeLocal('overtime', existing);
  await recordAudit('Overtime', 'CREATE', newOt.id, `${newOt.employee_id} - ${newOt.hours} hrs`, undefined, JSON.stringify(newOt), 'OT hours recorded', currentUser);
  return newOt;
}

export async function getBackupHours(month?: string): Promise<BackupHourRecord[]> {
  let records = readLocal<BackupHourRecord[]>('backup_hours', []);
  if (month) records = records.filter(r => r.date.startsWith(month));
  return records;
}

export async function saveBackupHour(bck: Partial<BackupHourRecord>, currentUser: string = 'Ananya Rahman'): Promise<BackupHourRecord> {
  const existing = readLocal<BackupHourRecord[]>('backup_hours', []);
  const newBck: BackupHourRecord = {
    id: bck.id || `bck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    employee_id: bck.employee_id!,
    date: bck.date || new Date().toISOString().split('T')[0],
    backup_hours: Number(bck.backup_hours || 0),
    reason: bck.reason || 'Standby coverage for night shift',
    assigned_shift: bck.assigned_shift || 'Backup',
    notes: bck.notes || '',
    created_at: new Date().toISOString(),
  };

  existing.push(newBck);
  writeLocal('backup_hours', existing);
  await recordAudit('Backup Hours', 'CREATE', newBck.id, `${newBck.employee_id} - ${newBck.backup_hours} hrs`, undefined, JSON.stringify(newBck), 'Backup duty hours recorded', currentUser);
  return newBck;
}

// ----------------- MEALS & MEAL COLLECTION REPOSITORY -----------------
export async function getDailyMeals(date?: string): Promise<DailyMealRecord[]> {
  let records = readLocal<DailyMealRecord[]>('meals', []);
  if (date) records = records.filter(r => r.date === date);
  return records;
}

export async function saveDailyMeal(record: Partial<DailyMealRecord>, currentUser: string = 'Ananya Rahman'): Promise<DailyMealRecord> {
  const existing = readLocal<DailyMealRecord[]>('meals', []);
  const settings = readLocal<SystemSettings>('system_settings', DEFAULT_SYSTEM_SETTINGS);

  const bfCost = record.breakfast ? (settings.breakfast_price || 20) : 0;
  const lnCost = record.lunch ? (settings.lunch_price || 35) : 0;
  const dnCost = record.dinner ? (settings.dinner_price || 17) : 0;
  // If all 3 taken, default is 72 TK
  const totalCost = (record.breakfast && record.lunch && record.dinner)
    ? (settings.default_daily_meal_price || 72)
    : (bfCost + lnCost + dnCost);

  const idx = existing.findIndex(m => m.employee_id === record.employee_id && m.date === record.date);
  let saved: DailyMealRecord;

  if (idx >= 0) {
    saved = {
      ...existing[idx],
      ...record,
      total_meal_cost: totalCost,
      updated_at: new Date().toISOString(),
    } as DailyMealRecord;
    existing[idx] = saved;
  } else {
    saved = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employee_id: record.employee_id!,
      date: record.date || new Date().toISOString().split('T')[0],
      breakfast: Boolean(record.breakfast),
      lunch: Boolean(record.lunch),
      dinner: Boolean(record.dinner),
      total_meal_cost: totalCost,
      notes: record.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    existing.push(saved);
  }

  writeLocal('meals', existing);
  await recordAudit('Meals', 'UPDATE', saved.id, `${saved.employee_id} - ${saved.date}`, undefined, `${totalCost} TK`, 'Meal record updated', currentUser);

  // Cross-module update: Recalculate monthly meal collection
  const month = saved.date.substring(0, 7); // YYYY-MM
  await updateMealCollectionForEmployee(saved.employee_id, month);

  return saved;
}

export async function getMealCollections(month?: string): Promise<MealCollection[]> {
  let records = readLocal<MealCollection[]>('meal_collections', []);
  if (month) records = records.filter(c => c.month === month);
  return records;
}

export async function updateMealCollectionForEmployee(employeeId: string, month: string): Promise<MealCollection> {
  const meals = readLocal<DailyMealRecord[]>('meals', []);
  const monthlyMeals = meals.filter(m => m.employee_id === employeeId && m.date.startsWith(month));
  const totalPayable = monthlyMeals.reduce((sum, m) => sum + (m.total_meal_cost || 0), 0);

  const collections = readLocal<MealCollection[]>('meal_collections', []);
  const idx = collections.findIndex(c => c.employee_id === employeeId && c.month === month);

  let collection: MealCollection;
  if (idx >= 0) {
    const existing = collections[idx];
    const outstanding = Math.max(0, totalPayable - (existing.amount_paid || 0));
    const status = outstanding === 0 ? 'Paid' : (existing.amount_paid > 0 ? 'Partial' : 'Due');
    collection = {
      ...existing,
      total_payable: totalPayable,
      outstanding_amount: outstanding,
      payment_status: status,
      updated_at: new Date().toISOString(),
    };
    collections[idx] = collection;
  } else {
    collection = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employee_id: employeeId,
      month,
      total_payable: totalPayable,
      amount_paid: 0,
      outstanding_amount: totalPayable,
      payment_status: totalPayable > 0 ? 'Due' : 'Paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    collections.push(collection);
  }

  writeLocal('meal_collections', collections);
  return collection;
}

export async function recordMealPayment(
  collectionId: string,
  amount: number,
  method: 'Cash' | 'bKash' | 'Bank Transfer' | 'Other',
  notes?: string,
  currentUser: string = 'Ananya Rahman'
): Promise<MealCollection> {
  const collections = readLocal<MealCollection[]>('meal_collections', []);
  const idx = collections.findIndex(c => c.id === collectionId);
  if (idx < 0) throw new Error('Collection record not found');

  const cur = collections[idx];
  const newAmountPaid = (cur.amount_paid || 0) + amount;
  const newOutstanding = Math.max(0, cur.total_payable - newAmountPaid);
  const status = newOutstanding === 0 ? 'Paid' : 'Partial';

  const updated: MealCollection = {
    ...cur,
    amount_paid: newAmountPaid,
    outstanding_amount: newOutstanding,
    payment_status: status,
    payment_method: method,
    payment_date: new Date().toISOString().split('T')[0],
    notes: notes || cur.notes,
    updated_at: new Date().toISOString(),
  };

  collections[idx] = updated;
  writeLocal('meal_collections', collections);
  await recordAudit('Meal Collections', 'UPDATE', cur.id, `${cur.employee_id} - ${amount} TK via ${method}`, `Paid: ${cur.amount_paid}`, `Paid: ${newAmountPaid}`, notes, currentUser);

  return updated;
}

// ----------------- BAZAR & EXPENSES REPOSITORY -----------------
export async function getBazarTransactions(month?: string): Promise<BazarTransaction[]> {
  let records = readLocal<BazarTransaction[]>('bazar_transactions', []);
  if (month) records = records.filter(b => b.date.startsWith(month));
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveBazarTransaction(tx: Partial<BazarTransaction>, currentUser: string = 'Ananya Rahman'): Promise<BazarTransaction> {
  const existing = readLocal<BazarTransaction[]>('bazar_transactions', []);

  const saved: BazarTransaction = {
    id: tx.id || `bazar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    date: tx.date || new Date().toISOString().split('T')[0],
    category: tx.category || 'Daily Bazar',
    description: tx.description || 'Groceries and meal supplies for SSP shift team',
    amount_received: Number(tx.amount_received || 0),
    extra_funds: Number(tx.extra_funds || 0),
    amount_spent: Number(tx.amount_spent || 0),
    returned_amount: Number(tx.returned_amount || 0),
    provider: tx.provider || 'HR Funding',
    recorded_by: currentUser,
    notes: tx.notes || '',
    voucher_url: tx.voucher_url,
    created_at: new Date().toISOString(),
  };

  existing.unshift(saved);
  writeLocal('bazar_transactions', existing);

  const netBalance = saved.amount_received + saved.extra_funds - saved.amount_spent - saved.returned_amount;
  await recordAudit('Bazar & Expenses', 'CREATE', saved.id, `${saved.category}: Spent ${saved.amount_spent} TK`, undefined, `Net: ${netBalance} TK`, saved.description, currentUser);

  return saved;
}

export function calculateBazarSummary(transactions: BazarTransaction[]): {
  totalReceived: number;
  totalExtra: number;
  totalSpent: number;
  totalReturned: number;
  currentBalance: number;
} {
  let totalReceived = 0;
  let totalExtra = 0;
  let totalSpent = 0;
  let totalReturned = 0;

  for (const t of transactions) {
    totalReceived += Number(t.amount_received || 0);
    totalExtra += Number(t.extra_funds || 0);
    totalSpent += Number(t.amount_spent || 0);
    totalReturned += Number(t.returned_amount || 0);
  }

  const currentBalance = totalReceived + totalExtra - totalSpent - totalReturned;
  return { totalReceived, totalExtra, totalSpent, totalReturned, currentBalance };
}

// ----------------- DAILY OPERATIONS & INCIDENTS REPOSITORY -----------------
export async function getDailyOperations(date?: string): Promise<DailyOperation[]> {
  let ops = readLocal<DailyOperation[]>('daily_operations', []);
  if (date) ops = ops.filter(o => o.date === date);
  return ops;
}

export async function saveDailyOperation(op: Partial<DailyOperation>, currentUser: string = 'Ananya Rahman'): Promise<DailyOperation> {
  const existing = readLocal<DailyOperation[]>('daily_operations', []);
  const idx = existing.findIndex(o => o.id === op.id);

  let saved: DailyOperation;
  if (idx >= 0) {
    saved = { ...existing[idx], ...op, updated_at: new Date().toISOString() } as DailyOperation;
    existing[idx] = saved;
    await recordAudit('Operations', 'UPDATE', saved.id, saved.task_title, undefined, saved.status, 'Operation updated', currentUser);
  } else {
    saved = {
      id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: op.date || new Date().toISOString().split('T')[0],
      task_title: op.task_title || 'Shift Duty & Handover',
      description: op.description || '',
      responsible_employee_id: op.responsible_employee_id,
      shift: op.shift || 'Day',
      priority: op.priority || 'Medium',
      status: op.status || 'Pending',
      handover_notes: op.handover_notes || '',
      due_time: op.due_time,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    existing.push(saved);
    await recordAudit('Operations', 'CREATE', saved.id, saved.task_title, undefined, saved.status, 'New task added', currentUser);
  }

  writeLocal('daily_operations', existing);
  return saved;
}

export async function getIncidents(): Promise<IncidentRecord[]> {
  return readLocal<IncidentRecord[]>('incidents', []);
}

export async function saveIncident(inc: Partial<IncidentRecord>, currentUser: string = 'Ananya Rahman'): Promise<IncidentRecord> {
  const existing = readLocal<IncidentRecord[]>('incidents', []);
  const idx = existing.findIndex(i => i.id === inc.id);

  let saved: IncidentRecord;
  if (idx >= 0) {
    saved = { ...existing[idx], ...inc, updated_at: new Date().toISOString() } as IncidentRecord;
    existing[idx] = saved;
    await recordAudit('Incidents', 'UPDATE', saved.id, saved.category, undefined, saved.status, inc.action_taken, currentUser);
  } else {
    saved = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: inc.date || new Date().toISOString().split('T')[0],
      person_involved_id: inc.person_involved_id,
      person_involved_name: inc.person_involved_name,
      category: inc.category || 'Shift Disruption',
      description: inc.description || '',
      action_taken: inc.action_taken || '',
      responsible_person: inc.responsible_person || currentUser,
      follow_up_date: inc.follow_up_date,
      status: inc.status || 'Open',
      notes: inc.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    existing.unshift(saved);
    await recordAudit('Incidents', 'CREATE', saved.id, saved.category, undefined, saved.status, saved.description, currentUser);
  }

  writeLocal('incidents', existing);
  return saved;
}

// ----------------- CALENDAR, ANNOUNCEMENTS & NOTIFICATIONS -----------------
export async function getAnnouncements(): Promise<Announcement[]> {
  return readLocal<Announcement[]>('announcements', []);
}

export async function saveAnnouncement(ann: Partial<Announcement>, currentUser: string = 'Ananya Rahman'): Promise<Announcement> {
  const existing = readLocal<Announcement[]>('announcements', []);
  const saved: Announcement = {
    id: ann.id || `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: ann.title || 'Team Announcement',
    content: ann.content || '',
    priority: ann.priority || 'Normal',
    target_audience: ann.target_audience || 'All',
    created_by: currentUser,
    created_at: new Date().toISOString(),
    expires_at: ann.expires_at,
    is_active: ann.is_active !== undefined ? ann.is_active : true,
  };

  existing.unshift(saved);
  writeLocal('announcements', existing);
  await recordAudit('Announcements', 'CREATE', saved.id, saved.title, undefined, saved.priority, 'Announcement posted', currentUser);
  return saved;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return readLocal<NotificationItem[]>('notifications', []);
}

export async function markNotificationRead(id: string): Promise<void> {
  const notifs = readLocal<NotificationItem[]>('notifications', []);
  const updated = notifs.map(n => (n.id === id ? { ...n, read: true } : n));
  writeLocal('notifications', updated);
}

// ----------------- MONTHLY CLOSING REPOSITORY -----------------
export async function getMonthlyClosings(): Promise<MonthlyClosing[]> {
  return readLocal<MonthlyClosing[]>('monthly_closings', []);
}

export async function isMonthLocked(month: string): Promise<boolean> {
  const closings = await getMonthlyClosings();
  const c = closings.find(c => c.month === month);
  return Boolean(c && c.is_locked);
}

export async function closeMonth(month: string, summaryNotes?: string, currentUser: string = 'Ananya Rahman'): Promise<MonthlyClosing> {
  const closings = readLocal<MonthlyClosing[]>('monthly_closings', []);
  const attendance = readLocal<AttendanceRecord[]>('attendance', []).filter(a => a.date.startsWith(month));
  const ot = readLocal<OvertimeRecord[]>('overtime', []).filter(o => o.date.startsWith(month));
  const bck = readLocal<BackupHourRecord[]>('backup_hours', []).filter(b => b.date.startsWith(month));
  const meals = readLocal<DailyMealRecord[]>('meals', []).filter(m => m.date.startsWith(month));
  const collections = readLocal<MealCollection[]>('meal_collections', []).filter(c => c.month === month);
  const bazar = readLocal<BazarTransaction[]>('bazar_transactions', []).filter(b => b.date.startsWith(month));

  const totalWorking = attendance.reduce((s, a) => s + (a.working_hours || 0), 0);
  const totalOt = ot.reduce((s, o) => s + (o.hours || 0), 0);
  const totalBck = bck.reduce((s, b) => s + (b.backup_hours || 0), 0);
  const totalMealCost = meals.reduce((s, m) => s + (m.total_meal_cost || 0), 0);
  const totalMealCollected = collections.reduce((s, c) => s + (c.amount_paid || 0), 0);
  const totalBazarSpent = bazar.reduce((s, b) => s + (b.amount_spent || 0), 0);
  const totalBazarReceived = bazar.reduce((s, b) => s + (b.amount_received + b.extra_funds - b.returned_amount), 0);

  const closing: MonthlyClosing = {
    id: `closing-${month}`,
    month,
    closed_at: new Date().toISOString(),
    closed_by: currentUser,
    is_locked: true,
    total_working_hours: Number(totalWorking.toFixed(1)),
    total_ot_hours: totalOt,
    total_backup_hours: totalBck,
    total_meal_cost: totalMealCost,
    total_meal_collected: totalMealCollected,
    total_bazar_spent: totalBazarSpent,
    net_balance: totalBazarReceived - totalBazarSpent,
    summary_notes: summaryNotes || `SSP Monthly Closing completed for ${month}`,
  };

  const idx = closings.findIndex(c => c.month === month);
  if (idx >= 0) closings[idx] = closing;
  else closings.push(closing);

  writeLocal('monthly_closings', closings);
  await recordAudit('Monthly Closing', 'LOCK', closing.id, `Period: ${month}`, 'Open', 'Locked', summaryNotes, currentUser);
  return closing;
}

export async function unlockMonth(month: string, reason: string, currentUser: string = 'Ananya Rahman'): Promise<MonthlyClosing> {
  const closings = readLocal<MonthlyClosing[]>('monthly_closings', []);
  const idx = closings.findIndex(c => c.month === month);
  if (idx < 0) throw new Error('Closing record not found');

  const updated: MonthlyClosing = {
    ...closings[idx],
    is_locked: false,
    unlocked_at: new Date().toISOString(),
    unlocked_by: currentUser,
    unlock_reason: reason,
  };

  closings[idx] = updated;
  writeLocal('monthly_closings', closings);
  await recordAudit('Monthly Closing', 'UNLOCK', updated.id, `Period: ${month}`, 'Locked', 'Unlocked', reason, currentUser);
  return updated;
}

// ----------------- AUDIT LOGS REPOSITORY -----------------
export async function getAuditLogs(): Promise<AuditLog[]> {
  return readLocal<AuditLog[]>('audit_logs', []);
}

// ----------------- SYSTEM SETTINGS -----------------
export function getSystemSettings(): SystemSettings {
  return readLocal<SystemSettings>('system_settings', DEFAULT_SYSTEM_SETTINGS);
}

export async function saveSystemSettings(settings: Partial<SystemSettings>, currentUser: string = 'Ananya Rahman'): Promise<SystemSettings> {
  const cur = getSystemSettings();
  const updated: SystemSettings = { ...cur, ...settings };
  writeLocal('system_settings', updated);
  await recordAudit('System Settings', 'UPDATE', 'settings', 'Company and Operating Parameters', JSON.stringify(cur), JSON.stringify(updated), 'System settings modified', currentUser);
  return updated;
}

// ----------------- PROFILES REPOSITORY -----------------
export async function getProfiles(): Promise<Profile[]> {
  if (isLiveSupabaseConfigured()) {
    try {
      const { data, error } = await getSupabaseClient().from('profiles').select('*');
      if (!error && data) {
        writeLocal('profiles', data);
        return data as Profile[];
      }
    } catch (e) {
      console.warn('Falling back to local profiles', e);
    }
  }
  return readLocal<Profile[]>('profiles', []);
}

export async function saveProfile(profile: Partial<Profile>): Promise<Profile> {
  const existing = await getProfiles();
  const cleanEmail = safeTrim(profile.email);
  const idx = existing.findIndex(
    p => (profile.id && p.id === profile.id) ||
      (cleanEmail && safeLower(p.email) === safeLower(cleanEmail))
  );

  let saved: Profile;
  if (idx >= 0) {
    saved = {
      ...existing[idx],
      ...profile,
      full_name: safeTrim(profile.full_name) || existing[idx].full_name || 'Ananya Rahman',
      designation: safeTrim(profile.designation) || existing[idx].designation || 'Head of Student Support Team',
      department: safeTrim(profile.department) || existing[idx].department || 'Student Support Team',
      phone: profile.phone !== undefined ? safeTrim(profile.phone) : existing[idx].phone,
      updated_at: new Date().toISOString(),
    } as Profile;
    existing[idx] = saved;
  } else {
    // If first profile ever created or master admin, make Super Admin!
    const isMaster = safeLower(cleanEmail) === 'rahman.ononnaa@gmail.com' ||
      safeLower(cleanEmail) === 'ananya@gmail.com' ||
      safeLower(cleanEmail) === 'onuufool@gmail.com';
    const role: Profile['role'] = (existing.length === 0 || isMaster) ? 'Super Admin' : (profile.role || 'Viewer');
    saved = {
      id: profile.id && isValidUuid(profile.id) ? profile.id : generateUuid(),
      email: cleanEmail,
      full_name: safeTrim(profile.full_name) || (isMaster ? 'Ananya Rahman' : (cleanEmail.split('@')[0] || 'SSP Member')),
      designation: safeTrim(profile.designation) || (isMaster ? 'Head of Student Support Team' : 'SSP Executive'),
      department: safeTrim(profile.department) || 'Student Support Team',
      role: (profile.role as any) || role,
      phone: safeTrim(profile.phone) || (isMaster ? '01711002233' : ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    existing.push(saved);
  }

  writeLocal('profiles', existing);

  // Sync to Supabase profiles table (only supported columns in profiles table)
  if (isLiveSupabaseConfigured()) {
    try {
      const dbProfile = {
        id: saved.id,
        email: saved.email,
        full_name: saved.full_name,
        role: saved.role,
        phone: saved.phone || '',
        avatar_url: saved.avatar_url || '',
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      };
      await getSupabaseClient().from('profiles').upsert([dbProfile], { onConflict: 'id' });
    } catch (e) {
      console.warn('Could not sync profile to Supabase', e);
    }
  }

  // Cross-sync: If this profile corresponds to an employee (e.g. Ananya Rahman), also update the employee record
  try {
    const employees = await getEmployees();
    const matchedEmp = employees.find(
      e => (e.profile_id && e.profile_id === saved.id) ||
        (saved.email && safeLower(e.email) === safeLower(saved.email)) ||
        (saved.full_name && safeLower(e.full_name || e.name) === safeLower(saved.full_name))
    );
    if (matchedEmp) {
      await saveEmployee({
        ...matchedEmp,
        profile_id: saved.id,
        full_name: saved.full_name,
        name: saved.full_name,
        designation: saved.designation || matchedEmp.designation,
        position: saved.designation || matchedEmp.position,
        phone: saved.phone || matchedEmp.phone,
        department: saved.department || matchedEmp.department,
      });
    }
  } catch (err) {
    console.warn('Cross-sync profile to employee warning:', err);
  }

  return saved;
}

// ----------------- INITIAL SEEDING HELPER -----------------
// Seed initial baseline records if none exist, so the user has immediate professional operational context
export function initializeDefaultSeedData() {
  const employees = readLocal<Employee[]>('employees', []);
  if (employees.length === 0) {
    const seedEmployees: Employee[] = [
      {
        id: 'a0000000-0000-4000-8000-000000000001',
        employee_code: 'SSP-001',
        employee_id: 'SSP-001',
        full_name: 'Ananya Rahman',
        name: 'Ananya Rahman',
        email: 'rahman.ononnaa@gmail.com',
        phone: '01711002233',
        designation: 'Head of Student Support Team',
        position: 'Head of Student Support Team',
        department: 'Student Support Team',
        joining_date: '2024-01-01',
        status: 'Active',
        notes: 'Head of Student Support Team and Operations Commander',
        default_shift: 'Day',
        emergency_contact: 'Family',
        emergency_phone: '01811223344',
        created_at: '2026-01-01T08:00:00Z',
      },
      {
        id: 'a0000000-0000-4000-8000-000000000002',
        employee_code: 'SSP-002',
        employee_id: 'SSP-002',
        full_name: 'Tanvir Hossain',
        name: 'Tanvir Hossain',
        email: 'tanvir.ssp@gmail.com',
        phone: '01819283746',
        designation: 'Senior SSP Executive',
        position: 'Senior SSP Executive',
        department: 'Student Support Team',
        joining_date: '2024-03-15',
        status: 'Active',
        notes: 'Morning shift specialist and science inquiries lead',
        default_shift: 'Morning',
        emergency_contact: 'Father',
        emergency_phone: '01911223344',
        created_at: '2026-01-05T08:00:00Z',
      },
      {
        id: 'a0000000-0000-4000-8000-000000000003',
        employee_code: 'SSP-003',
        employee_id: 'SSP-003',
        full_name: 'Nusrat Jahan',
        name: 'Nusrat Jahan',
        email: 'nusrat.ssp@gmail.com',
        phone: '01928374650',
        designation: 'SSP Executive',
        position: 'SSP Executive',
        department: 'Student Support Team',
        joining_date: '2024-06-01',
        status: 'Active',
        notes: 'Evening shift lead and student counseling',
        default_shift: 'Evening',
        emergency_contact: 'Brother',
        emergency_phone: '01611223344',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'a0000000-0000-4000-8000-000000000004',
        employee_code: 'SSP-004',
        employee_id: 'SSP-004',
        full_name: 'Kazi Mahfuzur',
        name: 'Kazi Mahfuzur',
        email: 'mahfuz.ssp@gmail.com',
        phone: '01534567890',
        designation: 'SSP Technical In-Charge',
        position: 'SSP Technical In-Charge',
        department: 'Student Support Team',
        joining_date: '2024-08-01',
        status: 'Active',
        notes: 'Night shift operations and platform live class monitoring',
        default_shift: 'Night',
        emergency_contact: 'Mother',
        emergency_phone: '01711223344',
        created_at: '2026-01-15T08:00:00Z',
      },
    ];
    writeLocal('employees', seedEmployees);

    // Initial default profile for Ananya Rahman
    const defaultAnanyaProfile: Profile = {
      id: 'a0000000-0000-4000-8000-000000000001',
      email: 'rahman.ononnaa@gmail.com',
      full_name: 'Ananya Rahman',
      designation: 'Head of Student Support Team',
      department: 'Student Support Team',
      role: 'Super Admin',
      phone: '01711002233',
      created_at: '2026-01-01T08:00:00Z',
      updated_at: new Date().toISOString(),
    };
    writeLocal('profiles', [defaultAnanyaProfile]);

    // Seed default meal prices, shifts, leave types, settings
    writeLocal('system_settings', DEFAULT_SYSTEM_SETTINGS);
    writeLocal('shifts', DEFAULT_SHIFTS);
    writeLocal('leave_types', DEFAULT_LEAVE_TYPES);

    // Seed today's attendance & meals
    const today = new Date().toISOString().split('T')[0];
    const seedAttendance: AttendanceRecord[] = [
      {
        id: 'att-seed-1',
        employee_id: 'SSP-001',
        date: today,
        shift_name: 'Day',
        scheduled_start: '10:00',
        scheduled_end: '18:30',
        check_in: '09:55',
        check_out: '',
        break_minutes: 45,
        working_hours: 0,
        late_duration: 0,
        early_leave_minutes: 0,
        status: 'Present',
        notes: 'On duty',
        is_corrected: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'att-seed-2',
        employee_id: 'SSP-002',
        date: today,
        shift_name: 'Morning',
        scheduled_start: '07:00',
        scheduled_end: '15:30',
        check_in: '07:05',
        check_out: '15:35',
        break_minutes: 45,
        working_hours: 7.75,
        late_duration: 5,
        early_leave_minutes: 0,
        status: 'Present',
        notes: 'Morning shift completed smoothly',
        is_corrected: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'att-seed-3',
        employee_id: 'SSP-003',
        date: today,
        shift_name: 'Evening',
        scheduled_start: '15:00',
        scheduled_end: '23:30',
        check_in: '15:02',
        break_minutes: 45,
        working_hours: 0,
        late_duration: 0,
        early_leave_minutes: 0,
        status: 'Present',
        notes: 'Active evening shift',
        is_corrected: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'att-seed-4',
        employee_id: 'SSP-004',
        date: today,
        shift_name: 'Night',
        scheduled_start: '23:00',
        scheduled_end: '07:30',
        break_minutes: 60,
        working_hours: 0,
        late_duration: 0,
        early_leave_minutes: 0,
        status: 'Off',
        notes: 'Scheduled for tonight',
        is_corrected: false,
        created_at: new Date().toISOString(),
      },
    ];
    writeLocal('attendance', seedAttendance);

    // Seed meals for today
    const seedMeals: DailyMealRecord[] = [
      { id: 'meal-seed-1', employee_id: 'SSP-001', date: today, breakfast: true, lunch: true, dinner: true, total_meal_cost: 72, created_at: new Date().toISOString() },
      { id: 'meal-seed-2', employee_id: 'SSP-002', date: today, breakfast: true, lunch: true, dinner: false, total_meal_cost: 55, created_at: new Date().toISOString() },
      { id: 'meal-seed-3', employee_id: 'SSP-003', date: today, breakfast: false, lunch: true, dinner: true, total_meal_cost: 52, created_at: new Date().toISOString() },
    ];
    writeLocal('meals', seedMeals);

    // Seed initial bazar
    const seedBazar: BazarTransaction[] = [
      {
        id: 'bazar-seed-1',
        date: today,
        category: 'Daily Bazar',
        description: 'Rice, Chicken, Vegetables, and Spices for SSP team kitchen',
        amount_received: 2500,
        extra_funds: 0,
        amount_spent: 2150,
        returned_amount: 350,
        provider: 'HR Funding',
        recorded_by: 'Ananya Rahman',
        created_at: new Date().toISOString(),
      },
    ];
    writeLocal('bazar_transactions', seedBazar);

    // Seed announcement
    const seedAnnouncements: Announcement[] = [
      {
        id: 'ann-seed-1',
        title: 'HSC Special Doubt-Solving Week',
        content: 'All SSP Executives are requested to coordinate with Physics and Chemistry instructors. Evening & Night coverage will be reinforced.',
        priority: 'Important',
        target_audience: 'All',
        created_by: 'Ananya Rahman (Head of SSP)',
        created_at: new Date().toISOString(),
        is_active: true,
      },
    ];
    writeLocal('announcements', seedAnnouncements);
  }
}
