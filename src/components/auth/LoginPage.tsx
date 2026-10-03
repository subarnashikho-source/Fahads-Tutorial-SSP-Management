import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { signIn, signUp, resetPassword, isLiveSupabase } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmationPending, setConfirmationPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setConfirmationPending(false);

    // Case-insensitive Gmail validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Email address is required.');
      return;
    }

    if (!cleanEmail.endsWith('@gmail.com') || !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(cleanEmail)) {
      setErrorMsg('Please use a valid Gmail address ending with @gmail.com.');
      return;
    }

    if (mode === 'forgot') {
      if (password && password !== confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }
    } else {
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signIn(cleanEmail, password);
        if (!res.success) {
          setErrorMsg(res.message);
        } else {
          setSuccessMsg(res.message);
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }
      } else if (mode === 'register') {
        const res = await signUp(cleanEmail, password, fullName);
        if (!res.success) {
          setErrorMsg(res.message);
        } else {
          setSuccessMsg(res.message);
          if (res.needsEmailConfirmation) {
            setConfirmationPending(true);
          } else {
            if (onLoginSuccess) {
              setTimeout(() => {
                onLoginSuccess();
              }, 600);
            }
          }
        }
      } else if (mode === 'forgot') {
        const res = await resetPassword(cleanEmail, password || undefined);
        if (!res.success) {
          setErrorMsg(res.message);
        } else {
          setSuccessMsg(res.message);
          setTimeout(() => {
            setMode('login');
            setPassword('');
            setConfirmPassword('');
          }, 1500);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Authentication issue: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="p-8 pb-6 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 flex flex-col items-center text-center">
          <BrandLogo size="lg" inverted showSubtitle={false} className="mb-3" />
          <h1 className="text-xl font-black text-white tracking-tight uppercase">
            Fahad's Tutorial
          </h1>
          <p className="text-xs font-bold text-rose-500 tracking-wider mt-0.5 uppercase">
            SSP Management System
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            {mode === 'login' && 'Sign in to access your SSP dashboard and operations'}
            {mode === 'register' && 'Create your official SSP executive account'}
            {mode === 'forgot' && 'Reset your password to regain system access'}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              mode === 'login'
                ? 'border-rose-600 text-rose-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              mode === 'register'
                ? 'border-rose-600 text-rose-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              mode === 'forgot'
                ? 'border-rose-600 text-rose-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">Authentication Error</p>
                <p className="mt-0.5 text-rose-200">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-bold">{confirmationPending ? 'Action Required' : 'Success'}</p>
                <p className="mt-0.5 text-emerald-200">{successMsg}</p>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setErrorMsg('');
                try {
                  const res = await signIn('rahman.ononnaa@gmail.com', 'ananya.admin@2026#Safe');
                  if (res.success && onLoginSuccess) {
                    onLoginSuccess();
                  } else if (!res.success) {
                    setErrorMsg(res.message);
                  }
                } catch (e: unknown) {
                  const msg = e instanceof Error ? e.message : String(e);
                  setErrorMsg(msg);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full mb-4 py-2.5 px-3 bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-700/60 hover:border-rose-500 rounded-xl text-xs font-semibold text-rose-300 hover:text-white flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck size={15} className="text-rose-500" />
              <span>1-Click Sign In as Ananya Rahman (Head of SSP)</span>
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Registration only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Gmail Address <span className="text-rose-500 font-normal">(@gmail.com only)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('rahman.ononnaa@gmail.com');
                    setPassword('ananya.admin@2026#Safe');
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  title="Fill authorized admin credentials"
                >
                  Fill Admin Credentials
                </button>
              </div>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 transition font-mono"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {mode === 'forgot' ? 'New Password (Optional to set directly)' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={mode !== 'forgot'}
                  placeholder={mode === 'forgot' ? 'Enter new password if setting directly' : '••••••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 transition font-mono"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Forgot / Reset Mode) */}
            {mode === 'forgot' && password.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 transition font-mono"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide uppercase shadow-lg shadow-rose-900/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In to Dashboard'}
                    {mode === 'register' && 'Create Account & Access'}
                    {mode === 'forgot' && (password ? 'Update Password & Access' : 'Send Reset Link')}
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Security & System Info Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Supabase Auth Protected</span>
            </span>
            <span>Mirpur, Dhaka</span>
          </div>
        </div>
      </div>
    </div>
  );
};
