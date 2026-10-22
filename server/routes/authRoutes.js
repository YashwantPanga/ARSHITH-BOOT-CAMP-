import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Track failed login attempts for basic rate limiting / brute force protection
const loginAttempts = new Map();
const KNOWN_DEFAULT_PASSWORDS = ['admin123', 'Admin@2026'];

router.post('/admin/login', (req, res) => {
  const { adminId, password } = req.body;

  if (!adminId || !password) {
    return res.status(400).json({ success: false, message: 'Invalid admin email/ID or password' });
  }

  const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const attempts = loginAttempts.get(clientIp) || { count: 0, lockUntil: 0 };

  if (Date.now() < attempts.lockUntil) {
    const remainingSec = Math.ceil((attempts.lockUntil - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Please wait ${remainingSec} seconds.`
    });
  }

  const db = getDb();
  const admin = db.admin;

  // Check admin ID or email match
  const rawId = String(adminId).trim().toLowerCase();
  const isIdValid = admin && (
    String(admin.adminId || '').trim().toLowerCase() === rawId ||
    String(admin.email || '').trim().toLowerCase() === rawId
  );

  // The old built-in demo passwords are published in the source code, so they never sign in,
  // even if the stored hash still matches one of them. Set ADMIN_PASSWORD in .env instead.
  if (isIdValid && KNOWN_DEFAULT_PASSWORDS.includes(password)) {
    return res.status(403).json({
      success: false,
      code: 'DEFAULT_PASSWORD_DISABLED',
      message: 'The default admin password has been disabled. Set ADMIN_EMAIL and ADMIN_PASSWORD in the server .env file and restart the server.'
    });
  }

  // Check password match against the stored bcrypt hash
  let isPasswordValid = false;
  if (isIdValid && admin.passwordHash) {
    try {
      isPasswordValid = bcrypt.compareSync(password, admin.passwordHash);
    } catch {
      isPasswordValid = false;
    }
  }

  if (!isIdValid || !isPasswordValid) {
    attempts.count += 1;
    if (attempts.count >= 5) {
      attempts.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout after 5 fails
    }
    loginAttempts.set(clientIp, attempts);

    return res.status(401).json({
      success: false,
      message: 'Invalid Admin ID or Password'
    });
  }

  // Reset failed attempts on success
  loginAttempts.delete(clientIp);

  // Update last login
  admin.lastLogin = new Date().toISOString();
  saveDb(db);

  // Log activity
  logActivity({
    adminId: admin.adminId,
    action: 'ADMIN_LOGIN',
    target: 'Admin Portal',
    details: 'Successful administrator login',
    ipAddress: clientIp,
    device: req.headers['user-agent'] || 'Browser'
  });

  // Generate JWT token (expires in 24 hours)
  const token = jwt.sign(
    { adminId: admin.adminId, role: admin.role, name: admin.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    success: true,
    message: 'Admin login successful',
    token,
    admin: {
      adminId: admin.adminId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin
    }
  });
});

router.get('/admin/me', verifyAdminToken, (req, res) => {
  const db = getDb();
  const admin = db.admin;
  return res.json({
    success: true,
    admin: {
      adminId: admin.adminId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin
    }
  });
});

router.post('/admin/change-password', verifyAdminToken, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All password fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
  }

  // Password requirements: Min 8 chars, uppercase, lowercase, number, special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.'
    });
  }

  if (KNOWN_DEFAULT_PASSWORDS.includes(newPassword)) {
    return res.status(400).json({ success: false, message: 'That password is published in the source code. Choose a different one.' });
  }

  const db = getDb();
  const admin = db.admin;

  if (!bcrypt.compareSync(currentPassword, admin.passwordHash)) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  saveDb(db);

  logActivity({
    adminId: admin.adminId,
    action: 'CHANGE_PASSWORD',
    target: 'Admin Account',
    details: 'Administrator password changed successfully',
    ipAddress: req.ip || '127.0.0.1',
    device: req.headers['user-agent'] || 'Browser'
  });

  return res.json({ success: true, message: 'Password updated successfully.' });
});

router.post('/admin/logout', verifyAdminToken, (req, res) => {
  logActivity({
    adminId: req.admin.adminId,
    action: 'ADMIN_LOGOUT',
    target: 'Admin Portal',
    details: 'Administrator logged out',
    ipAddress: req.ip || '127.0.0.1',
    device: req.headers['user-agent'] || 'Browser'
  });

  return res.json({ success: true, message: 'Logout successful.' });
});

export default router;
