import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.js';
import { getDb } from '../db.js';

// Learner sessions. Before this, any caller could submit quizzes, start the final, read progress or
// claim a certificate for any email simply by passing `userId`. Now those endpoints require a signed
// learner token whose subject must match the userId in the request.

const LEARNER_TOKEN_TTL = '14d';
const normId = (id) => String(id || '').trim().toLowerCase();

export function signLearnerToken(email) {
  return jwt.sign({ sub: normId(email), role: 'learner' }, JWT_SECRET, { expiresIn: LEARNER_TOKEN_TTL });
}

/** Returns the learner email from a valid token, or null. */
export function learnerFromRequest(req) {
  const token = req.headers['x-learner-token'];
  if (!token) return null;
  try {
    const decoded = jwt.verify(String(token), JWT_SECRET);
    if (decoded?.role !== 'learner' || !decoded.sub) return null;
    // Tokens issued before a password change are no longer valid.
    const changedAt = getDb().learners?.[decoded.sub]?.passwordChangedAt;
    if (changedAt && decoded.iat * 1000 < new Date(changedAt).getTime() - 1000) return null;
    return decoded.sub;
  } catch {
    return null;
  }
}

function isAdminRequest(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return false;
  try { return jwt.verify(h.slice(7), JWT_SECRET)?.role === 'admin'; } catch { return false; }
}

// Endpoints that read or change one learner's own records.
const PROTECTED = [
  ['POST', /^\/quizzes\/module\/[^/]+\/submit$/],
  ['GET', /^\/quizzes\/module\/[^/]+\/attempts$/],
  ['POST', /^\/final-test\/(start|submit)$/],
  ['GET', /^\/final-test\/attempts$/],
  ['GET', /^\/progress\/[^/]+$/],
  ['GET', /^\/enrollment$/],
  ['POST', /^\/enrollment$/],
  ['POST', /^\/payments\/(order|verify)$/],
  ['POST', /^\/certificates\/issue$/],
  ['GET', /^\/practice\/progress$/],
  ['POST', /^\/projects\/submit$/],
  ['GET', /^\/projects\/mine$/],
  ['GET', /^\/interview\/progress$/],
  ['POST', /^\/interview\/solved$/],
  ['POST', /^\/activity$/],
  ['GET', /^\/activity\/streak$/]
];

/** Mounted at /api. Lets admins through, otherwise requires a learner token matching userId. */
export function learnerGuard(req, res, next) {
  const rule = PROTECTED.find(([method, re]) => method === req.method && re.test(req.path));
  if (!rule) return next();

  // A learner session always wins, even when the same browser also holds an admin session; admins
  // without a learner session pass through and name the learner in the request themselves.
  const email = learnerFromRequest(req);
  if (!email && isAdminRequest(req)) return next();
  if (!email) {
    return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Your session has expired. Please sign in again.' });
  }
  const claimed = normId(req.method === 'GET' ? req.query.userId : req.body?.userId);
  if (claimed && claimed !== email) {
    return res.status(403).json({ success: false, message: 'You can only access your own learning records.' });
  }
  // Fill in the userId from the token so handlers always act on the signed-in learner.
  // (Express 5 re-parses req.query on every access, so replace the property rather than mutate it.)
  if (req.method === 'GET') Object.defineProperty(req, 'query', { value: { ...req.query, userId: email }, configurable: true, enumerable: true });
  else req.body = { ...(req.body || {}), userId: email };
  req.learnerEmail = email;
  next();
}
