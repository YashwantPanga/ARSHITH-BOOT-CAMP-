import express from 'express';
import { getDb, saveDb, readDb } from '../db.js';
import { priceFor } from '../lib/enrollment.js';
import { interviewPrice } from '../lib/interviewAccess.js';
import * as C from '../lib/campus.js';

// Campus Rewards API. /api/admin/* is behind adminGate, so only a signed-in admin reaches the admin
// routes. Learners only ever type a college voucher code at checkout (see paymentRoutes.js).
const router = express.Router();
const adminName = (req) => req.admin?.email || req.admin?.adminId || 'admin';
const fail = (res, r) => res.status(r.status || 400).json({ success: false, message: r.message || Object.values(r.errors || {})[0] || 'Please check the details.', errors: r.errors, code: r.code });

/* ------------------------------------------------------------------ learner: check a code */

router.post('/campus/vouchers/validate', (req, res) => {
  if (!req.learnerEmail) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in.' });
  const db = getDb();
  const body = req.body || {};
  let item;
  if (body.product === 'interview') item = { kind: 'interview', courseId: 'interview-prep', pricePaise: interviewPrice() * 100, title: 'Interview Prep' };
  else {
    const course = (db.courses || []).find(c => c.id === body.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    item = { kind: 'course', courseId: course.id, pricePaise: priceFor(course.id) * 100, title: course.title };
  }
  const r = C.validate(db, req.learnerEmail, body.code, item, item.pricePaise);
  saveDb(db);
  if (!r.ok) return fail(res, r);
  res.json({ success: true, title: item.title, ...r.quote });
});

/* ------------------------------------------------------------------ admin */

router.get('/admin/campus/overview', (req, res) => {
  res.json({ success: true, analytics: C.analytics(readDb()) });
});

router.get('/admin/campus/colleges', (req, res) => {
  const db = readDb();
  const stats = C.analytics(db).byCollege;
  res.json({ success: true, colleges: (db.colleges || []).map(c => ({ ...c, stats: stats.find(s => s.id === c.id) })) });
});

router.post('/admin/campus/colleges', (req, res) => {
  const db = getDb();
  const r = C.addCollege(db, req.body || {}, adminName(req));
  if (!r.ok) return fail(res, r);
  saveDb(db);
  res.status(201).json({ success: true, college: r.college });
});

router.put('/admin/campus/colleges/:id', (req, res) => {
  const db = getDb();
  const r = C.updateCollege(db, req.params.id, req.body || {}, adminName(req));
  if (!r.ok) return fail(res, r);
  saveDb(db);
  res.json({ success: true, college: r.college });
});

router.get('/admin/campus/campaigns', (req, res) => {
  const db = readDb();
  const list = (db.campusCampaigns || []).filter(c => !req.query.collegeId || c.collegeId === req.query.collegeId).map(c => C.campaignView(db, c)).reverse();
  res.json({ success: true, campaigns: list });
});

router.post('/admin/campus/campaigns', (req, res) => {
  const db = getDb();
  const r = C.addCampaign(db, req.body || {}, adminName(req));
  if (!r.ok) return fail(res, r);
  saveDb(db);
  res.status(201).json({ success: true, campaign: C.campaignView(db, r.campaign) });
});

router.put('/admin/campus/campaigns/:id', (req, res) => {
  const db = getDb();
  const r = C.updateCampaign(db, req.params.id, req.body || {}, adminName(req));
  if (!r.ok) return fail(res, r);
  saveDb(db);
  res.json({ success: true, campaign: C.campaignView(db, r.campaign) });
});

router.post('/admin/campus/campaigns/:id/new-code', (req, res) => {
  const db = getDb();
  const r = C.regenerateCode(db, req.params.id, adminName(req));
  if (!r.ok) return fail(res, r);
  saveDb(db);
  res.json({ success: true, campaign: C.campaignView(db, r.campaign) });
});

router.get('/admin/campus/redemptions', (req, res) => {
  const db = readDb();
  const list = (db.voucherRedemptions || []).filter(r => !req.query.collegeId || r.collegeId === req.query.collegeId)
    .map(r => ({ ...r, college: (db.colleges || []).find(c => c.id === r.collegeId)?.name || '', learner: db.learners?.[r.email]?.name || '' })).reverse();
  res.json({ success: true, redemptions: list });
});

router.get('/admin/campus/analytics', (req, res) => {
  res.json({ success: true, analytics: C.analytics(readDb()) });
});

router.get('/admin/campus/audit', (req, res) => {
  res.json({ success: true, audit: (readDb().campusAudit || []).slice(-500).reverse() });
});

export default router;
