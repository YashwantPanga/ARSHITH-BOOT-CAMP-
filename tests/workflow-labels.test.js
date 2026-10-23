import { describe, it, expect } from 'vitest';
import ENRICHMENT from '../server/data/enrichment/index.js';
import { layoutDiagram, routeEdges } from '../src/components/lesson/WorkflowDiagram';

const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

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
      expect(l.x >= 0 && l.x + l.w <= L.width).toBe(true);
    });
  });
});
