import { describe, it, expect } from 'vitest';
import ENRICHMENT from '../server/data/enrichment/index.js';
import { layoutDiagram, routeEdges } from '../src/components/lesson/WorkflowDiagram';

const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Points along an SVG path made of M, L, Q and C commands (absolute coordinates). */
function samplePath(d, step = 0.05) {
  const pts = [];
  let cur = [0, 0];
  for (const [, cmd, args] of d.matchAll(/([MLQC])([^MLQC]*)/g)) {
    const n = args.match(/-?\d+(?:\.\d+)?/g).map(Number);
    if (cmd === 'M') { cur = [n[0], n[1]]; pts.push(cur); continue; }
    const ctrl = cmd === 'L' ? [] : cmd === 'Q' ? [[n[0], n[1]]] : [[n[0], n[1]], [n[2], n[3]]];
    const end = [n.at(-2), n.at(-1)];
    const all = [cur, ...ctrl, end];
    for (let t = step; t <= 1.0001; t += step) {
      let p = all;
      while (p.length > 1) p = p.slice(1).map((q, i) => [p[i][0] + (q[0] - p[i][0]) * t, p[i][1] + (q[1] - p[i][1]) * t]);
      pts.push(p[0]);
    }
    cur = end;
  }
  return pts;
}

describe('workflow edge labels', () => {
  const all = Object.entries(ENRICHMENT).flatMap(([course, mods]) =>
    Object.entries(mods).filter(([, e]) => e.workflow).map(([id, e]) => [`${course}/${id}`, e.workflow]));

  it('covers every module workflow', () => { expect(all.length).toBe(60); });

  it.each(all)('%s: labels clear boxes, arrowheads and each other', (name, def) => {
    const L = layoutDiagram(def);
    const routes = routeEdges(L);
    const boxes = L.nodes.map(n => ({ x: n.x, y: n.y, w: L.NODE_W, h: L.NODE_H }));
    const heads = routes.map(({ d }) => { const n = d.match(/-?\d+(?:\.\d+)?/g).map(Number); return { x: n.at(-2) - 7, y: n.at(-1) - 7, w: 14, h: 14 }; });
    const labels = routes.filter(r => r.label).map(r => ({ x: r.lx - r.lw / 2, y: r.ly - 9, w: r.lw, h: 18 }));
    labels.forEach((l, k) => {
      expect(boxes.some(b => hit(l, b))).toBe(false);
      expect(heads.some(h => hit(l, h))).toBe(false);
      expect(labels.some((o, j) => j !== k && hit(l, o))).toBe(false);
      // no other arrow runs underneath the label
      const own = routes.filter(r => r.label)[k];
      const crossed = routes.filter(r => r !== own).some(r => samplePath(r.d).some(([x, y]) => x > l.x + 2 && x < l.x + l.w - 2 && y > l.y + 3 && y < l.y + l.h - 3));
      expect(crossed, `${name}: label "${own.label}" sits on another arrow`).toBe(false);
      expect(l.x >= 0 && l.x + l.w <= L.width).toBe(true);
    });
  });
});
