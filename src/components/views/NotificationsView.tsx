import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  X,
} from 'lucide-react';
import {
  getAnnouncements,
  saveAnnouncement,
  getLeaveRequests,
  getMealCollections,
  getBazarTransactions,
  calculateBazarSummary,
} from '../../lib/storage';
import { Announcement } from '../../types/database';
import { useAuth } from '../../context/AuthContext';

export const NotificationsView: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<{ title: string; desc: string; type: string; time: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('Normal');
  const [targetAudience, setTargetAudience] = useState<Announcement['target_audience']>('All');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [anns, leaves, collections, bazar] = await Promise.all([
      getAnnouncements(),
      getLeaveRequests(),
      getMealCollections(),
      getBazarTransactions(),
    ]);

    setAnnouncements(anns);

    // Build real-time automated system alerts
    const alerts: typeof systemAlerts = [];
    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    if (pendingLeaves.length > 0) {
      alerts.push({
        title: `${pendingLeaves.length} Pending Leave Requests`,
        desc: 'Review and approve staff time-off applications to update the duty roster.',
        type: 'warning',
        time: 'Action required',
      });
    }

    const dueMeals = collections.filter(c => c.payment_status === 'Due');
    if (dueMeals.length > 0) {
      alerts.push({
        title: `${dueMeals.length} Unsettled Meal Accounts`,
        desc: 'Staff members have outstanding dining balances due for settlement.',
        type: 'info',
        time: 'Billing notice',
      });
    }

    const bSummary = calculateBazarSummary(bazar);
    if (bSummary.currentBalance < 1000) {
      alerts.push({
        title: `Low Bazar Fund Balance (${bSummary.currentBalance} TK)`,
        desc: 'Cash in hand for grocery and shift refreshments is running low.',
        type: 'danger',
        time: 'Immediate attention',
      });
    }

    alerts.push({
      title: 'Cloud Database Persisted',
      desc: 'All attendance, meals, and roster changes are securely committed to storage.',
      type: 'success',
      time: 'Just now',
    });

    setSystemAlerts(alerts);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAnnouncement(
      {
        title,
        content,
        priority,
        target_audience: targetAudience,
      },
      user?.full_name || 'Ananya Rahman (Head of SSP)'
    );

    setModalOpen(false);
    setTitle('');
    setContent('');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-rose-600" size={20} /> Notifications & Team Announcements
          </h2>
          <p className="text-xs text-slate-500">
            Publish operational notices, meeting schedules, training reminders, and monitor automatic alerts
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Plus size={15} /> Create Announcement
        </button>
      </div>

      {/* Grid: Announcements on Left, System Alerts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Announcements */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone size={16} className="text-rose-600" /> Active Team Announcements
          </h3>

          <div className="space-y-3">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {ann.title}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          ann.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : ann.priority === 'Important'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ann.priority}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ann.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <span>Target: {ann.target_audience}</span>
                    <span>Posted by {ann.created_by}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                No announcements published yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: System Automated Alerts */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> Operational System Alerts
          </h3>

          <div className="space-y-2.5">
            {systemAlerts.map((alt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{alt.title}</span>
                  <span className="text-[10px] text-slate-400">{alt.time}</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-tight">{alt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Create Team Announcement
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Monthly Closing Meeting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="All">All Staff</option>
                    <option value="SSP Team">SSP Executives Only</option>
                    <option value="Shift In-Charge">Shift Leads</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Details
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide instructions, timings, or agenda..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
