import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

// Signs admin and learner sessions. Set JWT_SECRET in .env so sessions survive restarts; without it a
// random secret is used for this run only (never a fixed value, since the source code is public).
export const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('[auth] JWT_SECRET is not set - using a temporary secret; everyone is signed out when the server restarts.');
}

// Anyone without a valid admin session gets the same answer as for a route that does not exist, so
// the admin API cannot be discovered.
const notFound = (res) => res.status(404).json({ success: false, message: 'API Endpoint Not Found' });

/** The admin session in the request, or null. */
export function readAdminSession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') return null;
    if (getDb().admin?.adminId !== decoded.adminId) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyAdminToken(req, res, next) {
  const session = readAdminSession(req);
  if (!session) return notFound(res);
  req.admin = session;
  next();
}

/** Mounted on /api/admin: every admin route answers 404 unless the caller has an admin session. */
export const adminGate = verifyAdminToken;
