// CodeLekho Campus Rewards: partner colleges and college voucher codes.
//
// The admin adds a college and creates a campaign for it. Each campaign gets its own unique voucher
// code (e.g. ABC-K8P92X) that the college shares with its students. A learner enters the code at
// checkout and the server gives the campaign's discount. Codes work only for their own campaign, and
// every limit (dates, eligible items, minimum purchase, maximum discount, total redemptions, uses per
// learner) is checked on the server.
//
// Collections (in the existing app database, so stored in Supabase like everything else):
//   colleges            [{ id, name, code, domains[], logo, address, city, state, country, description, status, createdAt, updatedAt }]
//   campusCampaigns     [{ id, collegeId, name, voucherCode, discountPct, startsAt, endsAt, eligibleCourseIds, eligibleKinds, minPurchasePaise, maxDiscountPaise, maxRedemptions, perStudentLimit, status, serial, createdAt, updatedAt }]
//   campusReservations  [{ campaignId, email, orderId, until }]   (a code held by an open payment)
//   voucherRedemptions  [{ id, campaignId, code, email, collegeId, orderId, item, originalPaise, discountPaise, finalPaise, at }]
//   campusAudit         [{ id, at, actor, action, target, details }]
//   campusValidateFails { [learnerEmail]: [timestamps] }      (brute-force protection)
import crypto from 'crypto';

const nowIso = (t = Date.now()) => new Date(t).toISOString();
const norm = (v) => String(v || '').trim().toLowerCase();
const rid = (p) => `${p}_${crypto.randomBytes(8).toString('hex')}`;
const text = (v, max) => String(v ?? '').trim().slice(0, max);

export const RESERVE_MS = 30 * 60 * 1000;
export const VALIDATE_FAILS_PER_HOUR = 10;
export const CODE_RE = /^[A-Z0-9]{3}-[A-Z0-9]{6}$/;

/* ---------------------------------------------------------------- audit */

export function audit(db, actor, action, target, details = '', now = Date.now()) {
  if (!db.campusAudit) db.campusAudit = [];
  db.campusAudit.push({ id: rid('ca'), at: nowIso(now), actor: actor || 'system', action, target: String(target || ''), details: String(details || '') });
  if (db.campusAudit.length > 20000) db.campusAudit.splice(0, db.campusAudit.length - 20000);
}

/* ---------------------------------------------------------------- colleges */

