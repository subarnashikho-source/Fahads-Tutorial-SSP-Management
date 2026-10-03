export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'HR/Accounts' | 'Supervisor' | 'Viewer';

export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave' | 'Archived';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Leave' | 'Off' | 'Backup';

export type ShiftType = 'Morning' | 'Day' | 'Evening' | 'Night' | 'Backup' | 'Custom';

export type LeaveStatus = 'Pending' | 'Approved' | 'Declined' | 'Cancelled';

export type OperationStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export type IncidentStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type PaymentMethod = 'Cash' | 'bKash' | 'Bank Transfer' | 'Other';

export interface Profile {
  id: string; // matches auth.users.id
  email: string;
  full_name: string;
  role: UserRole;
  designation?: string;
  department?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Employee {
  id: string;
  profile_id?: string | null;
  employee_code?: string; // DB column
  employee_id: string; // SSP-001, SSP-002, etc. (Frontend alias)
  full_name?: string; // DB column
  name: string; // Frontend alias
  designation?: string; // DB column
  position: string; // Frontend alias
  department?: string; // DB column
  email: string;
  phone: string;
  joining_date: string;
  status: EmployeeStatus;
  profile_photo?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
  documents?: { name: string; url: string; date: string }[];
  default_shift?: ShiftType;
  created_at: string;
  updated_at?: string;
  archived_at?: string;
}

export interface Shift {
  id: string;
  name: ShiftType | string;
  code: string;
  start_time: string; // '07:00'
  end_time: string;   // '15:30'
  break_minutes: number;
  color: string;
  description?: string;
  created_at: string;
}

export interface RosterEntry {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  shift_id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  is_backup: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  shift_name: string;
  scheduled_start?: string;
  scheduled_end?: string;
  check_in?: string; // HH:mm
  check_out?: string; // HH:mm
  break_minutes: number;
  working_hours: number; // calculated: checkout - checkin - break
  late_duration: number; // in minutes
  early_leave_minutes: number;
  status: AttendanceStatus;
  notes?: string;
  is_corrected: boolean;
  correction_reason?: string;
  updated_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface LeaveType {
  id: string;
  name: string;
  days_allowed: number;
  is_paid: boolean;
  description?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  submitted_date: string;
  status: LeaveStatus;
  decision_by?: string;
  decision_date?: string;
  comments?: string;
  created_at: string;
  updated_at?: string;
}

export interface OvertimeRecord {
  id: string;
  employee_id: string;
  date: string;
  hours: number;
  rate_multiplier: number; // default 1.5
  reason: string;
  approved_by: string;
  notes?: string;
  created_at: string;
}

export interface BackupHourRecord {
  id: string;
  employee_id: string;
  date: string;
  backup_hours: number;
  reason: string;
  assigned_shift: string;
  notes?: string;
  created_at: string;
}

export interface MealPrice {
  id: string;
  breakfast_price: number;
  lunch_price: number;
  dinner_price: number;
  daily_total_price: number; // default 72 TK
  effective_from: string;
}

export interface DailyMealRecord {
  id: string;
  employee_id: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  total_meal_cost: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface MealCollection {
  id: string;
  employee_id: string;
  month: string; // YYYY-MM
  total_payable: number;
  amount_paid: number;
  outstanding_amount: number; // total_payable - amount_paid
  payment_status: 'Paid' | 'Partial' | 'Due';
  payment_method?: PaymentMethod;
  payment_date?: string;
  transaction_ref?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface BazarTransaction {
  id: string;
  date: string;
  category: string;
  description: string;
  amount_received: number; // e.g. HR / Accounts funding or advance
  extra_funds: number;
  amount_spent: number;
  returned_amount: number;
  provider: string; // 'HR Funding', 'Accounts', 'SSP Advance'
  recorded_by: string;
  notes?: string;
  voucher_url?: string;
  created_at: string;
}

export interface DailyOperation {
  id: string;
  date: string;
  task_title: string;
  description?: string;
  responsible_employee_id?: string;
  shift?: ShiftType;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: OperationStatus;
  handover_notes?: string;
  due_time?: string;
  created_at: string;
  updated_at?: string;
}

export interface IncidentRecord {
  id: string;
  date: string;
  person_involved_id?: string;
  person_involved_name?: string;
  category: 'Shift Disruption' | 'Equipment' | 'Student Escalation' | 'Behavioral' | 'Other';
  description: string;
  action_taken: string;
  responsible_person: string;
  follow_up_date?: string;
  status: IncidentStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'Roster' | 'Leave' | 'Holiday' | 'Duty' | 'Event' | 'OT';
  description?: string;
  color?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  target_audience: 'All' | 'SSP Team' | 'Shift In-Charge';
  created_by: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'meal' | 'bazar' | 'roster' | 'system';
  link_module?: string;
  read: boolean;
  created_at: string;
}

export interface MonthlyClosing {
  id: string;
  month: string; // YYYY-MM
  closed_at: string;
  closed_by: string;
  is_locked: boolean;
  total_working_hours: number;
  total_ot_hours: number;
  total_backup_hours: number;
  total_meal_cost: number;
  total_meal_collected: number;
  total_bazar_spent: number;
  net_balance: number;
  unlocked_at?: string;
  unlocked_by?: string;
  unlock_reason?: string;
  summary_notes?: string;
}

export interface AuditLog {
  id: string;
  module: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'ARCHIVE' | 'RESTORE' | 'LOCK' | 'UNLOCK' | 'AUTH';
  record_id?: string;
  record_title?: string;
  previous_value?: string;
  new_value?: string;
  performed_by: string;
  reason?: string;
  created_at: string;
}

export interface SystemSettings {
  company_name: string;
  app_title: string;
  head_of_ssp: string;
  late_threshold_minutes: number;
  grace_period_minutes: number;
  default_daily_meal_price: number;
  breakfast_price: number;
  lunch_price: number;
  dinner_price: number;
  default_ot_multiplier: number;
  saturday_first_day_of_week: boolean;
  contact_email: string;
  contact_phone: string;
  theme_mode: 'light' | 'dark' | 'system';
}
