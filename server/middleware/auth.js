import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

// Signs admin and learner sessions. Set JWT_SECRET in .env so sessions survive restarts; without it a
// random secret is used for this run only (never a fixed value, since the source code is public).
export const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('[auth] JWT_SECRET is not set - using a temporary secret; everyone is signed out when the server restarts.');
}

export function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access Denied. No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
    }

    const db = getDb();
    if (db.admin.adminId !== decoded.adminId) {
      return res.status(403).json({ success: false, message: 'Forbidden. Invalid administrator account.' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
}
