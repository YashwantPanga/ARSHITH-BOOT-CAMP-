import React, { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import { readAccount } from '../utils/session';
import { api } from '../services/api';

/**
 * Full-page Login / Register screen (routes: /login and /register): one centred card with a large
 * title, labelled fields, a full-width primary button and a button to switch between the two modes.
 * Accounts live on the server; new accounts verify their email before signing in.
 */
export default function AuthPage({ asModal = false, mode = 'login', onSwitchMode, onBack, onHome, onSuccess, onNeedVerification, onForgotPassword }) {
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

  const card = (
      <div className={`${asModal ? 'auth-modal landing-type' : ''} relative w-full ${isSignup ? (asModal ? 'max-w-[500px]' : 'max-w-[540px]') : (asModal ? 'max-w-[430px]' : 'max-w-[460px]')} bg-white rounded-2xl ${asModal ? 'shadow-[0_40px_100px_-30px_rgba(0,0,0,.55)] px-6 sm:px-8 pt-8 pb-7' : 'shadow-[0_30px_80px_-30px_rgba(1,58,43,.35)] px-6 sm:px-10 pt-9 pb-8'} ring-1 ring-black/5 animate-fade-up`}>
        <button onClick={onBack} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-charcoal/70 hover:bg-slate-100 hover:text-charcoal transition" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <h1 className={`${asModal ? 'text-[24px] sm:text-[26px]' : 'text-[28px] sm:text-[30px]'} font-bold leading-tight text-charcoal pr-8`}>{isSignup ? 'Create your account' : 'Log in to your account'}</h1>
        <p className={`mt-2 ${asModal ? 'text-[15px]' : 'text-[16px]'} leading-relaxed text-charcoal/65`}>
          {isSignup
            ? 'Learn industry skills with free, mentor-written courses and earn a QR-verified certificate.'
            : 'Learn on your own time with mentor-written courses and quizzes after every module.'}
        </p>

        {error && (
          <div role="alert" className="mt-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`mt-6 grid gap-4 ${isSignup ? 'sm:grid-cols-2' : ''}`} noValidate>
          {isSignup && (
            <Field className="sm:col-span-2" label="Full name" hint="Exactly as on your government ID or college ID - it is printed on your certificate and checked against your ID in the final exam.">
              <input className="auth-input" autoComplete="name" placeholder="e.g. Panga Yashwant" value={form.name} onChange={set('name')} />
            </Field>
          )}
          <Field label="Email" className={isSignup ? 'sm:col-span-2' : ''}>
            <input className="auth-input" type="email" autoComplete="email" placeholder="name@email.com" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Registration number">
            <input className="auth-input uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal" placeholder="e.g. 21A91A0501" value={form.regNo} onChange={set('regNo')} />
          </Field>
          {isSignup && (
            <Field label="Phone number">
              <input className="auth-input" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </Field>
          )}
          <Field
            label="Password"
            aside={!isSignup && (
              <button type="button" onClick={() => onForgotPassword(form.email.trim())} className="text-[14px] font-semibold text-brand-900 underline underline-offset-2 hover:text-forest">Forgot password?</button>
            )}
          >
            <span className="relative block">
              <input className="auth-input pr-12" type={showPw ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder={isSignup ? 'At least 6 characters' : 'Enter your password'} value={form.password} onChange={set('password')} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-charcoal/45 hover:text-brand-900" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </span>
          </Field>
          {isSignup && (
            <Field label="Confirm password">
              <input className="auth-input" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
            </Field>
          )}

          <button type="submit" disabled={busy} className={`${isSignup ? 'sm:col-span-2' : ''} mt-1 h-12 rounded-lg bg-brand-900 text-ivory text-[16px] font-bold hover:bg-forest active:scale-[.99] disabled:opacity-70 transition shadow-[0_10px_24px_-12px_rgba(1,58,43,.7)]`}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Continue'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[13px] text-charcoal/50" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" />
        </div>

        <button type="button" onClick={() => onSwitchMode(isSignup ? 'login' : 'signup')} className="w-full h-12 rounded-lg border border-charcoal/80 bg-white text-[16px] font-bold text-charcoal hover:bg-slate-50 transition">
          {isSignup ? 'Log in to an existing account' : 'Create a new account'}
        </button>

        <p className={`${asModal ? 'mt-5 text-[12.5px]' : 'mt-6 text-[13px]'} leading-relaxed text-charcoal/60`}>
          {isSignup
            ? 'Your registration number becomes your learner ID and is printed with a QR code on your certificate. We will email you a code to verify your address.'
            : 'Use the email, registration number and password you registered with. Having trouble? Use Forgot password to reset it.'}
        </p>
      </div>
  );

  if (asModal) return card;
  return (
    <div className="landing-type min-h-screen relative overflow-hidden bg-ivory flex flex-col items-center px-4 py-8 sm:py-12">
      {/* soft brand backdrop */}
      <div className="absolute inset-0 texture-dots opacity-50 pointer-events-none" aria-hidden="true" />
      <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-brand-100/60 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-48 -left-40 w-[480px] h-[480px] rounded-full bg-[#E9DFC9]/70 blur-3xl pointer-events-none" aria-hidden="true" />
      <button onClick={onHome} className="relative mb-6" aria-label="Arshith Bootcamp home">
        <img src="/arshith-bootcamp-logo.png" alt="Arshith Bootcamp" className="h-11 w-auto" />
      </button>
      {card}
      <p className="relative mt-6 text-[12px] text-charcoal/45">© {new Date().getFullYear()} Arshith Bootcamp</p>
    </div>
  );
}

function Field({ label, className = '', hint, aside, children }) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="text-[15px] font-bold text-charcoal">{label} <span className="text-rose-600" aria-hidden="true">*</span></span>
        {aside}
      </span>
      {children}
      {hint && <span className="block mt-1.5 text-[12.5px] leading-snug text-charcoal/55">{hint}</span>}
    </label>
  );
}