const COLLEGE_CODE_RE = /^[A-Z0-9]{3,12}$/;
const DOMAIN_RE = /^(?=.{3,120}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/** Validates college input. Returns { ok, college } or { ok: false, errors }. */
export function cleanCollege(input, existing = null) {
  const errors = {};
  const name = text(input.name ?? existing?.name, 160);
  if (name.length < 3) errors.name = 'Enter the college name.';
  const code = text(input.code ?? existing?.code, 12).toUpperCase();
  if (!COLLEGE_CODE_RE.test(code)) errors.code = 'The code must be 3-12 letters or digits, e.g. ABC001.';
  const rawDomains = input.domains ?? existing?.domains ?? [];
  const domains = [...new Set((Array.isArray(rawDomains) ? rawDomains : String(rawDomains).split(/[\s,]+/)).map(d => norm(d).replace(/^@/, '')).filter(Boolean))];
  if (domains.some(d => !DOMAIN_RE.test(d))) errors.domains = 'Each domain must look like abc.edu.in (no @, no spaces).';
  let logo = input.logo === undefined ? (existing?.logo || '') : String(input.logo || '');
  if (logo && (!LOGO_RE.test(logo) || logo.length > 400000)) errors.logo = 'The logo must be a PNG, JPG or WebP image under 300 KB.';
  const college = {
    name, code, domains, logo,
    address: text(input.address ?? existing?.address, 240),
    city: text(input.city ?? existing?.city, 80),
    state: text(input.state ?? existing?.state, 80),
    country: text(input.country ?? existing?.country ?? 'India', 80) || 'India',
    description: text(input.description ?? existing?.description, 600),
    status: (input.status ?? existing?.status ?? 'active') === 'inactive' ? 'inactive' : 'active'
  };
  if (!college.city) errors.city = 'Enter the city.';
  if (!college.state) errors.state = 'Enter the state.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, college };
}

export function addCollege(db, input, actor, now = Date.now()) {
  const r = cleanCollege(input);
  if (!r.ok) return r;
  if (!db.colleges) db.colleges = [];
  if (db.colleges.some(c => c.code === r.college.code)) return { ok: false, errors: { code: 'This college code is already used.' } };
  const college = { id: rid('col'), ...r.college, createdAt: nowIso(now), updatedAt: nowIso(now) };
  db.colleges.push(college);
  audit(db, actor, 'college.create', college.id, `${college.name} (${college.code})`, now);
  return { ok: true, college };
}

export function updateCollege(db, id, input, actor, now = Date.now()) {
  const college = (db.colleges || []).find(c => c.id === id);
  if (!college) return { ok: false, status: 404, errors: { _: 'College not found.' } };
  const r = cleanCollege(input, college);
  if (!r.ok) return r;
  if (db.colleges.some(c => c.id !== id && c.code === r.college.code)) return { ok: false, errors: { code: 'This college code is already used.' } };
  const before = college.status;
  Object.assign(college, r.college, { updatedAt: nowIso(now) });
  audit(db, actor, 'college.update', id, before !== college.status ? `status ${before} -> ${college.status}` : 'details updated', now);
  return { ok: true, college };
}

/* ---------------------------------------------------------------- campaigns + their voucher codes */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
/** A new unique voucher code for a college, e.g. ABC-K8P92X (cryptographically random). */
export function newVoucherCode(db, college) {
  const prefix = (college.code.replace(/[^A-Z]/g, '').slice(0, 3) || college.code.slice(0, 3)).padEnd(3, 'X');
  for (;;) {
    let body = '';
    for (let i = 0; i < 6; i++) body += ALPHABET[crypto.randomInt(ALPHABET.length)];
    const code = `${prefix}-${body}`;
    if (!(db.campusCampaigns || []).some(c => c.voucherCode === code || (c.oldCodes || []).includes(code))) return code;
  }
}

/** Validates a campaign. Returns { ok, campaign } or { ok: false, errors }. */
export function cleanCampaign(db, input, existing = null) {
  const errors = {};
  const collegeId = String(input.collegeId ?? existing?.collegeId ?? '');
  if (!(db.colleges || []).some(c => c.id === collegeId)) errors.collegeId = 'Choose a college.';
  const name = text(input.name ?? existing?.name, 120);
  if (name.length < 3) errors.name = 'Enter a campaign name.';
  const pct = Number(input.discountPct ?? existing?.discountPct);
  if (!Number.isInteger(pct) || pct < 1 || pct > 90) errors.discountPct = 'Discount must be a whole number from 1 to 90%.';
  const startsAt = new Date(input.startsAt ?? existing?.startsAt);
  const endsAt = new Date(input.endsAt ?? existing?.endsAt);
  if (Number.isNaN(startsAt.getTime())) errors.startsAt = 'Choose a start date.';
  if (Number.isNaN(endsAt.getTime())) errors.endsAt = 'Choose an end date.';
  else if (!errors.startsAt && endsAt <= startsAt) errors.endsAt = 'The end date must be after the start date.';
  const paise = (v, field, label) => {
    const n = Math.round(Number(v ?? 0) * 100);
    if (!Number.isFinite(n) || n < 0 || n > 10000000) { errors[field] = `${label} must be between ₹0 and ₹1,00,000.`; return 0; }
    return n;
  };
  const minPurchasePaise = input.minPurchase !== undefined ? paise(input.minPurchase, 'minPurchase', 'Minimum purchase') : (existing?.minPurchasePaise || 0);
  const maxDiscountPaise = input.maxDiscount !== undefined ? paise(input.maxDiscount, 'maxDiscount', 'Maximum discount') : (existing?.maxDiscountPaise || 0);
  const int = (v, field, label, min, max) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < min || n > max) { errors[field] = `${label} must be a whole number from ${min} to ${max}.`; return min; }
    return n;
  };
  const maxRedemptions = int(input.maxRedemptions ?? existing?.maxRedemptions ?? 0, 'maxRedemptions', 'Total redemptions (0 = no limit)', 0, 1000000);
  const perStudentLimit = int(input.perStudentLimit ?? existing?.perStudentLimit ?? 1, 'perStudentLimit', 'Uses per student', 1, 10);
  const courseIds = new Set((db.courses || []).map(c => c.id));
  let eligibleCourseIds = input.eligibleCourseIds ?? existing?.eligibleCourseIds ?? 'all';
  if (eligibleCourseIds !== 'all') {
    eligibleCourseIds = [...new Set((Array.isArray(eligibleCourseIds) ? eligibleCourseIds : []).map(String))];
    if (eligibleCourseIds.some(id => !courseIds.has(id))) errors.eligibleCourseIds = 'Unknown course selected.';
  }
  let eligibleKinds = input.eligibleKinds ?? existing?.eligibleKinds ?? ['course'];
  eligibleKinds = [...new Set((Array.isArray(eligibleKinds) ? eligibleKinds : []).filter(k => k === 'course' || k === 'interview'))];
  if (!eligibleKinds.length) errors.eligibleKinds = 'Choose courses, Interview Prep or both.';
  if (eligibleCourseIds !== 'all' && !eligibleCourseIds.length && eligibleKinds.includes('course')) errors.eligibleCourseIds = 'Choose at least one course or "all courses".';
  const status = ['active', 'paused', 'ended'].includes(input.status ?? existing?.status) ? (input.status ?? existing?.status) : 'active';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, campaign: { collegeId, name, discountPct: pct, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), minPurchasePaise, maxDiscountPaise, maxRedemptions, perStudentLimit, eligibleCourseIds, eligibleKinds, status } };
}

