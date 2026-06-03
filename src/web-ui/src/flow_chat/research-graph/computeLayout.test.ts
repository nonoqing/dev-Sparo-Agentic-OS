import { describe, expect, it } from 'vitest';
import { createInitialGraph, type GraphEvent } from './types';
import { applyGraphEvent } from './applyGraphEvent';
import { computeLayout, PLANET_R } from './computeLayout';

const build = (...es: GraphEvent[]) => es.reduce(applyGraphEvent, createInitialGraph());

describe('computeLayout', () => {
  it('places core at the origin', () => {
    const g = build({ t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 } });
    expect(computeLayout(g).get('core')).toEqual({ x: 0, y: 0 });
  });

  it('places planets on the PLANET_R circle around core', () => {
    const g = build(
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'a', status: 'exploring', branch: 1 } },
      { t: 'node.add', node: { id: 'p2', parentId: 'core', kind: 'planet', label: 'b', status: 'exploring', branch: 2 } },
    );
    const pos = computeLayout(g);
    for (const id of ['p1', 'p2']) {
      const p = pos.get(id)!;
      expect(Math.round(Math.hypot(p.x, p.y))).toBe(PLANET_R);
    }
  });

  it('places a moon near its planet, farther from core than the planet', () => {
    const g = build(
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'a', status: 'exploring', branch: 1 } },
      { t: 'node.add', node: { id: 'm1', parentId: 'p1', kind: 'moon', label: 'm', status: 'exploring', branch: 1 } },
    );
    const pos = computeLayout(g);
    const p = pos.get('p1')!, m = pos.get('m1')!;
    expect(Math.hypot(m.x, m.y)).toBeGreaterThan(Math.hypot(p.x, p.y));
    expect(Math.hypot(m.x - p.x, m.y - p.y)).toBeLessThan(PLANET_R);
  });
});
