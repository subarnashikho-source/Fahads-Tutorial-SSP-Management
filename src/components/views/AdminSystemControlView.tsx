import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Database,
  Building,
  Clock,
  Utensils,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import {
  getSystemSettings,
  saveSystemSettings,
  closeMonth,
  unlockMonth,
  getMonthlyClosings,
} from '../../lib/storage';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  isLiveSupabaseConfigured,
} from '../../lib/supabase';
import { SystemSettings, MonthlyClosing } from '../../types/database';

export const AdminSystemControlView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(getSystemSettings());
  const [closings, setClosings] = useState<MonthlyClosing[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Supabase Connection Settings
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [connTesting, setConnTesting] = useState(false);
  const [connResult, setConnResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    isLive: boolean;
  } | null>(null);

  // Monthly Closing Form
  const [closingMonth, setClosingMonth] = useState(new Date().toISOString().substring(0, 7));
  const [closeNotes, setCloseNotes] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSupabaseUrl(creds.url || '');
    setSupabaseKey(creds.key || '');
    loadClosings();
  }, []);

  async function loadClosings() {
    const data = await getMonthlyClosings();
    setClosings(data);
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSystemSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setConnTesting(true);
    setConnResult(null);
    try {
      // Save credentials first
      saveSupabaseCredentials(supabaseUrl, supabaseKey);
      const res = await testSupabaseConnection();
      setConnResult(res);
    } finally {
      setConnTesting(false);
    }
  };

  const handleCloseMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    await closeMonth(closingMonth, closeNotes);
    setCloseNotes('');
    loadClosings();
  };

  const handleUnlockMonth = async (month: string) => {
    if (!unlockReason) {
      alert('Please specify an official reason for unlocking the historical period.');
      return;
    }
    await unlockMonth(month, unlockReason);
    setUnlockingId(null);
    setUnlockReason('');
    loadClosings();
  };

  const isLive = isLiveSupabaseConfigured();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="text-rose-600" size={20} /> System Control & Administration
          </h2>
          <p className="text-xs text-slate-500">
            Configure company branding, meal pricing (72 TK), late thresholds, monthly closings, and Supabase cloud sync
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-300">
            <CheckCircle2 size={14} /> Settings Saved Successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Supabase Cloud Database Configuration */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database size={16} className="text-rose-600" /> Supabase Cloud Database Connection
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isLive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
              }`}
            >
              {isLive ? 'Cloud DB Active' : 'Persistent Storage Mode'}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Connects to your existing Supabase PostgreSQL database tables: profiles, employees, attendance, rosters, meals, bazar, etc.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={connTesting}
                onClick={handleTestConnection}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                {connTesting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Zap size={13} className="text-amber-400" />
                )}
                Test & Save Connection
              </button>
            </div>

            {connResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  connResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300'
                }`}
              >
                {connResult.success ? (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{connResult.message}</p>
                  {connResult.latencyMs !== undefined && (
                    <p className="text-[10px] opacity-80 mt-0.5">
                      Response Latency: {connResult.latencyMs} ms
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Monthly Closing & Lock Management */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock size={16} className="text-rose-600" /> Monthly Closing & Period Lock
          </h3>
          <p className="text-xs text-slate-500">
            Summarizes month-end attendance, OT, meals, and bazar. Locks historical records against further alteration.
          </p>

          <form onSubmit={handleCloseMonth} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Month
                </label>
                <input
                  type="month"
                  value={closingMonth}
                  onChange={(e) => setClosingMonth(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <Lock size={13} /> Close & Lock Month
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Closing Summary Notes
              </label>
              <input
                type="text"
                placeholder="Audit notes or end-of-month executive approval remarks..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </form>

          {/* Historical Closed Months */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Closed Periods:
            </span>
            {closings.length > 0 ? (
              <div className="space-y-2">
                {closings.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.month}: {c.is_locked ? 'Locked' : 'Unlocked'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Closed by {c.closed_by} on {new Date(c.closed_at).toLocaleDateString()}
                      </p>
                    </div>
                    {c.is_locked ? (
                      <button
                        onClick={() => setUnlockingId(c.month)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md"
                      >
                        Unlock
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-semibold text-[11px]">Active</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No monthly closings locked yet.</p>
            )}

            {unlockingId && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Unlocking Period: {unlockingId}
                </p>
                <input
                  type="text"
                  required
                  placeholder="Official reason for unlocking historical records..."
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-amber-300 rounded-md"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setUnlockingId(null)}
                    className="px-2 py-1 text-[11px] text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUnlockMonth(unlockingId)}
                    className="px-3 py-1 text-[11px] font-semibold text-white bg-amber-600 rounded-md shadow-xs"
                  >
                    Confirm Unlock
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Rules & Parameters Form */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building size={16} className="text-rose-600" /> Operational Rules & Pricing Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Head of SSP / Lead
            </label>
            <input
              type="text"
              value={settings.head_of_ssp}
              onChange={(e) => setSettings({ ...settings, head_of_ssp: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Late Threshold (Minutes)
            </label>
            <input
              type="number"
              value={settings.late_threshold_minutes}
              onChange={(e) => setSettings({ ...settings, late_threshold_minutes: Number(e.target.value) })}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>
        </div>

        {/* Meal Pricing Parameters */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
            <Utensils size={14} className="text-rose-600" /> Meal Price Structure (Default 72 TK)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Day Package (TK)
              </label>
              <input
                type="number"
                value={settings.default_daily_meal_price}
                onChange={(e) => setSettings({ ...settings, default_daily_meal_price: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-bold text-rose-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Breakfast (TK)
              </label>
              <input
                type="number"
                value={settings.breakfast_price}
                onChange={(e) => setSettings({ ...settings, breakfast_price: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lunch (TK)
              </label>
              <input
                type="number"
                value={settings.lunch_price}
                onChange={(e) => setSettings({ ...settings, lunch_price: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dinner (TK)
              </label>
              <input
                type="number"
                value={settings.dinner_price}
                onChange={(e) => setSettings({ ...settings, dinner_price: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Save size={14} /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
