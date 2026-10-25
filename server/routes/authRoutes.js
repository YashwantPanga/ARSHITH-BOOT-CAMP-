import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Admins sign in through the normal login form (POST /api/learners/login). The old built-in demo
// passwords are published in the source code, so they never sign in, even if a stored hash matches.
export const KNOWN_DEFAULT_PASSWORDS = ['admin123', 'Admin@2026'];

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
