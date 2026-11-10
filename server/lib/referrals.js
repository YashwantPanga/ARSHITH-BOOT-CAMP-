// Refer & Earn: referral codes, link clicks, attribution, the referral discount, commissions, the
// wallet ledger, withdrawals, refunds and the scheduled release / overdue checks.
//
// All money is integer paise. The wallet balance is never stored: it is the sum of ledger entries,
// each with a unique idempotency key, so replaying any step (a second webhook, a retried job) cannot
// count money twice. Buckets: pending -> available -> reserved -> withdrawn.
//
// Collections (documents in the app database, see server/db.js):
//   referralSettings      program rules + promotion settings (admin-editable)
//   referralProfiles      { [email]: { code, createdAt, suspended, ... } }
//   referralClicks        [{ id, code, visitorId, at }]
//   referralAttributions  { [refereeEmail]: { code, referrerEmail, attributedAt, expiresAt, source } }
//   referralRewards       [{ id: 'rw_<orderId>', orderId, referrerEmail, refereeEmail, paidPaise, commissionPaise, status, ... }]
//   referralLedger        [{ id, email, bucket, delta, type, ref, at }]
//   withdrawalRequests    [{ id, email, amountPaise, method, payout, status, ... }]
//   payoutMethods         { [email]: last payout details (for prefill) }
//   referralAudit         [{ id, at, actor, action, target, details }]
//   notifications         { [email]: [{ id, type, title, body, at, read }] }
import crypto from 'crypto';

const DAY = 24 * 60 * 60 * 1000;
const norm = (v) => String(v || '').trim().toLowerCase();
const nowIso = (now) => new Date(now).toISOString();

export const DEFAULT_SETTINGS = {
  enabled: true,
  discountPct: 10,            // customer discount
  commissionPct: 10,          // of the amount actually paid after the discount
  releaseDays: 7,             // pending -> available
  minWithdrawalPaise: 10000,  // Rs 100
  attributionDays: 30,
  payoutSlaDays: 7,           // pay within 7 days of approval
  eligibleCourseIds: 'all',   // 'all' or an array of course ids
  interviewEligible: true,
  promo: {
    enabled: true,
    desktopModal: true,
    mobileCard: true,
    headline: 'Your Network. Your Rewards.',
    description: 'Invite friends to CodeLekho. Help them save 10% and earn 10% commission on their eligible purchases.',
    cta: 'Start Earning',
    mobileHeadline: 'Refer Friends & Earn 10%',
    mobileDescription: 'They get 10% OFF. You earn 10% commission.',
    delaySeconds: 8,
    dismissDays: 7,
    locations: ['home', 'courses', 'course-details', 'dashboard', 'interview', 'about'],
    guests: true,
    loggedIn: true,
    illustration: 'gift'      // 'gift' | 'coins' | 'network'
  }
};

/* ---------------------------------------------------------------- settings */

export function settings(db) {
  const s = db.referralSettings || {};
  return { ...DEFAULT_SETTINGS, ...s, promo: { ...DEFAULT_SETTINGS.promo, ...(s.promo || {}) } };
}

const clampInt = (v, lo, hi, fallback) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : fallback;
};

/** Validates and saves admin changes. Returns the new settings. */
export function updateSettings(db, patch, actor) {
  const cur = settings(db);
  const next = { ...cur };
  if ('enabled' in patch) next.enabled = !!patch.enabled;
  next.discountPct = clampInt(patch.discountPct ?? cur.discountPct, 0, 90, cur.discountPct);
  next.commissionPct = clampInt(patch.commissionPct ?? cur.commissionPct, 0, 90, cur.commissionPct);
  next.releaseDays = clampInt(patch.releaseDays ?? cur.releaseDays, 0, 90, cur.releaseDays);
  next.minWithdrawalPaise = clampInt(patch.minWithdrawalPaise ?? cur.minWithdrawalPaise, 100, 10000000, cur.minWithdrawalPaise);
  next.attributionDays = clampInt(patch.attributionDays ?? cur.attributionDays, 1, 365, cur.attributionDays);
  next.payoutSlaDays = clampInt(patch.payoutSlaDays ?? cur.payoutSlaDays, 1, 60, cur.payoutSlaDays);
  if ('eligibleCourseIds' in patch) {
    next.eligibleCourseIds = patch.eligibleCourseIds === 'all' ? 'all'
      : Array.isArray(patch.eligibleCourseIds) ? patch.eligibleCourseIds.map(String) : cur.eligibleCourseIds;
  }
  if ('interviewEligible' in patch) next.interviewEligible = !!patch.interviewEligible;
  if (patch.promo && typeof patch.promo === 'object') {
    const p = patch.promo; const cp = cur.promo;
    const text = (v, fallback, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : fallback);
    next.promo = {
      enabled: 'enabled' in p ? !!p.enabled : cp.enabled,
      desktopModal: 'desktopModal' in p ? !!p.desktopModal : cp.desktopModal,
      mobileCard: 'mobileCard' in p ? !!p.mobileCard : cp.mobileCard,
      headline: text(p.headline, cp.headline, 80),
      description: text(p.description, cp.description, 240),
      cta: text(p.cta, cp.cta, 30),
      mobileHeadline: text(p.mobileHeadline, cp.mobileHeadline, 60),
      mobileDescription: text(p.mobileDescription, cp.mobileDescription, 120),
      delaySeconds: clampInt(p.delaySeconds ?? cp.delaySeconds, 0, 600, cp.delaySeconds),
      dismissDays: clampInt(p.dismissDays ?? cp.dismissDays, 0, 365, cp.dismissDays),
      locations: Array.isArray(p.locations) ? p.locations.map(String).slice(0, 20) : cp.locations,
      guests: 'guests' in p ? !!p.guests : cp.guests,
      loggedIn: 'loggedIn' in p ? !!p.loggedIn : cp.loggedIn,
      illustration: ['gift', 'coins', 'network'].includes(p.illustration) ? p.illustration : cp.illustration
    };
  }
  db.referralSettings = next;
  audit(db, actor, 'settings.update', 'referralSettings', JSON.stringify(patch).slice(0, 500));
  return next;
}