export function addCampaign(db, input, actor, now = Date.now()) {
  const r = cleanCampaign(db, input);
  if (!r.ok) return r;
  if (!db.campusCampaigns) db.campusCampaigns = [];
  const college = db.colleges.find(c => c.id === r.campaign.collegeId);
  const serial = String(db.campusCampaigns.length + 1).padStart(4, '0');
  const campaign = { id: rid('cmp'), ...r.campaign, voucherCode: newVoucherCode(db, college), oldCodes: [], serial, createdAt: nowIso(now), updatedAt: nowIso(now) };
  db.campusCampaigns.push(campaign);
  audit(db, actor, 'campaign.create', campaign.voucherCode, `${campaign.name}: ${campaign.discountPct}% for ${college.name}`, now);
  return { ok: true, campaign };
}

export function updateCampaign(db, id, input, actor, now = Date.now()) {
  const campaign = (db.campusCampaigns || []).find(c => c.id === id);
  if (!campaign) return { ok: false, status: 404, errors: { _: 'Campaign not found.' } };
  const r = cleanCampaign(db, { ...input, collegeId: campaign.collegeId }, campaign);
  if (!r.ok) return r;
  Object.assign(campaign, r.campaign, { updatedAt: nowIso(now) });
  audit(db, actor, 'campaign.update', campaign.voucherCode, `${campaign.name}: ${campaign.status}, ${campaign.discountPct}%`, now);
  return { ok: true, campaign };
}

/** A new code for a campaign (if the old one leaked). The old code stops working at once. */
export function regenerateCode(db, id, actor, now = Date.now()) {
  const campaign = (db.campusCampaigns || []).find(c => c.id === id);
  if (!campaign) return { ok: false, status: 404, message: 'Campaign not found.' };
  const college = db.colleges.find(c => c.id === campaign.collegeId);
  const old = campaign.voucherCode;
  campaign.oldCodes = [...(campaign.oldCodes || []), old];
  campaign.voucherCode = newVoucherCode(db, college);
  campaign.updatedAt = nowIso(now);
  audit(db, actor, 'campaign.new_code', campaign.voucherCode, `replaced ${old}`, now);
  return { ok: true, campaign };
}

const campaignLive = (c, now) => c.status === 'active' && Date.parse(c.startsAt) <= now && now < Date.parse(c.endsAt);

/* ---------------------------------------------------------------- checkout */

/** Gives back codes held by payments that never finished. */
export function sweep(db, now = Date.now()) {
  const before = (db.campusReservations || []).length;
  db.campusReservations = (db.campusReservations || []).filter(r => {
    if (now <= r.until) return true;
    return (db.payments || []).some(p => p.orderId === r.orderId && p.status === 'paid'); // paid ones are cleared at redemption
  });
  return before - db.campusReservations.length;
}

