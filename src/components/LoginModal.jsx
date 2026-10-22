import React, { useEffect, useState } from 'react';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Hash, Phone, KeyRound, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Triangles } from './ui';
import { readAccount } from '../utils/session';
import { api } from '../services/api';

/**
 * Full-page Login / Register screen (routes: /login and /register).
 * Accounts are stored in this browser; enrollment, quiz and exam results live on the server.
 */
export default function AuthPage({ mode = 'login', onSwitchMode, onBack, onHome, onSuccess, onNeedVerification, onForgotPassword }) {
  const isSignup = mode === 'signup';
  const [form, setForm] = useState({ name: '', regNo: '', phone: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setError(''); }, [mode]);

  const set = (key) => (e) => {
    const v = key === 'regNo' ? e.target.value.toUpperCase() : e.target.value;
    setForm(f => ({ ...f, [key]: v }));
    setError('');
  };

  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const email = form.email.trim().toLowerCase();
    const regNo = form.regNo.trim().toUpperCase();
    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address.');
    if (!regNo) return setError('Registration Number is required.');
    if (!form.password) return setError('Password is required.');

    if (isSignup) {
      if (name.length < 2) return setError('Please enter your full name.');
      if (phone.replace(/\D/g, '').length < 10) return setError('Please enter a valid phone number (at least 10 digits).');
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
    }

    setBusy(true);
    try {
      if (isSignup) {
        const res = await api.learnerRegister({ name, regNo, phone, email, password: form.password });
        // New accounts must verify their email before signing in.
        onNeedVerification(email, { code: res.devCode, status: res.emailStatus });
        return;
      }
      try {
        const res = await api.learnerLogin({ email, regNo, password: form.password });
        onSuccess({ ...res.learner, token: res.token });
      } catch (err) {
        // One-time migration for accounts created by the old browser-only login.
        const saved = readAccount(email);
        if (err.data?.code === 'NOT_FOUND' && saved && saved.password === form.password && (!saved.regNo || saved.regNo.toUpperCase() === regNo)) {
          const res = await api.learnerRegister({ name: saved.name || email.split('@')[0], regNo, phone: saved.phone || '0000000000', email, password: form.password });
          onNeedVerification(email, { code: res.devCode, status: res.emailStatus });
          return;
        }
        if (err.data?.code === 'EMAIL_NOT_VERIFIED') { onNeedVerification(email, null); return; }
        throw err;
      }
    } catch (err) {
      setError(err.status ? err.message : 'Could not reach the server. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="hidden lg:flex relative overflow-hidden bg-brand-900 text-white p-12 flex-col justify-between">
        <Triangles />
        <button onClick={onHome} className="relative self-start" aria-label="Home">
          <img src="/arshith-bootcamp-logo-white.png" alt="Arshith Bootcamp" className="h-12 w-auto" />
        </button>
        <div className="relative max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-peach-400">{isSignup ? 'Join the bootcamp' : 'Welcome back'}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">{isSignup ? 'Create your learner account in a minute.' : 'Pick up exactly where you left off.'}</h1>
          <ul className="mt-8 space-y-3 text-brand-100">
            {['One focused course per account', 'Quizzes after every module', 'Proctored final & unique certificate'].map(t => (
              <li key={t} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-mint-300" />{t}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-300">© {new Date().getFullYear()} Arshith Bootcamp</p>
      </aside>

      {/* Form */}
      <div className="flex flex-col px-4 sm:px-8 py-6">
        <div className="flex items-center justify-between max-w-lg w-full mx-auto">
          <button onClick={onBack} className="btn-ghost px-3 -ml-3"><ArrowLeft className="w-4 h-4" /> Back</button>
          <button onClick={onHome} className="lg:hidden" aria-label="Home">
            <img src="/arshith-bootcamp-logo.png" alt="Arshith Bootcamp" className="h-10 w-auto" />
          </button>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-lg mx-auto py-8 animate-fade-up">
            <div className="card p-6 sm:p-8">
              <p className="eyebrow">{isSignup ? 'Register' : 'Log in'}</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-brand-900">{isSignup ? 'Create your account' : 'Sign in to continue'}</h2>
              <p className="mt-1.5 text-sm text-slate-500">{isSignup ? 'All fields are required. Your registration number becomes your unique learner ID and is printed — with a QR code — on your certificate.' : 'Use the email, registration number and password you registered with.'}</p>

              {error && (
                <div role="alert" className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 grid sm:grid-cols-2 gap-4" noValidate>
                {isSignup && (
                  <Field className="sm:col-span-2" label="Full name" icon={User}>
                    <input className="input pl-11" autoComplete="name" placeholder="e.g. Arshith Kumar" value={form.name} onChange={set('name')} />
                  </Field>
                )}
                <Field label="Registration number" icon={Hash} className={isSignup ? '' : 'sm:col-span-2'}>
                  <input className="input pl-11 font-mono uppercase placeholder:normal-case" placeholder="e.g. 21A91A0501" value={form.regNo} onChange={set('regNo')} />
                </Field>
                {isSignup && (
                  <Field label="Phone number" icon={Phone}>
                    <input className="input pl-11" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                  </Field>
                )}
                <Field className="sm:col-span-2" label="Email address" icon={Mail}>
                  <input className="input pl-11" type="email" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={set('email')} />
                </Field>
                <Field className={isSignup ? '' : 'sm:col-span-2'} label="Password" icon={Lock}>
                  <input className="input pl-11 pr-11" type={showPw ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="••••••••" value={form.password} onChange={set('password')} />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand-900" aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </Field>
                {!isSignup && (
                  <p className="sm:col-span-2 -mt-2 text-right">
                    <button type="button" onClick={() => onForgotPassword(form.email.trim())} className="text-xs font-semibold text-brand-900 hover:underline">Forgot password?</button>
                  </p>
                )}
                {isSignup && (
                  <Field label="Confirm password" icon={KeyRound}>
                    <input className="input pl-11" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} />
                  </Field>
                )}
                <button type="submit" disabled={busy} className="btn-primary sm:col-span-2 py-3.5 mt-1 group">
                  {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              <p className="mt-6 pt-5 border-t border-slate-100 text-sm text-slate-500 text-center">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => onSwitchMode(isSignup ? 'login' : 'signup')} className="font-semibold text-peach-500 hover:text-peach-600">
                  {isSignup ? 'Log in' : 'Register now'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>
      <span className="relative block">
        <Icon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        {children}
      </span>
    </label>
  );
}
