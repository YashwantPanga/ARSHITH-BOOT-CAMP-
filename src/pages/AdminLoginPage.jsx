import React, { useState } from 'react';
import { ShieldCheck, Lock, UserCheck, Key, AlertCircle, ArrowRight, Sparkles, CheckSquare } from 'lucide-react';
import { api } from '../services/api';

export default function AdminLoginPage({ onLoginSuccess, onGoHome }) {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminId.trim() || !password.trim()) {
      setErrorMessage('Please enter both Admin ID and Password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.adminLogin(adminId.trim(), password, remember);
      if (res.success && res.admin) {
        onLoginSuccess(res.admin);
      } else {
        setErrorMessage(res.message || 'Invalid Admin ID or Password');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid Admin ID or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFDFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">

        {/* Shield Icon Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-900 border-2 border-brand-800 text-emerald-400 shadow-lg shadow-brand-900/20 mb-2">
          <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
        </div>

        <h1 className="text-3xl font-black text-brand-950 tracking-tight flex items-center justify-center gap-2">
          <span>Arshith</span>
          <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent font-black">Bootcamp</span>
        </h1>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-600 inline" />
          Secure Admin Portal Management System
        </p>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl dark-bezel shadow-xl space-y-6">

          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Administrator Sign In</h2>
              <p className="text-xs font-semibold text-slate-500">Authorized personnel access only</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full border border-emerald-200 uppercase">
              256-Bit Encrypted
            </span>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-rose-900">Authentication Failed</p>
                <p className="text-rose-700 font-medium mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Admin ID */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. ARB-ADMIN-001"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-2 border-slate-200 focus:border-brand-900 rounded-2xl outline-none transition-all"
                />
                <UserCheck className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-2 border-slate-200 focus:border-brand-900 rounded-2xl outline-none transition-all"
                />
                <Key className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Remember device option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 font-extrabold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-slate-400 text-[11px] font-semibold">Session: 24 Hours</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 text-sm font-black text-white bg-brand-900 hover:bg-brand-800 active:scale-[0.99] rounded-2xl border-2 border-brand-800 shadow-md shadow-brand-900/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4.5 h-4.5 text-emerald-400" />
                  <span>Secure Admin Login</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
                </>
              )}
            </button>

          </form>

          {/* Demo Admin Credentials Helper Card */}
          <div className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200 text-xs text-brand-900 space-y-1">
            <p className="font-extrabold flex items-center gap-1 text-brand-800">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Default Administrator Credentials</span>
            </p>
            <div className="font-mono text-[11px] text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5">
              <span>Admin ID: <strong className="text-brand-900 font-bold">ARB-ADMIN-001</strong></span>
              <span>Password: <strong className="text-brand-900 font-bold">admin123</strong></span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            <button
              onClick={onGoHome}
              className="font-bold text-brand-700 hover:underline cursor-pointer"
            >
              ← Return to Student Website
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
