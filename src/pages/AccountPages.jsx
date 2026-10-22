import React, { useEffect, useRef, useState } from 'react';
import { Mail, KeyRound, Lock, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, RefreshCw, Info } from 'lucide-react';
import { api } from '../services/api';

/* Shared frame for the account screens (matches the login page). */
function Frame({ eyebrow, title, subtitle, onBack, onHome, children }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col px-4 sm:px-8 py-6">
      <div className="flex items-center justify-between max-w-lg w-full mx-auto">
        <button onClick={onBack} className="btn-ghost px-3 -ml-3"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={onHome} aria-label="Home"><img src="/arshith-bootcamp-logo.png" alt="Arshith Bootcamp" className="h-10 w-auto" /></button>
      </div>
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-lg mx-auto py-8 animate-fade-up">
          <div className="card p-6 sm:p-8">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-2 text-2xl sm:text-3xl text-brand-900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const ErrorBox = ({ children }) => (children ? <div role="alert" className="mt-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{children}</div> : null);
const InfoBox = ({ children }) => (children ? <div role="status" className="mt-5 p-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{children}</div> : null);

/** Shown only when the server has no email (SMTP) configured and is not in production mode. */
function DevNotice({ code, status }) {
  if (!code && status !== 'outbox') return null;
  return (
    <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex gap-2">
      <Info className="w-4 h-4 mt-0.5 shrink-0" />
      <span>Email sending is not configured on this server yet, so no email was delivered. {code ? <>For testing, your code is <strong className="font-mono tracking-widest">{code}</strong>. </> : null}The message was saved in <code>server/data/outbox</code>. Configure SMTP in <code>.env</code> to send real emails.</span>
    </div>
  );
}

function CodeInput({ value, onChange, autoFocus }) {
  return (
    <input
      className="input text-center font-mono text-2xl tracking-[0.5em] py-4"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="••••••"
      aria-label="6-digit code"
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
    />
  );
}

function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}

const readDev = () => { try { return JSON.parse(sessionStorage.getItem('arb_dev_mail') || 'null'); } catch { return null; } };
export const rememberDevMail = (info) => { try { sessionStorage.setItem('arb_dev_mail', JSON.stringify(info)); } catch { /* ignore */ } };

/* ------------------------------------------------------------------ */
/* Verify email                                                         */
/* ------------------------------------------------------------------ */
export function VerifyEmailPage({ email: initialEmail = '', token, onVerified, onBack, onHome }) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [state, setState] = useState({ status: token ? 'verifying' : 'idle' });
  const [dev, setDev] = useState(() => readDev());
  const [cooldown, setCooldown] = useCooldown();
  const ranToken = useRef(false);

  const verify = async (payload) => {
    setState({ status: 'verifying' });
    try {
      const res = await api.verifyEmail(payload);
      sessionStorage.removeItem('arb_dev_mail');
      setState({ status: 'done' });
      onVerified({ ...res.learner, token: res.token });
    } catch (err) {
      setState({ status: 'error', message: err.status ? err.message : 'Could not reach the server. Please try again.' });
    }
  };

  // One-click link from the email
  useEffect(() => {
    if (token && initialEmail && !ranToken.current) { ranToken.current = true; verify({ email: initialEmail, token }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, initialEmail]);

  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setState({ status: 'error', message: 'Enter the email address you registered with.' });
    if (code.length !== 6) return setState({ status: 'error', message: 'Enter the 6-digit code from the email.' });
    verify({ email: email.trim().toLowerCase(), code });
  };

  const resend = async () => {
    if (cooldown > 0) return;
    try {
      const res = await api.resendVerification(email.trim().toLowerCase());
      const info = { email, code: res.devCode, status: res.emailStatus };
      rememberDevMail(info);
      setDev(info);
      setState({ status: 'sent', message: 'A new code is on its way. Check your inbox and spam folder.' });
      setCooldown(60);
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  };

  return (
    <Frame eyebrow="Verify email" title="Check your inbox" subtitle={`Enter the 6-digit code we sent${email ? ` to ${email}` : ''} to activate your account.`} onBack={onBack} onHome={onHome}>
      <DevNotice code={dev?.email === email ? dev.code : null} status={dev?.email === email ? dev.status : null} />
      <ErrorBox>{state.status === 'error' && state.message}</ErrorBox>
      <InfoBox>{state.status === 'sent' && state.message}</InfoBox>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {!initialEmail && (
          <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </label>
        )}
        <CodeInput value={code} onChange={setCode} autoFocus />
        <button type="submit" disabled={state.status === 'verifying'} className="btn-primary w-full py-3.5">
          {state.status === 'verifying' ? 'Verifying…' : <>Verify email <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-500 text-center">
        Didn't get it?{' '}
        <button onClick={resend} disabled={cooldown > 0 || !email} className="font-semibold text-brand-900 hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" />{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Forgot password                                                      */
/* ------------------------------------------------------------------ */
export function ForgotPasswordPage({ initialEmail = '', onCodeSent, onBack, onHome }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState({ status: 'idle' });

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setState({ status: 'error', message: 'Please enter a valid email address.' });
    setState({ status: 'sending' });
    try {
      const res = await api.forgotPassword(value);
      rememberDevMail({ email: value, code: res.devCode, status: res.emailStatus, kind: 'reset' });
      onCodeSent(value);
    } catch (err) {
      setState({ status: 'error', message: err.status ? err.message : 'Could not reach the server. Please try again.' });
    }
  };

  return (
    <Frame eyebrow="Forgot password" title="Reset your password" subtitle="Enter the email address of your account. We'll send you a 6-digit code to choose a new password." onBack={onBack} onHome={onHome}>
      <ErrorBox>{state.status === 'error' && state.message}</ErrorBox>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</span>
          <span className="relative block">
            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input className="input pl-11" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </span>
        </label>
        <button type="submit" disabled={state.status === 'sending'} className="btn-primary w-full py-3.5">
          {state.status === 'sending' ? 'Sending…' : <>Send reset code <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Reset password                                                       */
/* ------------------------------------------------------------------ */
export function ResetPasswordPage({ email: initialEmail = '', token, onDone, onResend, onBack, onHome }) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [state, setState] = useState({ status: 'idle' });
  const dev = readDev();

  const submit = async (e) => {
    e.preventDefault();
    if (!token && code.length !== 6) return setState({ status: 'error', message: 'Enter the 6-digit code from the email.' });
    if (pw.length < 6) return setState({ status: 'error', message: 'Password must be at least 6 characters.' });
    if (pw !== confirm) return setState({ status: 'error', message: 'Passwords do not match.' });
    setState({ status: 'saving' });
    try {
      await api.resetPassword({ email: email.trim().toLowerCase(), password: pw, ...(token ? { token } : { code }) });
      sessionStorage.removeItem('arb_dev_mail');
      onDone();
    } catch (err) {
      setState({ status: 'error', message: err.status ? err.message : 'Could not reach the server. Please try again.' });
    }
  };

  return (
    <Frame eyebrow="New password" title="Choose a new password" subtitle={token ? 'Your reset link is valid. Choose a new password below.' : `Enter the code we sent${email ? ` to ${email}` : ''} and your new password.`} onBack={onBack} onHome={onHome}>
      {!token && <DevNotice code={dev?.kind === 'reset' && dev.email === email ? dev.code : null} status={dev?.kind === 'reset' && dev.email === email ? dev.status : null} />}
      {!token && !dev?.code && <InfoBox>If an account exists for this email, a reset code is on its way. It expires in 30 minutes.</InfoBox>}
      <ErrorBox>{state.status === 'error' && state.message}</ErrorBox>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {!initialEmail && (
          <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </label>
        )}
        {!token && <CodeInput value={code} onChange={setCode} autoFocus />}
        <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1.5">New password</span>
          <span className="relative block">
            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input className="input pl-11 pr-11" type={show ? 'text' : 'password'} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand-900" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </span>
        </label>
        <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm new password</span>
          <span className="relative block">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input className="input pl-11" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the password" />
          </span>
        </label>
        <button type="submit" disabled={state.status === 'saving'} className="btn-primary w-full py-3.5">
          {state.status === 'saving' ? 'Saving…' : <>Change password <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
      {!token && <p className="mt-5 text-sm text-slate-500 text-center">Need a new code? <button onClick={onResend} className="font-semibold text-brand-900 hover:underline">Send again</button></p>}
    </Frame>
  );
}