/** Settings the public website needs (no money totals, no personal data). */
export function publicPromo(db) {
  const s = settings(db);
  return { enabled: s.enabled && s.promo.enabled, ...s.promo, discountPct: s.discountPct, commissionPct: s.commissionPct, minWithdrawalPaise: s.minWithdrawalPaise, releaseDays: s.releaseDays, attributionDays: s.attributionDays, payoutSlaDays: s.payoutSlaDays };
}

/* ---------------------------------------------------------------- audit + notifications */

export function audit(db, actor, action, target, details = '', now = Date.now()) {
  if (!db.referralAudit) db.referralAudit = [];
  db.referralAudit.push({ id: `au_${crypto.randomBytes(6).toString('hex')}`, at: nowIso(now), actor: actor || 'system', action, target: String(target || ''), details: String(details || '') });
  if (db.referralAudit.length > 20000) db.referralAudit.splice(0, db.referralAudit.length - 20000);
}

export function notify(db, email, type, title, body, now = Date.now()) {
  email = norm(email);
  if (!email) return;
  if (!db.notifications) db.notifications = {};
  const list = (db.notifications[email] ||= []);
  list.unshift({ id: `nt_${crypto.randomBytes(6).toString('hex')}`, type, title, body, at: nowIso(now), read: false });
  if (list.length > 100) list.length = 100;
}

/* ---------------------------------------------------------------- codes + profiles */

const CODE_RE = /^[A-Z0-9]{4,16}$/;
export const cleanCode = (c) => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export function profileByCode(db, code) {
  code = cleanCode(code);
  if (!CODE_RE.test(code)) return null;
  const hit = Object.entries(db.referralProfiles || {}).find(([, p]) => p.code === code);
  return hit ? { email: hit[0], ...hit[1] } : null;
}

