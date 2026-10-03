import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  Download,
  AlertTriangle,
  X,
  Save,
} from 'lucide-react';
import {
  getBazarTransactions,
  saveBazarTransaction,
  calculateBazarSummary,
} from '../../lib/storage';
import { BazarTransaction } from '../../types/database';
import { ReportWatermark, ReportHeader } from '../common/ReportWatermark';
import { UniversalExportActions } from '../common/UniversalExportActions';
import { UniversalExportOptions } from '../../lib/exportEngine';

export const BazarExpensesView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [transactions, setTransactions] = useState<BazarTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Daily Bazar');
  const [description, setDescription] = useState('');
  const [amountReceived, setAmountReceived] = useState(0);
  const [extraFunds, setExtraFunds] = useState(0);
  const [amountSpent, setAmountSpent] = useState(0);
  const [returnedAmount, setReturnedAmount] = useState(0);
  const [provider, setProvider] = useState('HR Funding');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [selectedMonth]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const data = await getBazarTransactions(selectedMonth);
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBazarTransaction({
      date,
      category,
      description,
      amount_received: Number(amountReceived),
      extra_funds: Number(extraFunds),
      amount_spent: Number(amountSpent),
      returned_amount: Number(returnedAmount),
      provider,
      notes,
    });

    setModalOpen(false);
    // Reset form
    setDescription('');
    setAmountReceived(0);
    setExtraFunds(0);
    setAmountSpent(0);
    setReturnedAmount(0);
    setNotes('');
    loadTransactions();
  };

  const summary = calculateBazarSummary(transactions);

  const exportOptions: UniversalExportOptions = {
    reportTitle: 'Bazar & Operating Expenses Report',
    baseFilename: `Fahads-Tutorial-Bazar-Expenses-Report-${selectedMonth}`,
    period: selectedMonth,
    columns: [
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Description', key: 'description', width: 38 },
      { header: 'Received (TK)', key: 'amount_received', width: 22, align: 'right' },
      { header: 'Extra Funds (TK)', key: 'extra_funds', width: 22, align: 'right' },
      { header: 'Spent (TK)', key: 'amount_spent', width: 22, align: 'right' },
      { header: 'Returned (TK)', key: 'returned_amount', width: 22, align: 'right' },
      { header: 'Purchaser / Provider', key: 'provider', width: 28 },
    ],
    data: transactions.map(t => ({
      date: t.date,
      category: t.category,
      description: t.description,
      amount_received: t.amount_received ? `${t.amount_received} TK` : '—',
      extra_funds: t.extra_funds ? `${t.extra_funds} TK` : '—',
      amount_spent: t.amount_spent ? `${t.amount_spent} TK` : '—',
      returned_amount: t.returned_amount ? `${t.returned_amount} TK` : '—',
      provider: t.provider || '—',
    })),
    summaryCards: [
      { label: 'Total Received', value: `${summary.totalReceived} TK` },
      { label: 'Extra Funds', value: `${summary.totalExtra} TK` },
      { label: 'Total Spent', value: `${summary.totalSpent} TK` },
      { label: 'Net Balance', value: `${summary.currentBalance} TK` },
    ],
  };

  return (
    <div className="space-y-6 relative">
      {/* Repeating Multi-Page Print Watermark */}
      <ReportWatermark />

      {/* Print-Only Header */}
      <div className="hidden print:block">
        <ReportHeader
          title="Bazar & Operating Expenses Official Report"
          period={selectedMonth}
        />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="text-rose-600" size={20} /> Bazar & Operating Expenses
          </h2>
          <p className="text-xs text-slate-500">
            Formula: Balance = Received + Extra Funds − Spent − Returned. Live budget tracking for SSP team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold focus:outline-hidden"
          />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus size={15} /> Record Expense / Fund
          </button>
        </div>
      </div>

      {/* Universal Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Bazar & Expenses Report Actions:
        </span>
        <UniversalExportActions options={exportOptions} size="sm" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Funds Received</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {summary.totalReceived + summary.totalExtra} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-slate-400">HR / Accounts Funding</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Total Spent</span>
          <p className="text-xl font-bold text-rose-600 mt-1">
            {summary.totalSpent} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-slate-400">Grocery & shift supplies</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Returned to Accounts</span>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {summary.totalReturned} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-slate-400">Unspent surplus cash</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500">Current Net Balance</span>
          <p
            className={`text-xl font-bold mt-1 ${
              summary.currentBalance < 500 ? 'text-amber-600' : 'text-slate-900 dark:text-white'
            }`}
          >
            {summary.currentBalance} <span className="text-xs font-normal">TK</span>
          </p>
          <span className="text-[10px] text-slate-400">Available cash in hand</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Funding Source</th>
                <th className="py-3 px-4 text-right">Received (TK)</th>
                <th className="py-3 px-4 text-right">Spent (TK)</th>
                <th className="py-3 px-4 text-right">Returned (TK)</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-sm truncate">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{tx.provider}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      {tx.amount_received + tx.extra_funds > 0
                        ? `+${tx.amount_received + tx.extra_funds}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {tx.amount_spent > 0 ? `-${tx.amount_spent}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600">
                      {tx.returned_amount > 0 ? `${tx.returned_amount}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{tx.recorded_by}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-slate-500">
                    No transactions recorded for {selectedMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Record Bazar Transaction / Fund
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
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Daily Bazar">Daily Bazar</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Tech Support">Tech Support</option>
                    <option value="Refreshments">Refreshments</option>
                    <option value="HR Funding Inflow">HR Funding Inflow</option>
                    <option value="Other Operations">Other Operations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Item List
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rice, oil, eggs, and groceries for SSP shift lunch"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-600 mb-1">
                    Fund Received (TK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-rose-600 mb-1">
                    Amount Spent (TK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amountSpent}
                    onChange={(e) => setAmountSpent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-blue-600 mb-1">
                    Returned to Accounts (TK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={returnedAmount}
                    onChange={(e) => setReturnedAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="HR Funding">HR Funding</option>
                    <option value="Accounts Advance">Accounts Advance</option>
                    <option value="SSP Emergency Fund">SSP Emergency Fund</option>
                  </select>
                </div>
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
