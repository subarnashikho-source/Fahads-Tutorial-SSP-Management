import React from 'react';
import {
  HelpCircle,
  BookOpen,
  CalendarCheck,
  Utensils,
  ShoppingBag,
  PlaneTakeoff,
  Lock,
  FileBarChart,
  Users,
  ShieldCheck,
} from 'lucide-react';

export const HelpCenterView: React.FC = () => {
  const guides = [
    {
      title: '1. Adding New Employees & Generating SSP IDs',
      icon: Users,
      desc: 'Navigate to Employees → "+ Add Employee". The system automatically provisions IDs in sequence (SSP-001, SSP-002, etc.). Specify default shifts (Morning, Day, Evening, Night) and emergency contacts. You can generate official Digital ID Cards with QR identification directly.',
    },
    {
      title: '2. Weekly Roster Scheduling (Saturday → Friday)',
      icon: CalendarCheck,
      desc: 'The weekly roster follows the official educational cycle from Saturday to Friday. Standard shifts are: Morning (07:00–15:30), Day (10:00–18:30), Evening (15:00–23:30), and Night (23:00–07:30). Use the "Copy to Next Week" button to duplicate existing rotation patterns.',
    },
    {
      title: '3. Marking Attendance & Late Tracking',
      icon: CalendarCheck,
      desc: 'Check-in and check-out times determine working hours using the formula: Working Hours = Checkout - Check-in - Break. Late duration is calculated beyond the 10-minute grace period. Any manual corrections require an official reason and are permanently preserved in the immutable Audit Log.',
    },
    {
      title: '4. Leave Approvals & Cross-Module Synchronization',
      icon: PlaneTakeoff,
      desc: 'When the Head of SSP approves a leave request, the system automatically synchronizes the change across the Dashboard, Attendance roster (status tagged as "Leave"), Master Calendar, and Reports. If the current date falls within the leave window, employee status automatically updates to "On Leave".',
    },
    {
      title: '5. Daily Meals & 72 TK Pricing Rule',
      icon: Utensils,
      desc: 'The daily dining system tracks Breakfast (20 TK), Lunch (35 TK), and Dinner (17 TK). Selecting all three meals automatically defaults to 72 TK/person/day. Every meal entry automatically updates the employee monthly collection balance and outstanding accounts.',
    },
    {
      title: '6. Meal Collections & bKash / Cash Tracking',
      icon: Utensils,
      desc: 'Under Meal Collection, outstanding dues are calculated as: Outstanding = Total Payable - Amount Paid. When employees pay via bKash or Cash, record the payment with transaction reference. Status updates automatically from Due → Partial → Paid.',
    },
    {
      title: '7. Bazar & Operating Expenses Accounting',
      icon: ShoppingBag,
      desc: 'Every grocery and shift expense is tracked with the formula: Net Balance = Received + Extra Funds - Spent - Returned. Track funding sources (HR Funding, Accounts Advance). Balance is updated live to prevent cash flow deficits.',
    },
    {
      title: '8. Centralized Reports & High-Resolution Logo Watermark',
      icon: FileBarChart,
      desc: 'The Reports Center allows exporting Attendance, Roster, Meals, Collections, and Full Monthly reports in A4 Portrait & Landscape. Every report features the official Fahads Tutorial logo header and an authentic grayscale logo watermark behind table content without distortion. Export directly to PDF or Excel (XLSX).',
    },
    {
      title: '9. Monthly Closing & Period Lock',
      icon: Lock,
      desc: 'At the end of each month, the Head of SSP executes "Close & Lock Month". This summarizes all hours, dining bills, and bazar expenses, and locks the period against retroactive modification. Only the Super Admin can unlock a historical period, and every unlock action is audited.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="text-rose-600" size={20} /> System Operational Documentation & Guides
        </h2>
        <p className="text-xs text-slate-500">
          Standard operating procedures and management guidelines for the Fahads Tutorial SSP command center
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((g, idx) => {
          const Icon = g.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 hover:border-rose-400 transition"
            >
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                <Icon size={16} />
                <span>{g.title}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {g.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
