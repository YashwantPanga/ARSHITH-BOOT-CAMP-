import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { publicBase } from './lib/publicUrl.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import learnerRoutes from './routes/learnerRoutes.js';
import practiceRoutes from './routes/practiceRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { learnerGuard } from './middleware/learnerAuth.js';
import { adminGate } from './middleware/auth.js';
import { getDb, dbReady, storageMode } from './db.js';
import { razorpayConfigured } from './lib/razorpay.js';
import { mailMode } from './lib/mailer.js';
import { certImagePath } from './routes/certificateRoutes.js';

const app = express();
// Behind Nginx on the same machine: take the visitor's address from X-Forwarded-For, so per-address
// login limits apply to each visitor rather than to everyone at once.
app.set('trust proxy', 'loopback');

// Enable CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parser
// The Razorpay webhook is signed over the exact bytes it sends, so keep those for that route.
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { if (req.originalUrl.startsWith('/api/payments/webhook')) req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (silenced in tests)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
// Health check endpoint. Also says which database, email and payment setup is active (no secrets),
// so one URL shows whether the live site is configured correctly.
app.get('/api/health', (req, res) => {
  res.status(dbReady() ? 200 : 503).json({
    status: dbReady() ? 'ok' : 'starting',
    service: 'CodeLekho Secure Backend API',
    database: dbReady() ? storageMode() : 'connecting',
    email: mailMode(),
    payments: razorpayConfigured() ? 'on' : 'off',
    timestamp: new Date().toISOString()
  });
});

// Until the database has loaded, answer API calls with a clear message instead of failing.
app.use('/api', (req, res, next) => {
  if (dbReady()) return next();
  res.status(503).json({ success: false, code: 'STARTING', message: 'The site is starting up. Please try again in a minute.' });
});

// Public address used in certificate QR codes and emails (see server/lib/publicUrl.js).
app.get('/api/site-info', (req, res) => res.json({ success: true, ...publicBase(req) }));

// Admin endpoints exist only for a signed-in admin; everyone else gets a plain 404
app.use('/api/admin', adminGate);

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
app.use('/api', interviewRoutes);
app.use('/api', activityRoutes);
app.use('/api', paymentRoutes);

// Serve the production build (npm run build) so the whole site runs from one port.
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  // index.html is never cached, so a reload always picks up the latest build; the hashed files in
  // /assets change name on every build and can be cached for a long time.
  const noCache = (res) => res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  app.use(express.static(distDir, {
    setHeaders: (res, file) => {
      if (file.endsWith('.html')) noCache(res);
      else if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
  // /verify/<id>: same page, plus preview tags (title, description, certificate picture) so a link
  // shared on LinkedIn or WhatsApp shows the certificate.
  app.get('/verify/:id', (req, res, next) => {
    try {
      const db = getDb();
      const id = String(req.params.id).trim().toUpperCase();
      const cert = (db.certificates || []).find(c => String(c.certificateId).toUpperCase() === id && c.status !== 'revoked');
      if (!cert) return next();
      const base = publicBase(req).publicUrl;
      const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      const title = `${cert.studentName} - ${cert.courseTitle} | CodeLekho certificate`;
      const desc = `Verified certificate of completion${cert.percentage != null ? ` with ${cert.percentage}%` : ''}. Certificate ID ${cert.certificateId}.`;
      const image = fs.existsSync(certImagePath(id)) ? `${base}/api/certificates/${encodeURIComponent(id)}/image.jpg` : `${base}/hero-student.webp`;
      const tags = [
        ['og:type', 'website'], ['og:site_name', 'CodeLekho'], ['og:title', title], ['og:description', desc],
        ['og:url', `${base}/verify/${encodeURIComponent(id)}`], ['og:image', image], ['og:image:width', '1600'], ['og:image:height', '1131']
      ].map(([k, v]) => `<meta property="${k}" content="${esc(v)}" />`).join('')
        + `<meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content="${esc(image)}" />`;
      const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8').replace('</head>', `${tags}</head>`);
      noCache(res);
      res.type('html').send(html);
    } catch { next(); }
  });
  app.get(/^\/(?!api\/).*/, (req, res) => { noCache(res); res.sendFile(path.join(distDir, 'index.html')); });
}

// Fallback handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

export default app;
