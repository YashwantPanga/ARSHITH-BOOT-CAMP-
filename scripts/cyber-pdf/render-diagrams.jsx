// Renders the Cyber Security slide diagrams (src/data/cyberDiagrams.js) to SVG files for the course PDF.
// Usage: npx vite-node scripts/cyber-pdf/render-diagrams.jsx <out-dir>
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { SLIDE_SHAPES } from '../../src/components/diagrams/SlideDiagram.jsx';
import { CYBER_DIAGRAMS } from '../../src/data/cyberDiagrams.js';

const out = process.argv[2] || 'diagrams';
fs.mkdirSync(out, { recursive: true });
const index = {};
for (const [id, def] of Object.entries(CYBER_DIAGRAMS)) {
  index[id] = { title: def.title, subtitle: def.subtitle, note: def.note, slides: [] };
  def.slides.forEach((s, i) => {
    if (s.type === 'table') { index[id].slides.push({ type: 'table', title: s.title, text: s.text, head: s.head, rows: s.rows }); return; }
    const Shape = SLIDE_SHAPES[s.type];
    let svg = renderToStaticMarkup(<Shape s={s} uid={`${id}-${i}`} />);
    svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/ class="[^"]*"/, '');
    const file = `${id}-${i}.svg`;
    fs.writeFileSync(path.join(out, file), svg);
    index[id].slides.push({ type: s.type, title: s.title, text: s.text, file });
  });
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 2));
console.log(`rendered ${Object.keys(index).length} diagrams to ${out}`);
