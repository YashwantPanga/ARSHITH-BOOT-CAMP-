import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, RefreshCw, Info, X } from 'lucide-react';
import { api } from '../services/api';

/* Shared frame for the account screens: the same centred card as the login / register page. */
function Frame({ title, subtitle, onBack, onHome, asModal, children }) {
  if (asModal) {
    return (
      <div className="auth-modal landing-type relative w-full max-w-[430px] bg-white rounded-2xl shadow-[0_40px_100px_-30px_rgba(0,0,0,.55)] ring-1 ring-black/5 px-6 sm:px-8 pt-8 pb-7 animate-fade-up">
        <button onClick={onBack} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-charcoal/70 hover:bg-slate-100 hover:text-charcoal transition" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-[24px] sm:text-[26px] font-bold leading-tight text-charcoal pr-8">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-charcoal/65">{subtitle}</p>}
        {children}
      </div>
    );
  }
  return (
    <div className="landing-type min-h-screen relative overflow-hidden bg-ivory flex flex-col items-center px-4 py-8 sm:py-12">
      <div className="absolute inset-0 texture-dots opacity-50 pointer-events-none" aria-hidden="true" />
      <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-brand-100/60 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-48 -left-40 w-[480px] h-[480px] rounded-full bg-[#E9DFC9]/70 blur-3xl pointer-events-none" aria-hidden="true" />

      <button onClick={onHome} className="relative mb-6" aria-label="Arshith Bootcamp home">
        <img src="/arshith-bootcamp-logo.png" alt="Arshith Bootcamp" className="h-11 w-auto" />
      </button>

      <div className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-[0_30px_80px_-30px_rgba(1,58,43,.35)] ring-1 ring-black/5 px-6 sm:px-10 pt-9 pb-8 animate-fade-up">
        <button onClick={onBack} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-charcoal/70 hover:bg-slate-100 hover:text-charcoal transition" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <h1 className="text-[28px] sm:text-[30px] font-bold leading-tight text-charcoal pr-8">{title}</h1>
        {subtitle && <p className="mt-2 text-[16px] leading-relaxed text-charcoal/65">{subtitle}</p>}
        {children}
      </div>

      <p className="relative mt-6 text-[12px] text-charcoal/45">© {new Date().getFullYear()} Arshith Bootcamp</p>
    </div>
  );
}

const ErrorBox = ({ children }) => (children ? <div role="alert" className="mt-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{children}</div> : null);
const InfoBox = ({ children }) => (children ? <div role="status" className="mt-5 p-3 rounded-lg bg-brand-50 border border-brand-200 text-brand-900 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{children}</div> : null);

/** Shown only when the server has no email (SMTP) configured and is not in production mode. */
function DevNotice({ code, status }) {
  if (!code && status !== 'outbox') return null;
  return (
    <div className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex gap-2">
      <Info className="w-4 h-4 mt-0.5 shrink-0" />
      <span>Email sending is not configured on this server yet, so no email was delivered. {code ? <>For testing, your code is <strong className="font-mono tracking-widest">{code}</strong>. </> : null}The message was saved in <code>server/data/outbox</code>. Configure SMTP in <code>.env</code> to send real emails.</span>
    </div>
  );
}

/** Label with a required marker above a field (same style as the login card). */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[15px] font-bold text-charcoal">{label} <span className="text-rose-600" aria-hidden="true">*</span></span>
      {children}
    </label>
  );
}

function CodeInput({ value, onChange, autoFocus }) {
  return (
    <Field label="6-digit code">
      <input
        className="auth-input !h-14 text-center text-[26px] font-semibold tracking-[0.55em] placeholder:tracking-[0.55em]"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="••••••"
        aria-label="6-digit code"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
    </Field>
  );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder }) {
  return (
    <span className="relative block">
      <input className="auth-input pr-12" type={show ? 'text' : 'password'} autoComplete="new-password" value={value} onChange={onChange} placeholder={placeholder} />
      {onToggle && (
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-charcoal/45 hover:text-brand-900" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
        </button>
      )}
    </span>
  );
}

