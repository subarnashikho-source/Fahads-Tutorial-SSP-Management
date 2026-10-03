import React, { useState, useEffect, useRef } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  FileSpreadsheet,
  Sliders,
  Calendar,
  Filter,
  CheckCircle,
  Eye,
  Layers,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import {
  getEmployees,
  getAttendance,
  getRoster,
  getLeaveRequests,
  getDailyMeals,
  getMealCollections,
  getBazarTransactions,
  getOvertime,
  getBackupHours,
  getDailyOperations,
  getIncidents,
  getMonthlyClosings,
  getAuditLogs,
  calculateBazarSummary,
} from '../../lib/storage';
import { applyPdfWatermark, DEFAULT_BRANDING, OFFICIAL_LOGO_BASE64 } from '../../lib/branding';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';

export type MasterReportType =
  | 'monthly_full'
  | 'attendance'
  | 'employees'
  | 'roster'
  | 'leave'
  | 'overtime'
  | 'backup'
  | 'meals'
  | 'meal_collection'
  | 'bazar'
  | 'operations'
  | 'incidents'
  | 'monthly_closing'
  | 'audit';

export const ReportsCenterView: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<MasterReportType>('monthly_full');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [watermarkOpacity, setWatermarkOpacity] = useState(DEFAULT_BRANDING.defaultWatermarkOpacity);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Loaded database entities
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [overtime, setOvertime] = useState<any[]>([]);
  const [backup, setBackup] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [bazar, setBazar] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [closings, setClosings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAllReportData();
  }, [selectedMonth]);

  async function loadAllReportData() {
    setLoading(true);
    try {
      const [
        emps,
        att,
        rost,
        lvs,
        ot,
        bck,
        mls,
        cols,
        bzr,
        ops,
        incs,
        cls,
        aud,
      ] = await Promise.all([
        getEmployees(),
        getAttendance(),
        getRoster(),
        getLeaveRequests(),
        getOvertime(selectedMonth),
        getBackupHours(selectedMonth),
        getDailyMeals(),
        getMealCollections(selectedMonth),
        getBazarTransactions(selectedMonth),
        getDailyOperations(),
        getIncidents(),
        getMonthlyClosings(),
        getAuditLogs(),
      ]);

      setEmployees(emps);
      setAttendance(att.filter(a => a.date.startsWith(selectedMonth)));
      setRoster(rost.filter(r => r.date.startsWith(selectedMonth)));
      setLeaves(lvs.filter(l => l.start_date.startsWith(selectedMonth) || l.end_date.startsWith(selectedMonth)));
      setOvertime(ot);
      setBackup(bck);
      setMeals(mls.filter(m => m.date.startsWith(selectedMonth)));
      setCollections(cols);
      setBazar(bzr);
      setOperations(ops.filter(o => o.date.startsWith(selectedMonth)));
      setIncidents(incs.filter(i => i.date.startsWith(selectedMonth)));
      setClosings(cls.filter(c => c.month === selectedMonth));
      setAuditLogs(aud);
    } finally {
      setLoading(false);
    }
  }

  // Report Titles map
  const reportTitles: Record<MasterReportType, string> = {
    monthly_full: 'Full SSP Monthly Executive Report',
    attendance: 'Staff Attendance & Working Hours Report',
    employees: 'Employee Directory & Staff Records Report',
    roster: 'Weekly Shift Scheduling & Roster Report',
    leave: 'Leave Applications & Approvals Report',
    overtime: 'Overtime Hours & Rate Calculation Report',
    backup: 'Standby Backup Duty Hours Report',
    meals: 'Daily Dining & Meal Expenses (72 TK) Report',
    meal_collection: 'Meal Collections & Dues Accounting Report',
    bazar: 'Daily Bazar & Operating Cash Ledger',
    operations: 'Daily Shift Handover & Operations Report',
    incidents: 'Operational Escalations & Incident Log',
    monthly_closing: 'Monthly Closing & Period Locking Audit',
    audit: 'System Security & Transaction Audit Trail',
  };

  // 1. Browser Multi-Page Printing
  const handlePrint = () => {
    window.print();
  };

  // 2. Centralized Multi-Page PDF Generation with Universal Watermark Stamper
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: orientation === 'portrait' ? 'p' : 'l',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 20;

    // Header generator helper
    const drawPdfHeader = (isFirstPage: boolean) => {
      // Small logo in header
      try {
        doc.addImage(OFFICIAL_LOGO_BASE64, 'JPEG', margin, y - 6, 14, 14);
      } catch (e) {
        console.warn('Header logo embed:', e);
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("FAHAD'S TUTORIAL – SSP MANAGEMENT SYSTEM", margin + 17, y);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text((reportTitles[reportType] || 'Official SSP Management Report').toUpperCase(), margin + 17, y + 5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Period: ${selectedMonth}  |  Generated: ${new Date().toLocaleString()}  |  By: ${user?.full_name || 'Ananya Rahman (Head of SSP)'}`,
        margin + 17,
        y + 10
      );

      // Dividing line
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 14, pageWidth - margin, y + 14);

      y += 22;
    };

    drawPdfHeader(true);

    // Render report specific content
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    const checkPageBreak = (neededMm: number = 10) => {
      if (y + neededMm > pageHeight - 20) {
        doc.addPage();
        y = 20;
        drawPdfHeader(false);
      }
    };

    // Helper row drawer
    const drawRow = (cols: { text: string; width: number; align?: 'left' | 'right' }[], isHeader = false) => {
      checkPageBreak(8);
      let curX = margin;
      if (isHeader) {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
      }

      cols.forEach(col => {
        const textStr = String(col.text || '—');
        if (col.align === 'right') {
          doc.text(textStr, curX + col.width - 2, y, { align: 'right' });
        } else {
          doc.text(textStr.substring(0, Math.floor(col.width / 2.2)), curX + 2, y);
        }
        curX += col.width;
      });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 6.5;
    };

    // Data tables depending on reportType
    if (reportType === 'monthly_full' || reportType === 'attendance') {
      doc.setFont('helvetica', 'bold');
      doc.text('SHIFT ATTENDANCE & WORKING HOURS', margin, y);
      y += 6;
      drawRow([
        { text: 'Date', width: 25 },
        { text: 'Staff ID', width: 25 },
        { text: 'Shift', width: 25 },
        { text: 'Check-In', width: 22 },
        { text: 'Check-Out', width: 22 },
        { text: 'Hours', width: 20, align: 'right' },
        { text: 'Status', width: 25 },
      ], true);

      attendance.forEach(a => {
        drawRow([
          { text: a.date, width: 25 },
          { text: a.employee_id, width: 25 },
          { text: a.shift_name, width: 25 },
          { text: a.check_in || '—', width: 22 },
          { text: a.check_out || '—', width: 22 },
          { text: `${a.working_hours}h`, width: 20, align: 'right' },
          { text: a.status, width: 25 },
        ]);
      });
      y += 6;
    }

    if (reportType === 'monthly_full' || reportType === 'meal_collection') {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.text('DINING & MEAL COLLECTIONS LEDGER', margin, y);
      y += 6;
      drawRow([
        { text: 'Employee ID', width: 35 },
        { text: 'Payable', width: 30, align: 'right' },
        { text: 'Paid', width: 30, align: 'right' },
        { text: 'Outstanding', width: 30, align: 'right' },
        { text: 'Method', width: 25 },
        { text: 'Status', width: 25 },
      ], true);

      collections.forEach(c => {
        drawRow([
          { text: c.employee_id, width: 35 },
          { text: `${c.total_payable} TK`, width: 30, align: 'right' },
          { text: `${c.amount_paid} TK`, width: 30, align: 'right' },
          { text: `${c.outstanding_amount} TK`, width: 30, align: 'right' },
          { text: c.payment_method || '—', width: 25 },
          { text: c.payment_status, width: 25 },
        ]);
      });
      y += 6;
    }

    if (reportType === 'monthly_full' || reportType === 'bazar') {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.text('BAZAR & OPERATING CASH TRANSACTIONS', margin, y);
      y += 6;
      drawRow([
        { text: 'Date', width: 25 },
        { text: 'Category', width: 30 },
        { text: 'Description', width: 45 },
        { text: 'Received', width: 25, align: 'right' },
        { text: 'Spent', width: 25, align: 'right' },
        { text: 'Returned', width: 25, align: 'right' },
      ], true);

      bazar.forEach(b => {
        drawRow([
          { text: b.date, width: 25 },
          { text: b.category, width: 30 },
          { text: b.description, width: 45 },
          { text: `${b.amount_received + b.extra_funds}`, width: 25, align: 'right' },
          { text: `${b.amount_spent}`, width: 25, align: 'right' },
          { text: `${b.returned_amount}`, width: 25, align: 'right' },
        ]);
      });
      y += 6;
    }

    if (reportType === 'employees') {
      drawRow([
        { text: 'ID', width: 25 },
        { text: 'Name', width: 40 },
        { text: 'Position', width: 35 },
        { text: 'Contact Phone', width: 35 },
        { text: 'Default Shift', width: 25 },
        { text: 'Status', width: 20 },
      ], true);
      employees.forEach(e => {
        drawRow([
          { text: e.employee_id, width: 25 },
          { text: e.name, width: 40 },
          { text: e.position, width: 35 },
          { text: e.phone || '—', width: 35 },
          { text: e.default_shift || 'Day', width: 25 },
          { text: e.status, width: 20 },
        ]);
      });
    }

    if (reportType === 'leave') {
      drawRow([
        { text: 'Staff ID', width: 30 },
        { text: 'Leave Type', width: 35 },
        { text: 'Duration', width: 45 },
        { text: 'Days', width: 20, align: 'right' },
        { text: 'Status', width: 25 },
        { text: 'Decision By', width: 30 },
      ], true);
      leaves.forEach(l => {
        drawRow([
          { text: l.employee_id, width: 30 },
          { text: l.leave_type, width: 35 },
          { text: `${l.start_date} -> ${l.end_date}`, width: 45 },
          { text: `${l.days_count}`, width: 20, align: 'right' },
          { text: l.status, width: 25 },
          { text: l.decision_by || '—', width: 30 },
        ]);
      });
    }

    // Add page numbers on each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Fahads Tutorial – SSP Official Report  |  Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    // UNIVERSAL WATERMARK STAMPER:
    // Applies the official logo watermark to EVERY page of the PDF!
    if (watermarkEnabled) {
      applyPdfWatermark(doc, { opacity: watermarkOpacity });
    }

    doc.save(`Fahads_Tutorial_${reportType}_${selectedMonth}.pdf`);
  };

  // 3. Multi-Sheet Excel Export (XLSX)
  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();

    if (reportType === 'attendance' || reportType === 'monthly_full') {
      const data = attendance.map(a => ({
        Date: a.date,
        Employee_ID: a.employee_id,
        Shift: a.shift_name,
        Check_In: a.check_in || '',
        Check_Out: a.check_out || '',
        Hours_Worked: a.working_hours,
        Late_Minutes: a.late_duration,
        Status: a.status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    }

    if (reportType === 'meal_collection' || reportType === 'monthly_full') {
      const data = collections.map(c => ({
        Month: c.month,
        Employee_ID: c.employee_id,
        Payable_TK: c.total_payable,
        Paid_TK: c.amount_paid,
        Outstanding_TK: c.outstanding_amount,
        Method: c.payment_method || '',
        Status: c.payment_status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Meal_Collections');
    }

    if (reportType === 'bazar' || reportType === 'monthly_full') {
      const data = bazar.map(b => ({
        Date: b.date,
        Category: b.category,
        Description: b.description,
        Received_TK: b.amount_received + b.extra_funds,
        Spent_TK: b.amount_spent,
        Returned_TK: b.returned_amount,
        Provider: b.provider,
        Recorded_By: b.recorded_by,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Bazar_Expenses');
    }

    if (reportType === 'employees' || reportType === 'monthly_full') {
      const data = employees.map(e => ({
        Employee_ID: e.employee_id,
        Name: e.name,
        Position: e.position,
        Phone: e.phone,
        Email: e.email,
        Joining_Date: e.joining_date,
        Default_Shift: e.default_shift,
        Status: e.status,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    }

    XLSX.writeFile(wb, `Fahads_Tutorial_${reportType}_${selectedMonth}.xlsx`);
  };

  const bSummary = calculateBazarSummary(bazar);
  const totalWorked = attendance.reduce((s, a) => s + (a.working_hours || 0), 0);
  const totalDue = collections.reduce((s, c) => s + (c.outstanding_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* On-Screen Configuration & Actions Bar */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileBarChart className="text-rose-600" size={20} /> Centralized Reports & Multi-Page Export Center
            </h2>
            <p className="text-xs text-slate-500">
              Generate official A4 printouts and multi-page PDFs with authentic Fahad's Tutorial watermark on every page
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer size={15} /> Print Report (All Pages)
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download size={15} /> Export Multi-Page PDF
            </button>
            <button
              onClick={handleExportXLSX}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <FileSpreadsheet size={15} /> Export Excel (XLSX)
            </button>
          </div>
        </div>

        {/* Filters & Watermark Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Select Report Module
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as MasterReportType)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
              >
                <option value="monthly_full">Full SSP Monthly Executive Report</option>
                <option value="attendance">Staff Attendance & Hours</option>
                <option value="employees">Employee Staff Directory</option>
                <option value="roster">Weekly Shift Scheduling & Roster</option>
                <option value="leave">Leave Applications & Approvals</option>
                <option value="overtime">Overtime Hours & Rates (1.5x)</option>
                <option value="backup">Standby Backup Duty Hours</option>
                <option value="meals">Daily Dining & Meals (72 TK)</option>
                <option value="meal_collection">Meal Collections & Dues</option>
                <option value="bazar">Bazar & Operating Cash Ledger</option>
                <option value="operations">Daily Operations & Shift Handover</option>
                <option value="incidents">Incidents & Escalations</option>
                <option value="monthly_closing">Monthly Closing & Period Lock</option>
                <option value="audit">System Security Audit Trail</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Reporting Period
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Print Orientation
              </label>
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`px-2 py-0.5 text-xs rounded-md font-medium transition ${
                    orientation === 'portrait' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`px-2 py-0.5 text-xs rounded-md font-medium transition ${
                    orientation === 'landscape' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wmEnable"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="wmEnable" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Watermark Enabled
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">Opacity:</span>
              <input
                type="range"
                min="0.02"
                max="0.18"
                step="0.01"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                className="w-20 accent-rose-600"
              />
              <span className="text-xs font-mono text-slate-500">
                {Math.round(watermarkOpacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Canvas (A4 Standard Container) */}
      <div
        className={`relative mx-auto bg-white text-slate-900 p-8 sm:p-12 shadow-xl border border-slate-200 rounded-2xl overflow-hidden print:m-0 print:p-0 print:shadow-none print:border-none print:rounded-none ${
          orientation === 'portrait' ? 'max-w-4xl min-h-[1050px]' : 'max-w-6xl min-h-[750px]'
        }`}
      >
        {/* Centralized Official Watermark Component (Screen + Multi-Page Fixed Print) */}
        {watermarkEnabled && <ReportWatermark opacity={watermarkOpacity} />}

        {/* Standardized Report Header with Official Logo */}
        <ReportHeader
          title={reportTitles[reportType]}
          period={selectedMonth}
          generatedBy={user?.full_name || 'Ananya Rahman (Head of SSP)'}
        />

        {/* Dynamic Report Content Body */}
        <div className="relative z-10 space-y-6">
          {/* Executive KPI summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs print-avoid-break">
            <div>
              <span className="text-slate-500 font-medium">Active Staff</span>
              <p className="text-base font-bold text-slate-900">{employees.length} Personnel</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Total Worked Hours</span>
              <p className="text-base font-bold text-slate-900">{totalWorked.toFixed(1)} hrs</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Dining Outstanding Due</span>
              <p className="text-base font-bold text-rose-600">{totalDue} TK</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Bazar Net Balance</span>
              <p className="text-base font-bold text-emerald-600">{bSummary.currentBalance} TK</p>
            </div>
          </div>

          {/* Table Content based on active reportType */}
          {(reportType === 'monthly_full' || reportType === 'attendance') && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                Shift Attendance & Working Hours
              </h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Staff ID</th>
                    <th className="py-2 px-2">Shift</th>
                    <th className="py-2 px-2">Check-In</th>
                    <th className="py-2 px-2">Check-Out</th>
                    <th className="py-2 px-2 text-right">Hours</th>
                    <th className="py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendance.map((a) => (
                    <tr key={a.id} className="print-avoid-break">
                      <td className="py-1.5 px-2 font-mono">{a.date}</td>
                      <td className="py-1.5 px-2 font-medium">{a.employee_id}</td>
                      <td className="py-1.5 px-2">{a.shift_name}</td>
                      <td className="py-1.5 px-2 font-mono">{a.check_in || '—'}</td>
                      <td className="py-1.5 px-2 font-mono">{a.check_out || '—'}</td>
                      <td className="py-1.5 px-2 text-right font-bold">{a.working_hours}h</td>
                      <td className="py-1.5 px-2 font-semibold">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(reportType === 'monthly_full' || reportType === 'meal_collection') && (
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                Meal Collections & Outstanding Accounts
              </h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-2">Staff ID</th>
                    <th className="py-2 px-2 text-right">Payable (TK)</th>
                    <th className="py-2 px-2 text-right">Paid (TK)</th>
                    <th className="py-2 px-2 text-right">Outstanding (TK)</th>
                    <th className="py-2 px-2">Method</th>
                    <th className="py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {collections.map((c) => (
                    <tr key={c.id} className="print-avoid-break">
                      <td className="py-1.5 px-2 font-medium">{c.employee_id}</td>
                      <td className="py-1.5 px-2 text-right">{c.total_payable} TK</td>
                      <td className="py-1.5 px-2 text-right text-emerald-700">{c.amount_paid} TK</td>
                      <td className="py-1.5 px-2 text-right font-bold text-rose-700">{c.outstanding_amount} TK</td>
                      <td className="py-1.5 px-2">{c.payment_method || '—'}</td>
                      <td className="py-1.5 px-2 font-semibold">{c.payment_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(reportType === 'monthly_full' || reportType === 'bazar') && (
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                Daily Bazar & Operating Cash Accounts
              </h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2">Description</th>
                    <th className="py-2 px-2 text-right">Received</th>
                    <th className="py-2 px-2 text-right">Spent</th>
                    <th className="py-2 px-2 text-right">Returned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bazar.map((b) => (
                    <tr key={b.id} className="print-avoid-break">
                      <td className="py-1.5 px-2 font-mono">{b.date}</td>
                      <td className="py-1.5 px-2 font-medium">{b.category}</td>
                      <td className="py-1.5 px-2">{b.description}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-700">{b.amount_received + b.extra_funds}</td>
                      <td className="py-1.5 px-2 text-right font-bold text-rose-700">{b.amount_spent}</td>
                      <td className="py-1.5 px-2 text-right text-blue-700">{b.returned_amount || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'employees' && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                Official Employee Directory
              </h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-2">Employee ID</th>
                    <th className="py-2 px-2">Name</th>
                    <th className="py-2 px-2">Position</th>
                    <th className="py-2 px-2">Contact</th>
                    <th className="py-2 px-2">Default Shift</th>
                    <th className="py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {employees.map((e) => (
                    <tr key={e.id} className="print-avoid-break">
                      <td className="py-1.5 px-2 font-mono font-bold">{e.employee_id}</td>
                      <td className="py-1.5 px-2 font-semibold">{e.name}</td>
                      <td className="py-1.5 px-2">{e.position}</td>
                      <td className="py-1.5 px-2">{e.phone || e.email || '—'}</td>
                      <td className="py-1.5 px-2">{e.default_shift || 'Day'}</td>
                      <td className="py-1.5 px-2 font-semibold">{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'leave' && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1">
                Leave Requests & Approval Log
              </h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-semibold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-2">Staff ID</th>
                    <th className="py-2 px-2">Leave Type</th>
                    <th className="py-2 px-2">Window</th>
                    <th className="py-2 px-2 text-right">Days</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Decision By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {leaves.map((l) => (
                    <tr key={l.id} className="print-avoid-break">
                      <td className="py-1.5 px-2 font-mono">{l.employee_id}</td>
                      <td className="py-1.5 px-2 font-semibold">{l.leave_type}</td>
                      <td className="py-1.5 px-2">{l.start_date} → {l.end_date}</td>
                      <td className="py-1.5 px-2 text-right font-bold">{l.days_count}</td>
                      <td className="py-1.5 px-2 font-semibold">{l.status}</td>
                      <td className="py-1.5 px-2">{l.decision_by || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Verification Sign-Off Footer */}
          <div className="pt-10 mt-10 border-t-2 border-slate-300 flex items-end justify-between text-xs print-avoid-break">
            <div>
              <p className="text-[10px] text-slate-500 font-semibold">
                FAHAD'S TUTORIAL • INFINITY IS THE LIMIT
              </p>
              <p className="text-[10px] text-slate-400">
                School of Digital Education • Mirpur, Dhaka-1216 • 01601929244
              </p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-48 border-b border-slate-900 pb-1 text-xs font-bold text-slate-900">
                Ananya Rahman
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Head of SSP / Student Support Team
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