function priceWith(c, item, originalPaise) {
  if (!c.eligibleKinds.includes(item.kind)) return { ok: false, reason: 'NOT_ELIGIBLE', message: item.kind === 'interview' ? 'This voucher is for courses only.' : 'This voucher is for Interview Prep only.' };
  if (item.kind === 'course' && c.eligibleCourseIds !== 'all' && !c.eligibleCourseIds.includes(item.courseId)) return { ok: false, reason: 'NOT_ELIGIBLE', message: 'This voucher does not cover this course.' };
  if (originalPaise < c.minPurchasePaise) return { ok: false, reason: 'MIN_PURCHASE', message: `This voucher needs a purchase of at least ₹${(c.minPurchasePaise / 100).toLocaleString('en-IN')}.` };
  let discountPaise = Math.floor((originalPaise * c.discountPct) / 100);
  if (c.maxDiscountPaise > 0) discountPaise = Math.min(discountPaise, c.maxDiscountPaise);
  discountPaise = Math.max(0, Math.min(discountPaise, originalPaise - 100)); // always at least ₹1 to pay
  return { ok: true, discountPaise, finalPaise: originalPaise - discountPaise };
}

const recentFails = (db, email, now) => (db.campusValidateFails?.[email] || []).filter(t => now - t < 60 * 60 * 1000);

/**
 * Checks a college voucher code for this learner and item. Returns
 * { ok, campaign, college, quote } or { ok: false, status, code, message, recordFail }.
 */
export function check(db, email, code, item, originalPaise, now = Date.now(), { forOrderId = null } = {}) {
  email = norm(email);
  sweep(db, now);
  if (recentFails(db, email, now).length >= VALIDATE_FAILS_PER_HOUR) return { ok: false, status: 429, code: 'TOO_MANY', message: 'Too many voucher attempts. Please try again in an hour.' };
  const c = String(code || '').trim().toUpperCase();
  const campaign = CODE_RE.test(c) ? (db.campusCampaigns || []).find(x => x.voucherCode === c) : null;
  if (!campaign) return { ok: false, status: 404, code: 'NOT_FOUND', message: 'This voucher code is not valid.', recordFail: true };
  const college = (db.colleges || []).find(x => x.id === campaign.collegeId);
  if (!college || college.status !== 'active') return { ok: false, status: 409, code: 'COLLEGE_INACTIVE', message: 'This college voucher is paused.' };
  if (campaign.status === 'paused') return { ok: false, status: 409, code: 'CAMPAIGN_OFF', message: 'This voucher is paused.' };
  if (now < Date.parse(campaign.startsAt)) return { ok: false, status: 409, code: 'NOT_STARTED', message: `This voucher starts on ${new Date(campaign.startsAt).toLocaleDateString('en-IN')}.` };
  if (campaign.status === 'ended' || now >= Date.parse(campaign.endsAt)) return { ok: false, status: 409, code: 'EXPIRED', message: 'This voucher has expired.' };
  const held = (db.campusReservations || []).filter(r => r.campaignId === campaign.id && r.orderId !== forOrderId);
  const used = (db.voucherRedemptions || []).filter(r => r.campaignId === campaign.id);
  if (campaign.maxRedemptions > 0 && used.length + held.length >= campaign.maxRedemptions) return { ok: false, status: 409, code: 'CAMPAIGN_FULL', message: 'This voucher has reached its limit.' };
  const mine = used.filter(r => r.email === email).length + held.filter(r => r.email === email).length;
  if (mine >= campaign.perStudentLimit) {
    return held.some(r => r.email === email)
      ? { ok: false, status: 409, code: 'IN_USE', message: 'You are already using this voucher in another payment. Finish it, or try again in 30 minutes.' }
      : { ok: false, status: 409, code: 'REDEEMED', message: campaign.perStudentLimit === 1 ? 'You have already used this voucher.' : `You have used this voucher ${campaign.perStudentLimit} times already.` };
  }
  const p = priceWith(campaign, item, originalPaise);
  if (!p.ok) return { ok: false, status: 409, code: p.reason, message: p.message };
  return { ok: true, campaign, college, quote: { originalPaise, discountPaise: p.discountPaise, finalPaise: p.finalPaise, voucher: { code: campaign.voucherCode, discountPct: campaign.discountPct, college: college.name } } };
}

