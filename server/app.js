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

// Public address used in certificate QR codes and emails (see server/lib/publicUrl.js).
app.get('/api/site-info', (req, res) => res.json({ success: true, ...publicBase(req) }));

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
  // index.html is never cached, so a reload always picks up the latest build; the hashed files in
  // /assets change name on every build and can be cached for a long time.
  const noCache = (res) => res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  app.use(express.static(distDir, {
    setHeaders: (res, file) => {
      if (file.endsWith('.html')) noCache(res);
      else if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
  app.get(/^\/(?!api\/).*/, (req, res) => { noCache(res); res.sendFile(path.join(distDir, 'index.html')); });
}

// Fallback handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
});

export default app;
