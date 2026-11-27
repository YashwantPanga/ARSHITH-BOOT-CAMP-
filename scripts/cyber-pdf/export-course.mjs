// Exports the Cyber Security course content (as served, with text polish) to JSON for the PDF builder.
// Usage: node scripts/cyber-pdf/export-course.mjs <out.json>
import fs from 'node:fs';
import { buildCyberCourse, CYBER_ENRICHMENT } from '../../server/data/courses/cyber-security/build.js';
import { withLessons } from '../../server/data/lessons/index.js';

const course = withLessons(buildCyberCourse());
fs.writeFileSync(process.argv[2] || 'course.json', JSON.stringify({ course, enrichment: CYBER_ENRICHMENT }, null, 1));
console.log(`exported ${course.modules.length} modules`);