/** The learner's referral profile, created (with a unique code) on first use. */
export function ensureProfile(db, email, now = Date.now()) {
  email = norm(email);
  if (!db.referralProfiles) db.referralProfiles = {};
  if (db.referralProfiles[email]) return db.referralProfiles[email];
  const name = db.learners?.[email]?.name || email.split('@')[0];
  const prefix = (name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5) || 'CL').padEnd(2, 'X');
  const taken = new Set(Object.values(db.referralProfiles).map(p => p.code));
  let code;
  for (let i = 0; i < 50 && (!code || taken.has(code)); i++) {
    code = `${prefix}${crypto.randomInt(100, 1000)}${i > 10 ? crypto.randomBytes(1).toString('hex').toUpperCase() : ''}`;
  }
  while (taken.has(code)) code = `CL${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  db.referralProfiles[email] = { code, createdAt: nowIso(now), suspended: false };
  return db.referralProfiles[email];
}

/* ---------------------------------------------------------------- clicks + attribution */

/** Counts a click on a referral link (one per visitor per code per 12 hours). */
export function recordClick(db, code, visitorId, now = Date.now()) {
  const prof = profileByCode(db, code);
  const s = settings(db);
  if (!prof || prof.suspended || !s.enabled) return { valid: false };
  const vid = String(visitorId || '').slice(0, 64) || 'anon';
  if (!db.referralClicks) db.referralClicks = [];
  // Counts live on the profiles; the click list only keeps the last 12 hours (for de-duplication),
  // so the stored data stays small. Older data without counters is counted once from the list.
  if (db.referralClickTotal === undefined) {
    db.referralClickTotal = db.referralClicks.length;
    for (const p of Object.values(db.referralProfiles || {})) p.clicks = db.referralClicks.filter(c => c.code === p.code).length;
  }
  const WINDOW = 12 * 60 * 60 * 1000;
  db.referralClicks = db.referralClicks.filter(c => now - Date.parse(c.at) < WINDOW);
  const recent = db.referralClicks.some(c => c.code === prof.code && c.visitorId === vid);
  if (!recent) {
    db.referralClicks.push({ code: prof.code, visitorId: vid, at: nowIso(now) });
    if (db.referralClicks.length > 50000) db.referralClicks.splice(0, db.referralClicks.length - 50000);
    const stored = db.referralProfiles[prof.email];
    stored.clicks = (stored.clicks || 0) + 1;
    db.referralClickTotal += 1;
  }
  const first = (db.learners?.[prof.email]?.name || '').split(' ')[0] || 'A friend';
  return { valid: true, code: prof.code, referrerName: first, counted: !recent };
}

const digits = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const hasPaidOrder = (db, email) => (db.payments || []).some(p => p.email === email && p.status === 'paid');

/**
 * Links a learner to a referrer. Policy: one referrer per account, locked once set; the link used
 * last before signing up wins; only accounts with no paid purchase yet can be referred; no
 * self-referral (same email or same phone number).
 */
export function attribute(db, refereeEmail, code, { source = 'registration', now = Date.now() } = {}) {
  refereeEmail = norm(refereeEmail);
  const s = settings(db);
  if (!s.enabled) return { ok: false, reason: 'PROGRAM_OFF' };
  const prof = profileByCode(db, code);
  if (!prof) return { ok: false, reason: 'INVALID_CODE' };
  if (prof.suspended) return { ok: false, reason: 'REFERRER_SUSPENDED' };
  if (prof.email === refereeEmail) return { ok: false, reason: 'SELF_REFERRAL' };
  const me = db.learners?.[refereeEmail]; const them = db.learners?.[prof.email];
  if (me && them && digits(me.phone) && digits(me.phone) === digits(them.phone)) return { ok: false, reason: 'SELF_REFERRAL' };
  if (!db.referralAttributions) db.referralAttributions = {};
  if (db.referralAttributions[refereeEmail]) return { ok: false, reason: 'ALREADY_REFERRED' };
  if (hasPaidOrder(db, refereeEmail)) return { ok: false, reason: 'EXISTING_CUSTOMER' };
  db.referralAttributions[refereeEmail] = {
    code: prof.code, referrerEmail: prof.email, attributedAt: nowIso(now),
    expiresAt: nowIso(now + s.attributionDays * DAY), source
  };
  notify(db, prof.email, 'referral.joined', 'New referral', `${(me?.name || 'Someone').split(' ')[0]} joined CodeLekho with your link.`, now);
  return { ok: true, attribution: db.referralAttributions[refereeEmail] };
}

/** The learner's attribution if it can still give a discount right now, else null. */
export function activeAttribution(db, email, now = Date.now()) {
  const a = db.referralAttributions?.[norm(email)];
  if (!a || !settings(db).enabled) return null;
  if (now > Date.parse(a.expiresAt)) return null;
  const prof = db.referralProfiles?.[a.referrerEmail];
  if (!prof || prof.suspended || prof.code !== a.code) return null;
  return a;
}

/* ---------------------------------------------------------------- pricing */

export function itemEligible(db, item) {
  const s = settings(db);
  if (item.kind === 'interview') return s.interviewEligible;
  return s.eligibleCourseIds === 'all' || (s.eligibleCourseIds || []).includes(item.courseId);
}

/**
 * Price for a learner, computed on the server only. item = { kind, courseId, pricePaise }.
 * Returns { originalPaise, discountPaise, finalPaise, referral: { code, referrerEmail, discountPct, commissionPct } | null }.
 */
export function quote(db, email, item, now = Date.now()) {
  const s = settings(db);
  const originalPaise = Math.round(item.pricePaise);
  const a = activeAttribution(db, email, now);
  if (!a || !itemEligible(db, item) || originalPaise <= 0 || s.discountPct <= 0 && s.commissionPct <= 0) {
    return { originalPaise, discountPaise: 0, finalPaise: originalPaise, referral: null };
  }
  const discountPaise = Math.floor((originalPaise * s.discountPct) / 100);
  return {
    originalPaise, discountPaise, finalPaise: originalPaise - discountPaise,
    referral: { code: a.code, referrerEmail: a.referrerEmail, discountPct: s.discountPct, commissionPct: s.commissionPct }
  };
}

/* ---------------------------------------------------------------- ledger */

/** Adds one ledger entry unless its id already exists. Returns true when it was added. */
function post(db, { id, email, bucket, delta, type, ref, note = '' }, now) {
  if (!db.referralLedger) db.referralLedger = [];
  if (!delta) return false;
  if (db.referralLedger.some(e => e.id === id)) return false;
  db.referralLedger.push({ id, email: norm(email), bucket, delta: Math.trunc(delta), type, ref, note, at: nowIso(now) });
  return true;
}

export function balances(db, email) {
  email = norm(email);
  const b = { pending: 0, available: 0, reserved: 0, withdrawn: 0 };
  for (const e of db.referralLedger || []) if (e.email === email && e.bucket in b) b[e.bucket] += e.delta;
  const rewards = (db.referralRewards || []).filter(r => r.referrerEmail === email);
  const lifetime = rewards.filter(r => ['pending', 'available'].includes(r.status)).reduce((n, r) => n + r.commissionPaise, 0);
  return { ...b, lifetime };
}

/* ---------------------------------------------------------------- commissions */

/** Called once an order is verified paid. Creates the pending commission (once per order). */
export function onOrderPaid(db, order, now = Date.now()) {
  const ref = order.referral;
  if (!ref || !order.amount) return null;
  if (!db.referralRewards) db.referralRewards = [];
  const id = `rw_${order.orderId}`;
  const existing = db.referralRewards.find(r => r.id === id);
  if (existing) return existing;
  const s = settings(db);
  const pct = Number.isInteger(ref.commissionPct) ? ref.commissionPct : s.commissionPct;
  const commissionPaise = Math.floor((order.amount * pct) / 100);
  const paidAt = order.paidAt ? Date.parse(order.paidAt) : now;
  const reward = {
    id, orderId: order.orderId, paymentId: order.paymentId || null, kind: order.kind,
    referrerEmail: ref.referrerEmail, refereeEmail: order.email, code: ref.code,
    courseId: order.courseId, courseTitle: order.courseTitle,
    originalPaise: order.originalAmount ?? order.amount, discountPaise: order.discountAmount || 0, paidPaise: order.amount,
    commissionPct: pct, commissionPaise, refundedPaise: 0,
    status: commissionPaise > 0 ? 'pending' : 'cancelled',
    createdAt: nowIso(now), releaseAt: nowIso(paidAt + s.releaseDays * DAY), releasedAt: null
  };
  db.referralRewards.push(reward);
  post(db, { id: `${id}:pending`, email: reward.referrerEmail, bucket: 'pending', delta: commissionPaise, type: 'commission.created', ref: id }, now);
  const amount = `₹${(commissionPaise / 100).toFixed(2)}`;
  notify(db, reward.referrerEmail, 'commission.created', 'Commission earned', `You earned ${amount} from a referral purchase (${order.courseTitle}). It becomes available after ${s.releaseDays} days.`, now);
  notify(db, reward.referrerEmail, 'referral.purchase', 'Successful referral', `Your referral just bought ${order.courseTitle}.`, now);
  return reward;
}

/** Moves due commissions from pending to available. Idempotent: run as often as you like. */
export function releaseDue(db, now = Date.now()) {
  let released = 0;
  for (const r of db.referralRewards || []) {
    if (r.status !== 'pending' || now < Date.parse(r.releaseAt)) continue;
    const order = (db.payments || []).find(p => p.orderId === r.orderId);
    if (!order || order.status !== 'paid') {
      // the payment is no longer valid: cancel instead of releasing
      if (post(db, { id: `${r.id}:cancel`, email: r.referrerEmail, bucket: 'pending', delta: -r.commissionPaise, type: 'commission.cancelled', ref: r.id }, now)) {
        r.status = 'cancelled';
        audit(db, 'system', 'commission.cancel', r.id, 'payment no longer paid at release time', now);
      }
      continue;
    }
    const a = post(db, { id: `${r.id}:release-out`, email: r.referrerEmail, bucket: 'pending', delta: -r.commissionPaise, type: 'commission.released', ref: r.id }, now);
    const b = post(db, { id: `${r.id}:release-in`, email: r.referrerEmail, bucket: 'available', delta: r.commissionPaise, type: 'commission.released', ref: r.id }, now);
    r.status = 'available';
    r.releasedAt = nowIso(now);
    if (a || b) {
      released++;
      notify(db, r.referrerEmail, 'commission.released', 'Commission released', `₹${(r.commissionPaise / 100).toFixed(2)} moved to your available balance.`, now);
      audit(db, 'system', 'commission.release', r.id, `₹${(r.commissionPaise / 100).toFixed(2)}`, now);
    }
  }
  return released;
}

/**
 * Records a refund on an order (full or partial, cumulative) and adjusts its commission in
 * proportion: commission = floor((paid - refunded) * pct / 100).
 */
export function refundOrder(db, orderId, refundPaise, actor, now = Date.now()) {
  const order = (db.payments || []).find(p => p.orderId === orderId);
  if (!order) return { ok: false, reason: 'ORDER_NOT_FOUND' };
  const add = Math.round(Number(refundPaise));
  if (!Number.isInteger(add) || add <= 0) return { ok: false, reason: 'BAD_AMOUNT' };
  const already = order.refundedPaise || 0;
  if (already + add > order.amount) return { ok: false, reason: 'MORE_THAN_PAID' };
  order.refundedPaise = already + add;
  if (order.refundedPaise === order.amount) order.status = 'refunded';
  audit(db, actor, 'order.refund', orderId, `₹${(add / 100).toFixed(2)} (total refunded ₹${(order.refundedPaise / 100).toFixed(2)})`, now);

  const r = (db.referralRewards || []).find(x => x.orderId === orderId);
  if (!r || ['cancelled', 'reversed'].includes(r.status)) return { ok: true, order, reward: r || null };
  const newCommission = Math.floor(((order.amount - order.refundedPaise) * r.commissionPct) / 100);
  const cut = r.commissionPaise - newCommission;
  if (cut > 0) {
    const bucket = r.status === 'pending' ? 'pending' : 'available';
    post(db, { id: `${r.id}:refund:${order.refundedPaise}`, email: r.referrerEmail, bucket, delta: -cut, type: 'commission.refund', ref: r.id, note: `refund of order ${orderId}` }, now);
    r.commissionPaise = newCommission;
    r.refundedPaise = order.refundedPaise;
    if (newCommission === 0) r.status = r.status === 'pending' ? 'cancelled' : 'reversed';
    notify(db, r.referrerEmail, 'commission.adjusted', 'Commission adjusted', `A referral purchase was refunded, so ₹${(cut / 100).toFixed(2)} was taken off your ${bucket} balance.`, now);
  }
  return { ok: true, order, reward: r };
}

/** Admin: cancels an invalid commission (pending or already available). */
export function reverseReward(db, rewardId, reason, actor, now = Date.now()) {
  const r = (db.referralRewards || []).find(x => x.id === rewardId);
  if (!r) return { ok: false, reason: 'NOT_FOUND' };
  if (['cancelled', 'reversed'].includes(r.status)) return { ok: false, reason: 'ALREADY_REVERSED' };
  const bucket = r.status === 'pending' ? 'pending' : 'available';
  post(db, { id: `${r.id}:reverse`, email: r.referrerEmail, bucket, delta: -r.commissionPaise, type: 'commission.reversed', ref: r.id, note: reason }, now);
  r.status = bucket === 'pending' ? 'cancelled' : 'reversed';
  r.reversedReason = String(reason || '').slice(0, 300);
  audit(db, actor, 'commission.reverse', r.id, r.reversedReason, now);
  notify(db, r.referrerEmail, 'commission.reversed', 'Commission reversed', `A commission of ₹${(r.commissionPaise / 100).toFixed(2)} was reversed${reason ? `: ${reason}` : '.'}`, now);
  return { ok: true, reward: r };
}

/* ---------------------------------------------------------------- withdrawals */

const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.]{1,64}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function cleanPayout(method, p = {}) {
  if (method === 'upi') {
    const upiId = String(p.upiId || '').trim();
    if (!UPI_RE.test(upiId)) return { error: 'Enter a valid UPI ID (for example name@okbank).' };
    return { payout: { upiId } };
  }
  if (method === 'bank') {
    const holder = String(p.holder || '').trim();
    const bank = String(p.bank || '').trim();
    const account = String(p.account || '').replace(/\s+/g, '');
    const ifsc = String(p.ifsc || '').trim().toUpperCase();
    if (holder.length < 2) return { error: "Enter the account holder's name." };
    if (bank.length < 2) return { error: 'Enter the bank name.' };
    if (!/^\d{6,18}$/.test(account)) return { error: 'Enter a valid account number (6-18 digits).' };
    if (!IFSC_RE.test(ifsc)) return { error: 'Enter a valid IFSC code (for example SBIN0001234).' };
    return { payout: { holder: holder.slice(0, 120), bank: bank.slice(0, 120), account, ifsc } };
  }
  return { error: 'Choose UPI or bank transfer.' };
}

export const maskPayout = (method, p = {}) => (method === 'upi'
  ? { upiId: p.upiId?.replace(/^(.{2}).*(@.*)$/, '$1•••$2') }
  : { holder: p.holder, bank: p.bank, account: p.account ? `•••• ${p.account.slice(-4)}` : '', ifsc: p.ifsc });

/** Learner asks for a payout: checks the minimum and the available balance, then reserves it. */
export function requestWithdrawal(db, email, { amountPaise, method, payout }, now = Date.now()) {
  email = norm(email);
  const s = settings(db);
  const prof = db.referralProfiles?.[email];
  if (!prof) return { ok: false, status: 400, message: 'You have no referral earnings yet.' };
  if (prof.suspended) return { ok: false, status: 403, message: 'Your referral account is suspended. Please contact support.' };
  const amount = Math.round(Number(amountPaise));
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, status: 400, message: 'Enter the amount to withdraw.' };
  if (amount < s.minWithdrawalPaise) return { ok: false, status: 400, message: `The minimum withdrawal is ₹${(s.minWithdrawalPaise / 100).toFixed(0)}.` };
  const bal = balances(db, email);
  if (amount > bal.available) return { ok: false, status: 400, message: `You can withdraw up to ₹${(bal.available / 100).toFixed(2)} right now.` };
  const clean = cleanPayout(method, payout);
  if (clean.error) return { ok: false, status: 400, message: clean.error };

  if (!db.withdrawalRequests) db.withdrawalRequests = [];
  const id = `wd_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
  // reserve in the same synchronous step that checked the balance, so two requests cannot both pass
  post(db, { id: `${id}:reserve-out`, email, bucket: 'available', delta: -amount, type: 'withdrawal.reserved', ref: id }, now);
  post(db, { id: `${id}:reserve-in`, email, bucket: 'reserved', delta: amount, type: 'withdrawal.reserved', ref: id }, now);
  const req = { id, email, amountPaise: amount, method, payout: clean.payout, status: 'pending_approval', createdAt: nowIso(now), history: [{ at: nowIso(now), status: 'pending_approval', by: email }] };
  db.withdrawalRequests.push(req);
  if (!db.payoutMethods) db.payoutMethods = {};
  db.payoutMethods[email] = { ...(db.payoutMethods[email] || {}), [method]: clean.payout, last: method };
  notify(db, email, 'withdrawal.submitted', 'Withdrawal requested', `We received your request for ₹${(amount / 100).toFixed(2)}. You will be paid within ${s.payoutSlaDays} days of approval.`, now);
  audit(db, email, 'withdrawal.request', id, `₹${(amount / 100).toFixed(2)} via ${method}`, now);
  return { ok: true, request: req };
}

