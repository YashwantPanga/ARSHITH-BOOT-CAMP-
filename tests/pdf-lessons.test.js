// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import jsPDF from 'jspdf';
import { generateCoursePDF } from '../src/utils/pdfGenerator';
import { withLessons } from '../server/data/lessons/index.js';

// The course PDF includes the rewritten step-by-step sections (syntax, examples, outputs, result
// tables, charts and tips) and still builds for every course.
const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));
const saved = {};
let realSave;

beforeAll(() => {
  realSave = jsPDF.API.save;
  // no API server in tests: the PDF's diagram step finds no extra module content
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, enrichment: null }), { status: 200 });
  jsPDF.API.save = function (name) { saved[name] = this.output('arraybuffer').byteLength; return this; };
});
afterAll(() => { jsPDF.API.save = realSave; });

describe('course PDF with the new lessons', () => {
  it.each(db.courses.map(c => [c.id, c]))('%s builds', async (id, stored) => {
    const course = withLessons(stored);
    const before = Object.keys(saved).length;
    await generateCoursePDF(course, 'Test Student');
    const names = Object.keys(saved);
    expect(names.length).toBe(before + 1);
    expect(saved[names[names.length - 1]]).toBeGreaterThan(100000);
  }, 120000);
});
