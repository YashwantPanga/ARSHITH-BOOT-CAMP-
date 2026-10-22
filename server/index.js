import 'dotenv/config';
import app from './app.js';
import { initDb, flushDb } from './db.js';

const PORT = process.env.PORT || 5000;

const mode = await initDb();

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Arshith Bootcamp Secure Backend API Running     `);
  console.log(` Port: http://localhost:${PORT}                   `);
  console.log(` Health: http://localhost:${PORT}/api/health     `);
  console.log(` Database: ${mode === 'supabase' ? 'Supabase' : 'local file (server/data/db.json)'}`);
  console.log(`=================================================`);
});

// Make sure the last changes reach Supabase before the process exits.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await flushDb().catch(() => {});
    process.exit(0);
  });
}