const primaryBtn = 'w-full h-12 rounded-lg bg-brand-900 text-ivory text-[16px] font-bold hover:bg-forest active:scale-[.99] disabled:opacity-70 transition shadow-[0_10px_24px_-12px_rgba(1,58,43,.7)]';
const Or = () => (
  <div className="my-5 flex items-center gap-3 text-[13px] text-charcoal/50" aria-hidden="true">
    <span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" />
  </div>
);
const secondaryBtn = 'w-full h-12 rounded-lg border border-charcoal/80 bg-white text-[16px] font-bold text-charcoal hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition inline-flex items-center justify-center gap-2';

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
export function VerifyEmailPage({ email: initialEmail = '', token, onVerified, onBack, onHome, asModal }) {
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
    <Frame title="Verify your email" subtitle={<>Enter the 6-digit code we sent{email ? <> to <strong className="font-semibold text-charcoal">{email}</strong></> : ''} to activate your account.</>} onBack={onBack} onHome={onHome} asModal={asModal}>
      <DevNotice code={dev?.email === email ? dev.code : null} status={dev?.email === email ? dev.status : null} />
      <ErrorBox>{state.status === 'error' && state.message}</ErrorBox>
      <InfoBox>{state.status === 'sent' && state.message}</InfoBox>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {!initialEmail && (
          <Field label="Email">
            <input className="auth-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
          </Field>
        )}
        <CodeInput value={code} onChange={setCode} autoFocus />
        <button type="submit" disabled={state.status === 'verifying'} className={`${primaryBtn} mt-1`}>
          {state.status === 'verifying' ? 'Verifying…' : 'Verify email'}
        </button>
      </form>
      <Or />
      <button type="button" onClick={resend} disabled={cooldown > 0 || !email} className={secondaryBtn}>
        <RefreshCw className="w-4 h-4" />{cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </button>
      <p className="mt-6 text-[13px] leading-relaxed text-charcoal/60">The code expires in 24 hours. If you don't see the email within a minute, check your spam or promotions folder.</p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Forgot password                                                      */
/* ------------------------------------------------------------------ */
export function ForgotPasswordPage({ initialEmail = '', onCodeSent, onBack, onHome, asModal }) {
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
    <Frame title="Reset your password" subtitle="Enter the email address of your account and we'll send you a 6-digit code to choose a new password." onBack={onBack} onHome={onHome} asModal={asModal}>
      <ErrorBox>{state.status === 'error' && state.message}</ErrorBox>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Email">
          <input className="auth-input" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
        </Field>
        <button type="submit" disabled={state.status === 'sending'} className={`${primaryBtn} mt-1`}>
          {state.status === 'sending' ? 'Sending…' : 'Send reset code'}
        </button>
      </form>
      <Or />
      <button type="button" onClick={onBack} className={secondaryBtn}>Back to log in</button>
      <p className="mt-6 text-[13px] leading-relaxed text-charcoal/60">For your security we only email a code if an account exists for this address. The code expires in 30 minutes.</p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Reset password                                                       */
/* ------------------------------------------------------------------ */
export function ResetPasswordPage({ email: initialEmail = '', token, onDone, onResend, onBack, onHome, asModal }) {
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
    <Frame
      title="Choose a new password"
      subtitle={token ? 'Your reset link is valid. Choose a new password below.' : <>Enter the code we sent{email ? <> to <strong className="font-semibold text-charcoal">{email}</strong></> : ''} and your new password.</>}
      onBack={onBack}
      onHome={onHome}
      asModal={asModal}
    >
      {!token && <DevNotice code={dev?.kind === 'reset' && dev.email === email ? dev.code : null} status={dev?.kind === 'reset' && dev.email === email ? dev.status : null} />}
      {!token && !dev?.code && <InfoBox>If an account exists for this email, a reset code is on its way. It expires in 30 minutes.</InfoBox>}
      <ErrorBox>{state.status === 'error' && state.message}</ErrorBox>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {!initialEmail && (
          <Field label="Email">
            <input className="auth-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
          </Field>
        )}
        {!token && <CodeInput value={code} onChange={setCode} autoFocus />}
        <Field label="New password">
          <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} show={show} onToggle={() => setShow(s => !s)} placeholder="At least 6 characters" />
        </Field>
        <Field label="Confirm new password">
          <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} show={show} placeholder="Repeat the password" />
        </Field>
        <button type="submit" disabled={state.status === 'saving'} className={`${primaryBtn} mt-1`}>
          {state.status === 'saving' ? 'Saving…' : 'Change password'}
        </button>
      </form>
      {!token && (
        <>
          <Or />
          <button type="button" onClick={onResend} className={secondaryBtn}><RefreshCw className="w-4 h-4" />Send a new code</button>
        </>
      )}
    </Frame>
  );
}
