import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'db.json');

export function getDb() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    throw err;
  }
}

export function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    throw err;
  }
}

export function logActivity({ adminId = 'ARB-ADMIN-001', action, target, details, ipAddress = '127.0.0.1', device = 'Desktop Chrome' }) {
  const db = getDb();
  if (!db.activityLogs) db.activityLogs = [];
  
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    adminId,
    action,
    target,
    details: details || '',
    timestamp: new Date().toISOString(),
    ipAddress,
    device
  };

  db.activityLogs.unshift(newLog);
  saveDb(db);
  return newLog;
}
