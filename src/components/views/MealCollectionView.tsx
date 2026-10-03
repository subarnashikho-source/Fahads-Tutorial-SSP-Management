import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  DollarSign,
  Download,
  X,
  Save,
} from 'lucide-react';
import {
  getMealCollections,
  recordMealPayment,
  getEmployees,
  updateMealCollectionForEmployee,
} from '../../lib/storage';
import { MealCollection, Employee, PaymentMethod } from '../../types/database';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { UniversalExportOptions } from '../../lib/exportEngine';

export const MealCollectionView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [collections, setCollections] = useState<MealCollection[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedCol, setSelectedCol] = useState<MealCollection | null>(null);

  // Payment Form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('bKash');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  async function loadData() {
    setLoading(true);
    try {
      const emps = await getEmployees();
      const activeEmps = emps.filter(e => e.status !== 'Archived');
      setEmployees(activeEmps);

      // Ensure every active employee has a calculated collection record for selected month
      for (const emp of activeEmps) {
        await updateMealCollectionForEmployee(emp.employee_id, selectedMonth);
      }

      const cols = await getMealCollections(selectedMonth);
      setCollections(cols);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenPay = (col: MealCollection) => {
    setSelectedCol(col);
    setPayAmount(col.outstanding_amount > 0 ? col.outstanding_amount : 0);
    setPayMethod('bKash');
    setPayNotes(`Meal fee payment for ${selectedMonth}`);
    setPayModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCol) return;

    await recordMealPayment(
      selectedCol.id,
      Number(payAmount),
      payMethod,
      payNotes
    );

    setPayModalOpen(false);
    loadData();
  };

  const totalCollectible = collections.reduce((s, c) => s + (c.total_payable || 0), 0);
  const totalCollected = collections.reduce((s, c) => s + (c.amount_paid || 0), 0);
  const totalOutstanding = collections.reduce((s, c) => s + (c.outstanding_amount || 0), 0);

  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Monthly Meal Collections & Dues Report',
    baseFilename: `Fahads-Tutorial-Meal-Collection-Report-${selectedMonth}`,
    period: selectedMonth,
    columns: [
      { header: 'Employee ID', key: 'employee_id', width: 22 },
      { header: 'Employee Name', key: 'name', width: 32 },
      { header: 'Total Meals', key: 'total_meals', width: 18, align: 'right' },
      { header: 'Total Payable (TK)', key: 'total_payable', width: 24, align: 'right' },
      { header: 'Paid Amount (TK)', key: 'amount_paid', width: 24, align: 'right' },
      { header: 'Outstanding (TK)', key: 'outstanding_amount', width: 24, align: 'right' },
      { header: 'Status', key: 'payment_status', width: 20 },
      { header: 'Payment Method', key: 'payment_method', width: 22 },
    ],
    data: collections.map(col => {
      const emp = employees.find(e => e.employee_id === col.employee_id || e.id === col.employee_id);
      return {
        employee_id: col.employee_id,
        name: emp?.name || col.employee_id,
        total_meals: Math.round(col.total_payable / 72) || 0,
        total_payable: `${col.total_payable} TK`,
        amount_paid: `${col.amount_paid} TK`,
        outstanding_amount: `${col.outstanding_amount} TK`,
        payment_status: col.payment_status,
        payment_method: col.payment_method || '—',
      };
    }),
    summaryCards: [
      { label: 'Total Collectible', value: `${totalCollectible} TK` },
      { label: 'Total Collected', value: `${totalCollected} TK` },
      { label: 'Total Outstanding', value: `${totalOutstanding} TK` },
      { label: 'Staff Count', value: collections.length },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Monthly Meal Collections & Dues Official Report"
          period={selectedMonth}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-rose-600" size={20} /> Meal Collections & Payment Accounts
          </h2>
          <p className="text-xs text-slate-500">
            Track monthly dining dues, bKash & Cash payments, and outstanding balances per employee
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
          />
        </div>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Meal Collection Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Collectible</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalCollectible} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-slate-400">Total billed for {selectedMonth}</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Collected</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {totalCollected} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Received via bKash / Cash</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Outstanding</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {totalOutstanding} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-rose-600 font-medium">
            {totalOutstanding > 0 ? 'Pending settlement' : 'All cleared'}
          </span>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4 text-right">Payable (TK)</th>
                <th className="py-3 px-4 text-right">Paid (TK)</th>
                <th className="py-3 px-4 text-right">Outstanding (TK)</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => {
                const col = collections.find(c => c.employee_id === emp.employee_id);
                const payable = col?.total_payable || 0;
                const paid = col?.amount_paid || 0;
                const outstanding = col?.outstanding_amount !== undefined ? col.outstanding_amount : payable;
                const status = col?.payment_status || (payable > 0 ? 'Due' : 'Paid');

                return (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{emp.employee_id} • {emp.position}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">{selectedMonth}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      {payable} TK
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      {paid} TK
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {outstanding} TK
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {col?.payment_method ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                          {col.payment_method}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : status === 'Partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {col && (
                        <button
                          onClick={() => handleOpenPay(col)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition shadow-2xs"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {payModalOpen && selectedCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Receive Meal Payment
              </h3>
              <button onClick={() => setPayModalOpen(false)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee ID: {selectedCol.employee_id}
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Billed:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCol.total_payable} TK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Previously Paid:</span>
                    <span className="font-semibold text-emerald-600">{selectedCol.amount_paid} TK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Outstanding:</span>
                    <span className="font-bold text-rose-600">{selectedCol.outstanding_amount} TK</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount Received (TK)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedCol.outstanding_amount || 10000}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="bKash">bKash</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Transaction Reference
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