const step = (w, status, by, now, note) => { w.status = status; (w.history ||= []).push({ at: nowIso(now), status, by, ...(note ? { note } : {}) }); };
const releaseReservation = (db, w, tag, now) => {
  post(db, { id: `${w.id}:${tag}-out`, email: w.email, bucket: 'reserved', delta: -w.amountPaise, type: 'withdrawal.released', ref: w.id }, now);
  post(db, { id: `${w.id}:${tag}-in`, email: w.email, bucket: 'available', delta: w.amountPaise, type: 'withdrawal.released', ref: w.id }, now);
};

/** Admin actions on a withdrawal. action: approve | reject | paid | failed | retry | release. */
export function actOnWithdrawal(db, id, action, { reason = '', utr = '', actor = 'admin' } = {}, now = Date.now()) {
  const w = (db.withdrawalRequests || []).find(x => x.id === id);
  if (!w) return { ok: false, status: 404, message: 'Withdrawal not found.' };
  const s = settings(db);
  const rupees = `₹${(w.amountPaise / 100).toFixed(2)}`;
  const open = ['approved', 'overdue'];
  switch (action) {
    case 'approve':
      if (w.status !== 'pending_approval') return { ok: false, status: 409, message: 'Only a pending request can be approved.' };
      w.approvedAt = nowIso(now);
      w.deadlineAt = nowIso(now + s.payoutSlaDays * DAY);
      step(w, 'approved', actor, now);
      notify(db, w.email, 'withdrawal.approved', 'Withdrawal approved', `Your withdrawal of ${rupees} was approved. Payment will reach you by ${new Date(w.deadlineAt).toLocaleDateString('en-IN')}.`, now);
      break;
    case 'reject':
      if (w.status !== 'pending_approval') return { ok: false, status: 409, message: 'Only a pending request can be rejected.' };
      releaseReservation(db, w, 'reject', now);
      w.rejectedReason = String(reason).slice(0, 300);
      step(w, 'rejected', actor, now, w.rejectedReason);
      notify(db, w.email, 'withdrawal.rejected', 'Withdrawal rejected', `Your withdrawal of ${rupees} was rejected${reason ? `: ${reason}` : '.'} The amount is back in your available balance.`, now);
      break;
    case 'paid': {
      if (!open.includes(w.status)) return { ok: false, status: 409, message: 'Approve the request before marking it paid.' };
      const ref = String(utr || '').trim();
      if (!/^[A-Za-z0-9-]{6,40}$/.test(ref)) return { ok: false, status: 400, message: 'Enter the UTR / transaction reference (6-40 letters or digits).' };
      post(db, { id: `${w.id}:paid-out`, email: w.email, bucket: 'reserved', delta: -w.amountPaise, type: 'withdrawal.paid', ref: w.id }, now);
      post(db, { id: `${w.id}:paid-in`, email: w.email, bucket: 'withdrawn', delta: w.amountPaise, type: 'withdrawal.paid', ref: w.id }, now);
      w.utr = ref;
      w.paidAt = nowIso(now);
      step(w, 'paid', actor, now, `UTR ${ref}`);
      notify(db, w.email, 'withdrawal.paid', 'Payment sent', `${rupees} was sent to you. Reference: ${ref}.`, now);
      break;
    }
    case 'failed':
      if (!open.includes(w.status)) return { ok: false, status: 409, message: 'Only an approved request can be marked failed.' };
      w.failedReason = String(reason).slice(0, 300);
      step(w, 'payment_failed', actor, now, w.failedReason);
      break;
    case 'retry':
      if (w.status !== 'payment_failed') return { ok: false, status: 409, message: 'Only a failed payment can be retried.' };
      w.deadlineAt = nowIso(now + s.payoutSlaDays * DAY);
      w.overdueAt = null;
      step(w, 'approved', actor, now, 'retry');
      break;
    case 'release':
      if (w.status !== 'payment_failed') return { ok: false, status: 409, message: 'Only a failed payment can be released back to the wallet.' };
      releaseReservation(db, w, 'release', now);
      step(w, 'released', actor, now, String(reason).slice(0, 300));
      notify(db, w.email, 'withdrawal.released', 'Withdrawal cancelled', `The payment of ${rupees} could not be completed, so the amount is back in your available balance.`, now);
      break;
    default:
      return { ok: false, status: 400, message: 'Unknown action.' };
  }
  audit(db, actor, `withdrawal.${action}`, w.id, [rupees, reason, utr].filter(Boolean).join(' · '), now);
  return { ok: true, request: w };
}

