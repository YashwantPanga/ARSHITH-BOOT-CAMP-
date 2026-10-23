import React, { useState } from 'react';
import { Target, Eye, HeartHandshake, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Reveal, SafeImg, PageTop } from '../components/ui';
import { IMAGES } from '../data/meta';
import { api } from '../services/api';

export function AboutPage({ onExplore, onHome }) {
  const values = [
    { icon: Target, title: 'Mission', text: 'Make rigorous, job-ready technical education free and accessible to every learner.' },
    { icon: Eye, title: 'Vision', text: 'Certificates that mean something — earned through real assessments, verifiable by anyone.' },
    { icon: HeartHandshake, title: 'Approach', text: 'Deep reading, frequent practice, honest scoring and one focused course at a time.' }
  ];
  return (
    <div>
      <PageTop title="About" crumb="About" onHome={onHome} />
      <section className="relative overflow-hidden bg-ivory">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="grid grid-cols-2 gap-3">
            <SafeImg src={IMAGES.heroStudents} alt="" className="rounded-[20px] h-60 w-full object-cover shadow-[0_24px_48px_-28px_rgba(1,58,43,.5)]" />
            <SafeImg src={IMAGES.portrait} alt="" className="rounded-[20px] h-60 w-full object-cover mt-10 shadow-[0_24px_48px_-28px_rgba(1,58,43,.5)]" />
          </Reveal>
          <Reveal>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">About us</p>
            <h2 className="edu-title mt-2 text-3xl sm:text-[38px] leading-tight">We provide <b>exclusive coaching courses</b> &amp; life-building education</h2>
            <p className="mt-4 text-charcoal/70 leading-relaxed">Arshith Bootcamp is an online academy built around complete, textbook-quality courses. Every module ends with a quiz, every course ends with a proctored final assessment, and every certificate carries the learner's real score and a unique verification ID.</p>
            <button onClick={onExplore} className="btn-primary font-display !rounded-md mt-7 px-7 py-3.5 text-[15.5px]">Explore courses</button>
          </Reveal>
        </div>
      </section>
      <section className="bg-cream py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              <div className={`h-full rounded-2xl p-7 ${i === 0 ? 'bg-brand-900 text-white' : 'bg-white border border-slate-200'}`}>
                <v.icon className={`w-7 h-7 ${i === 0 ? 'text-peach-400' : 'text-peach-500'}`} />
                <h3 className={`mt-4 text-lg font-bold ${i === 0 ? '' : 'text-brand-900'}`}>{v.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${i === 0 ? 'text-brand-100' : 'text-slate-500'}`}>{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ContactPage({ onHome }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.message.trim().length > 5;

  return (
    <>
    <PageTop title="Contact" crumb="Contact" onHome={onHome} />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-5">
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">Contact</p>
        <h2 className="edu-title mt-2 text-3xl sm:text-[38px]">Contact <b>Arshith Bootcamp</b></h2>
        <p className="mt-3 text-charcoal/70">Questions about a course, your assessment or a certificate? We usually reply within one working day.</p>
        <div className="mt-8 bg-forest text-white rounded-[20px] p-7 space-y-5">
          <p className="flex gap-3"><MapPin className="w-5 h-5 text-peach-400 shrink-0" /><span><span className="block text-xs text-brand-200">Headquarters</span>Bengaluru, Karnataka, India</span></p>
          <p className="flex gap-3"><Phone className="w-5 h-5 text-peach-400 shrink-0" /><span><span className="block text-xs text-brand-200">Phone</span>+91 86184 71444</span></p>
          <p className="flex gap-3"><Mail className="w-5 h-5 text-peach-400 shrink-0" /><span><span className="block text-xs text-brand-200">Email</span>careers@arshithgroup.com</span></p>
        </div>
      </div>
      <div className="lg:col-span-7">
        <div className="edu-card p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-12 animate-scale-in">
              <CheckCircle2 className="w-12 h-12 text-mint-400 mx-auto" />
              <h2 className="mt-4 text-xl font-bold text-brand-900">Message received</h2>
              <p className="text-slate-500 mt-1">Thanks, {form.name.split(' ')[0]}! We'll get back to you at {form.email}.</p>
              <button className="btn-outline mt-6" onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }}>Send another</button>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!valid || sending) return;
              setSending(true); setErr('');
              try { await api.sendContactMessage(form); setSent(true); }
              catch (ex) { setErr(ex.message || 'Could not send your message. Please try again.'); }
              finally { setSending(false); }
            }} className="grid sm:grid-cols-2 gap-4">
              {err && <p className="sm:col-span-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{err}</p>}
              <label className="block"><span className="text-xs font-semibold text-slate-600">Name</span><input className="input mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Email</span><input type="email" className="input mt-1.5" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
              <label className="block sm:col-span-2"><span className="text-xs font-semibold text-slate-600">Message</span><textarea rows={6} className="input mt-1.5 resize-y" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></label>
              <button disabled={!valid || sending} className="btn-primary sm:col-span-2 py-3.5"><Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send message'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
