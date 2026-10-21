import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'arshith_bootcamp_admin_secret_key_2026_super_secure';

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