/** check() plus brute-force bookkeeping; use for anything a learner types. */
export function validate(db, email, code, item, originalPaise, now = Date.now()) {
  const r = check(db, email, code, item, originalPaise, now);
  if (!r.ok && r.recordFail) {
    const e = norm(email);
    if (!db.campusValidateFails) db.campusValidateFails = {};
    db.campusValidateFails[e] = [...recentFails(db, e, now), now];
  }
  return r;
}

/** Holds one use of the code for this payment (call synchronously right before creating the order). */
export function reserve(db, campaign, email, orderId, now = Date.now()) {
  if (!db.campusReservations) db.campusReservations = [];
  db.campusReservations.push({ campaignId: campaign.id, email: norm(email), orderId, until: now + RESERVE_MS });
}

/** The payment could not be created or was not completed: give the use back. */
export function releaseForOrder(db, orderId) {
  const before = (db.campusReservations || []).length;
  db.campusReservations = (db.campusReservations || []).filter(r => r.orderId !== orderId);
  return before !== db.campusReservations.length;
}

/** The payment is confirmed: record the redemption (once per order). */
export function onOrderPaid(db, order, now = Date.now()) {
  if (!order.voucher?.campaignId) return false;
  releaseForOrder(db, order.orderId);
  if (!db.voucherRedemptions) db.voucherRedemptions = [];
  if (db.voucherRedemptions.some(r => r.orderId === order.orderId)) return false;
  const campaign = (db.campusCampaigns || []).find(c => c.id === order.voucher.campaignId);
  db.voucherRedemptions.push({ id: rid('rdm'), campaignId: order.voucher.campaignId, code: order.voucher.code, email: order.email, collegeId: campaign?.collegeId || '', orderId: order.orderId, item: order.courseTitle, originalPaise: order.originalAmount, discountPaise: order.discountAmount, finalPaise: order.amount, at: nowIso(now) });
  audit(db, 'system', 'voucher.redeem', order.voucher.code, `${order.email} · ${order.orderId} · ₹${(order.discountAmount / 100).toFixed(2)} off`, now);
  return true;
}

/* ---------------------------------------------------------------- admin views */

export function campaignView(db, c, now = Date.now()) {
  const college = (db.colleges || []).find(x => x.id === c.collegeId);
  const reds = (db.voucherRedemptions || []).filter(r => r.campaignId === c.id);
  const state = c.status !== 'active' ? c.status : now < Date.parse(c.startsAt) ? 'scheduled' : now >= Date.parse(c.endsAt) ? 'expired' : 'live';
  return {
    ...c, state,
    college: college ? { id: college.id, name: college.name, code: college.code, logo: college.logo || '' } : null,
    redeemed: reds.length, students: new Set(reds.map(r => r.email)).size,
    discountPaise: reds.reduce((n, r) => n + (r.discountPaise || 0), 0), revenuePaise: reds.reduce((n, r) => n + (r.finalPaise || 0), 0),
    inProgress: (db.campusReservations || []).filter(r => r.campaignId === c.id && now <= r.until).length
  };
}

export function analytics(db, now = Date.now()) {
  const reds = db.voucherRedemptions || [];
  const camps = db.campusCampaigns || [];
  return {
    colleges: (db.colleges || []).length, activeColleges: (db.colleges || []).filter(c => c.status === 'active').length,
    campaigns: camps.length, liveCampaigns: camps.filter(c => campaignLive(c, now)).length,
    redeemed: reds.length, students: new Set(reds.map(r => r.email)).size,
    discountPaise: reds.reduce((n, r) => n + (r.discountPaise || 0), 0), revenuePaise: reds.reduce((n, r) => n + (r.finalPaise || 0), 0),
    byCollege: (db.colleges || []).map(c => {
      const rs = reds.filter(r => r.collegeId === c.id);
      return {
        id: c.id, name: c.name, code: c.code, status: c.status, logo: c.logo || '',
        campaigns: camps.filter(x => x.collegeId === c.id).length, live: camps.filter(x => x.collegeId === c.id && campaignLive(x, now)).length,
        redeemed: rs.length, students: new Set(rs.map(r => r.email)).size,
        discountPaise: rs.reduce((n, r) => n + (r.discountPaise || 0), 0), revenuePaise: rs.reduce((n, r) => n + (r.finalPaise || 0), 0)
      };
    })
  };
}
