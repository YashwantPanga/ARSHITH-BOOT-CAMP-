// Reports that the signed-in learner ran code, for the daily coding streak. Only the first run of each
// day is sent (later runs change nothing). When that run is the learner's first coding of the day, an
// 'arb:streak' window event lets the streak toast celebrate.
import { api } from '../services/api';
import { readStudent, userIdOf } from './session';

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export function noteCoding(kind = 'code') {
  const user = readStudent();
  if (!user?.token) return;
  const key = `arb_coded_${userIdOf(user)}_${todayKey()}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch { /* storage unavailable: just send it */ }
  api.recordActivity(kind)
    .then((r) => { if (r?.newToday && r.streak) window.dispatchEvent(new CustomEvent('arb:streak', { detail: r.streak })); })
    .catch(() => { try { localStorage.removeItem(key); } catch { /* ignore */ } });
}