/** Flags approved withdrawals past their payment deadline (once each) and tells the admin. */
export function flagOverdue(db, now = Date.now()) {
  let flagged = 0;
  for (const w of db.withdrawalRequests || []) {
    if (w.status !== 'approved' || !w.deadlineAt || now <= Date.parse(w.deadlineAt)) continue;
    w.overdueAt = nowIso(now);
    step(w, 'overdue', 'system', now);
    flagged++;
    audit(db, 'system', 'withdrawal.overdue', w.id, `₹${(w.amountPaise / 100).toFixed(2)} deadline ${w.deadlineAt}`, now);
    notify(db, w.email, 'withdrawal.overdue', 'Payment delayed', 'Your approved withdrawal is taking longer than planned. Our team has been alerted.', now);
  }
  return flagged;
}

/** The scheduled job: release due commissions and flag overdue payouts. */
export function runJobs(db, now = Date.now()) {
  return { released: releaseDue(db, now), overdue: flagOverdue(db, now) };
}

/* ---------------------------------------------------------------- suspension */

export function setSuspended(db, email, suspended, reason, actor, now = Date.now()) {
  email = norm(email);
  const prof = db.referralProfiles?.[email];
  if (!prof) return { ok: false, reason: 'NOT_FOUND' };
  prof.suspended = !!suspended;
  prof.suspendedReason = suspended ? String(reason || '').slice(0, 300) : '';
  prof.suspendedAt = suspended ? nowIso(now) : null;
  audit(db, actor, suspended ? 'referrer.suspend' : 'referrer.unsuspend', email, reason, now);
  return { ok: true, profile: prof };
}

