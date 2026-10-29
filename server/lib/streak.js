// Daily coding streak. A learner's active days are the days (India time) on which they ran code on the
// site (recorded by POST /api/activity) or completed a practice exercise, module quiz or Interview Prep
// problem. The streak is the run of consecutive active days ending today, or yesterday if they have not
// coded yet today (it is still alive until midnight).

export const STREAK_MILESTONES = [3, 7, 15, 30, 60, 100];

/** 'YYYY-MM-DD' in India time. */
export function dayKey(date = new Date()) {
  return new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

const shift = (key, days) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Marks today as a coding day; returns the updated activity record. */
export function recordActivity(db, email, kind = 'code') {
  if (!db.learnerActivity) db.learnerActivity = {};
  const rec = (db.learnerActivity[email] ||= { days: {} });
  const today = dayKey();
  const day = (rec.days[today] ||= { runs: 0, kinds: {} });
  day.runs += 1;
  day.kinds[kind] = (day.kinds[kind] || 0) + 1;
  return rec;
}

/** Every active day of a learner, from recorded runs and from completed work. */
export function activeDays(db, email) {
  const days = new Set(Object.keys(db.learnerActivity?.[email]?.days || {}));
  for (const set of Object.values(db.interviewProgress?.[email] || {})) for (const at of Object.values(set)) days.add(dayKey(at));
  for (const course of Object.values(db.practiceProgress?.[email] || {})) {
    for (const mod of Object.values(course)) {
      for (const bucket of [mod.exercises, mod.knowledge]) for (const v of Object.values(bucket || {})) if (v?.completedAt) days.add(dayKey(v.completedAt));
    }
  }
  for (const a of db.quizAttempts || []) if (a.userId === email && a.completedAt) days.add(dayKey(a.completedAt));
  return days;
}

/** Streak summary for the dashboard. */
export function streakSummary(db, email, now = new Date()) {
  const days = activeDays(db, email);
  const today = dayKey(now);
  const codedToday = days.has(today);
  let current = 0;
  for (let d = codedToday ? today : shift(today, -1); days.has(d); d = shift(d, -1)) current++;

  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of [...days].sort()) {
    run = prev && shift(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  const recent = [];
  for (let i = 34; i >= 0; i--) {
    const d = shift(today, -i);
    recent.push({ date: d, active: days.has(d), runs: db.learnerActivity?.[email]?.days?.[d]?.runs || 0 });
  }
  return {
    current,
    best,
    codedToday,
    totalDays: days.size,
    today,
    recent,
    nextMilestone: STREAK_MILESTONES.find(m => m > current) || null,
    milestones: STREAK_MILESTONES.map(m => ({ days: m, reached: best >= m }))
  };
}
