import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import os from 'os';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import learnerRoutes from './routes/learnerRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import { learnerGuard } from './middleware/learnerAuth.js';

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (silenced in tests)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Arshith Bootcamp Secure Backend API', timestamp: new Date().toISOString() });
});

// Public address used in certificate QR codes. "localhost" in a QR code points at the scanning
// phone itself, so when the site runs on a computer we advertise its local-network address instead.
// Set PUBLIC_SITE_URL (e.g. https://learn.example.com) in production.
function lanAddress() {
  const candidates = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family === 'IPv4' && !ni.internal) candidates.push(ni.address);
    }
  }
  const isPrivate = (ip) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
  return candidates.find(isPrivate) || candidates[0] || null;
}
app.get('/api/site-info', (req, res) => {
  const configured = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return res.json({ success: true, publicUrl: configured, source: 'PUBLIC_SITE_URL' });
  const host = String(req.headers.host || '');
  const port = host.includes(':') ? host.split(':').pop() : (process.env.PORT || 5000);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
  const ip = local ? lanAddress() : null;
  res.json({ success: true, publicUrl: ip ? `http://${ip}:${port}` : `${req.protocol}://${host}`, source: ip ? 'lan' : 'request' });
});

// Learner-owned endpoints require a signed learner session
app.use('/api', learnerGuard);

// Mount Routes
app.use('/api', authRoutes);
app.use('/api', courseRoutes);
app.use('/api', studentRoutes);
app.use('/api', projectRoutes);
app.use('/api', certificateRoutes);
app.use('/api', adminRoutes);
app.use('/api', quizRoutes);
app.use('/api', learnerRoutes);
app.use('/api', practiceRoutes);

// Serve the production build (npm run build) so the whole site runs from one port.
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// Fallback handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

export default app;