/* ---------------------------------------------------------------- views */

const maskName = (name, email) => {
  const first = String(name || email || '').split(/[\s@]/)[0] || 'Learner';
  return first.length <= 2 ? `${first[0]}•` : `${first.slice(0, 2)}${'•'.repeat(Math.min(4, first.length - 2))}`;
};

export function referrerStats(db, email) {
  email = norm(email);
  const prof = db.referralProfiles?.[email];
  const clicks = !prof ? 0 : prof.clicks ?? (db.referralClicks || []).filter(c => c.code === prof.code).length;
  const referees = Object.entries(db.referralAttributions || {}).filter(([, a]) => a.referrerEmail === email);
  const rewards = (db.referralRewards || []).filter(r => r.referrerEmail === email);
  const buyers = new Set(rewards.map(r => r.refereeEmail));
  return {
    clicks,
    registrations: referees.length,
    purchases: rewards.length,
    conversion: referees.length ? Math.round((buyers.size / referees.length) * 100) : 0,
    activeReferrals: referees.filter(([, a]) => Date.parse(a.expiresAt) > Date.now()).length
  };
}

/** Everything the learner's Refer & Earn page shows. */
export function learnerView(db, email, siteUrl) {
  email = norm(email);
  const s = settings(db);
  const prof = ensureProfile(db, email);
  const rewards = (db.referralRewards || []).filter(r => r.referrerEmail === email);
  const history = Object.entries(db.referralAttributions || {}).filter(([, a]) => a.referrerEmail === email).map(([e, a]) => {
    const mine = rewards.filter(r => r.refereeEmail === e);
    return {
      name: maskName(db.learners?.[e]?.name, e), date: a.attributedAt,
      purchases: mine.length, amountPaise: mine.reduce((n, r) => n + r.paidPaise, 0),
      commissionPaise: mine.reduce((n, r) => n + r.commissionPaise, 0),
      status: mine.length ? mine[mine.length - 1].status : 'registered'
    };
  }).sort((x, y) => String(y.date).localeCompare(String(x.date)));
  const tx = (db.referralLedger || []).filter(e => e.email === email).slice(-60).reverse();
  const withdrawals = (db.withdrawalRequests || []).filter(w => w.email === email).map(w => ({
    id: w.id, amountPaise: w.amountPaise, method: w.method, payout: maskPayout(w.method, w.payout), status: w.status,
    createdAt: w.createdAt, approvedAt: w.approvedAt || null, deadlineAt: w.deadlineAt || null, paidAt: w.paidAt || null, utr: w.utr || null,
    rejectedReason: w.rejectedReason || null
  })).reverse();
  const saved = db.payoutMethods?.[email] || {};
  return {
    code: prof.code, link: `${siteUrl}/ref/${prof.code}`, suspended: !!prof.suspended,
    stats: referrerStats(db, email), wallet: balances(db, email),
    rewards: rewards.map(r => ({ id: r.id, course: r.courseTitle, paidPaise: r.paidPaise, commissionPaise: r.commissionPaise, status: r.status, createdAt: r.createdAt, releaseAt: r.releaseAt })).reverse(),
    history, transactions: tx, withdrawals,
    savedPayout: { last: saved.last || 'upi', upi: saved.upi ? { upiId: saved.upi.upiId } : null, bank: saved.bank ? { holder: saved.bank.holder, bank: saved.bank.bank, ifsc: saved.bank.ifsc } : null },
    notifications: (db.notifications?.[email] || []).slice(0, 30),
    rules: { discountPct: s.discountPct, commissionPct: s.commissionPct, releaseDays: s.releaseDays, minWithdrawalPaise: s.minWithdrawalPaise, attributionDays: s.attributionDays, payoutSlaDays: s.payoutSlaDays, enabled: s.enabled },
    promoOptOut: !!db.learners?.[email]?.promoOptOut,
    leaderboard: leaderboard(db)
  };
}

