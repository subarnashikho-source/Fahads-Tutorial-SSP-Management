import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Mail,
  ShieldCheck,
  Building,
  Briefcase,
  Phone,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  Key,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isLiveSupabaseConfigured } from '../../lib/supabase';
import { safeInitial } from '../../lib/safeStrings';

export const ProfileView: React.FC = () => {
  const { user, role, updatePassword, updateProfile, signOut, refreshProfile } = useAuth();
  
  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || 'Ananya Rahman');
  const [designation, setDesignation] = useState(user?.designation || 'Head of Student Support Team');
  const [department, setDepartment] = useState(user?.department || 'Student Support Team');
  const [phone, setPhone] = useState(user?.phone || '01711002233');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const isLive = isLiveSupabaseConfigured();

  // Sync form inputs when user state updates
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || 'Ananya Rahman');
      setDesignation(user.designation || 'Head of Student Support Team');
      setDepartment(user.department || 'Student Support Team');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      const res = await updateProfile({
        full_name: fullName.trim(),
        designation: designation.trim(),
        department: department.trim(),
        phone: phone.trim(),
      });

      if (res.success) {
        setProfileMsg({ text: 'Profile information updated and synced successfully.', isError: false });
      } else {
        setProfileMsg({ text: res.message, isError: true });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters long.', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setPasswordMsg({ text: res.message, isError: false });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ text: res.message, isError: true });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCircle className="text-rose-600" size={20} /> My Profile & Account Credentials
          </h2>
          <p className="text-xs text-slate-500">
            Official executive credentials, team designations, and authentication security
          </p>
        </div>

        <button
          onClick={() => refreshProfile()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw size={13} /> Refresh Data
        </button>
      </div>

      {/* Main Profile Summary Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white dark:border-slate-800 shrink-0">
            {safeInitial(user?.full_name, 'A')}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {user?.full_name || 'Ananya Rahman'}
            </h3>
            
            <p className="text-xs text-rose-600 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <Briefcase size={13} />
              <span>{user?.designation || 'Head of Student Support Team'}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Building size={13} /> {user?.department || 'Student Support Team'}
              </span>
              <span className="flex items-center gap-1">
                <Mail size={13} /> {user?.email || 'rahman.ononnaa@gmail.com'}
              </span>
              {user?.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} /> {user.phone}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                <ShieldCheck size={12} /> {role || 'Super Admin'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {isLive ? 'Supabase Database Linked' : 'Persistent Storage Active'}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-semibold rounded-lg transition"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information Edit Form */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} className="text-rose-600" /> Edit Personal Information
          </h3>
          <p className="text-xs text-slate-500">
            Changes are saved to the profile database and synced across official SSP reports.
          </p>

          {profileMsg && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                profileMsg.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
              }`}
            >
              {profileMsg.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ananya Rahman"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation / Title
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Head of Student Support Team"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Student Support Team"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01711xxxxxx"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Email <span className="text-slate-400 font-normal">(Primary Identifier)</span>
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'rahman.ononnaa@gmail.com'}
                className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} /> {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Change Box */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Key size={16} className="text-rose-600" /> Update Account Password
          </h3>
          <p className="text-xs text-slate-500">
            Protect your account credentials with a strong, mixed-character password.
          </p>

          {passwordMsg && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                passwordMsg.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
              }`}
            >
              {passwordMsg.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} /> {savingPassword ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
