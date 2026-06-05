import { describe, expect, it } from 'vitest';
import { createInitialGraph, type GraphEvent } from './types';
import { applyGraphEvent } from './applyGraphEvent';
import { computeLayout, PLANET_R } from './computeLayout';

const build = (...es: GraphEvent[]) => es.reduce(applyGraphEvent, createInitialGraph());
const core: GraphEvent = { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 } };
const planet = (id: string, b: number): GraphEvent => ({ t: 'node.add', node: { id, parentId: 'core', kind: 'planet', label: id, status: 'exploring', branch: b } });
const moon = (id: string, p: string, b: number): GraphEvent => ({ t: 'node.add', node: { id, parentId: p, kind: 'moon', label: id, status: 'exploring', branch: b } });

describe('computeLayout (adaptive constellation)', () => {
  it('places core at the origin', () => {
    expect(computeLayout(build(core)).get('core')).toEqual({ x: 0, y: 0 });
  });

  it('is deterministic for the same graph', () => {
    const g = build(core, planet('p1', 1), planet('p2', 2), moon('m1', 'p1', 1));
    const a = computeLayout(g), b = computeLayout(g);
    for (const id of ['core', 'p1', 'p2', 'm1']) expect(a.get(id)).toEqual(b.get(id));
  });

  it('keeps planets within a radius band (never the cardinal cross)', () => {
    const g = build(core, planet('p1', 1), planet('p2', 2), planet('p3', 3), planet('p4', 4));
    const pos = computeLayout(g);
    for (const id of ['p1', 'p2', 'p3', 'p4']) {
      const p = pos.get(id)!; const d = Math.hypot(p.x, p.y);
      expect(d).toBeGreaterThan(PLANET_R - 70);
      expect(d).toBeLessThan(PLANET_R + 70);
    }
    const angles = ['p1', 'p2', 'p3', 'p4'].map((id) => { const p = pos.get(id)!; return Math.round(Math.atan2(p.y, p.x) * 100); });
    expect(new Set(angles).size).toBe(4); // golden-angle spread → all distinct, no symmetric cross
  });
  it('places a moon off the core->planet line (non-collinear)', () => {
    const g = build(core, planet('p1', 1), moon('m1', 'p1', 1));
    const pos = computeLayout(g);
    const p = pos.get('p1')!, m = pos.get('m1')!;
    const cross = p.x * (m.y - p.y) - p.y * (m.x - p.x);
    expect(Math.abs(cross)).toBeGreaterThan(50);
  });

  it('places descendants deeper than moons', () => {
    const g = build(core, planet('p1', 1), moon('m1', 'p1', 1), moon('m2', 'm1', 1));
    const pos = computeLayout(g);
    expect(pos.has('m2')).toBe(true);
    expect(pos.get('m2')).not.toEqual(pos.get('m1'));
  });

  it('places orphan nodes outside the core cluster instead of dropping them', () => {
    const g = createInitialGraph();
    g.nodes.core = { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 };
    g.nodes.orphan = { id: 'orphan', parentId: 'missing', kind: 'moon', label: 'orphan', status: 'exploring', branch: 1 };
    g.nodeOrder = ['core', 'orphan'];
    const p = computeLayout(g).get('orphan')!;
    expect(p).toBeDefined();
    expect(Math.hypot(p.x, p.y)).toBeGreaterThan(PLANET_R + 80);
  });
});