/** Top referrers by released (verified) earnings, names masked. */
export function leaderboard(db, n = 5) {
  const totals = {};
  for (const r of db.referralRewards || []) if (r.status === 'available') totals[r.referrerEmail] = (totals[r.referrerEmail] || 0) + r.commissionPaise;
  return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([e, paise], i) => ({ rank: i + 1, name: maskName(db.learners?.[e]?.name, e), earnedPaise: paise }));
}

export function adminOverview(db) {
  const rewards = db.referralRewards || [];
  const sum = (arr) => arr.reduce((n, r) => n + r.commissionPaise, 0);
  const wds = db.withdrawalRequests || [];
  return {
    referrers: Object.keys(db.referralProfiles || {}).length,
    clicks: db.referralClickTotal ?? (db.referralClicks || []).length,
    registrations: Object.keys(db.referralAttributions || {}).length,
    purchases: rewards.length,
    totalCommissionPaise: sum(rewards.filter(r => ['pending', 'available'].includes(r.status))),
    pendingCommissionPaise: sum(rewards.filter(r => r.status === 'pending')),
    availableCommissionPaise: sum(rewards.filter(r => r.status === 'available')),
    withdrawnPaise: wds.filter(w => w.status === 'paid').reduce((n, w) => n + w.amountPaise, 0),
    pendingWithdrawals: wds.filter(w => w.status === 'pending_approval').length,
    overdueWithdrawals: wds.filter(w => w.status === 'overdue').length
  };
}

export function adminReferrers(db, q = '') {
  q = norm(q);
  return Object.entries(db.referralProfiles || {}).map(([email, p]) => ({
    email, name: db.learners?.[email]?.name || '', code: p.code, suspended: !!p.suspended, createdAt: p.createdAt,
    ...referrerStats(db, email), wallet: balances(db, email)
  })).filter(r => !q || r.email.includes(q) || norm(r.name).includes(q) || norm(r.code).includes(q))
    .sort((a, b) => b.wallet.lifetime - a.wallet.lifetime);
}

/* ---------------------------------------------------------------- CSV */

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // keep spreadsheet formulas from running
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export const toCsv = (rows, cols) => [cols.map(c => c[0]).join(','), ...rows.map(r => cols.map(([, f]) => csvCell(f(r))).join(','))].join('\r\n');
