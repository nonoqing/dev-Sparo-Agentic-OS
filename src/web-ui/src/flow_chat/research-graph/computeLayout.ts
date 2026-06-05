import type { GraphState } from './types';
import { childrenOf } from './applyGraphEvent';

export interface XY { x: number; y: number }
export const PLANET_R = 230;
export const MOON_R = 130;
const GOLDEN_ANGLE = 2.399963229728653; // ~137.5°

/** Deterministic hash of a string -> [0,1) (FNV-1a). */
function seed(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return (x >>> 0) / 4294967295;
}

/**
 * Adaptive constellation layout: core at the origin; planets on a golden-angle spiral
 * with seeded jitter (never a symmetric cardinal cross); moons offset off the
 * core->planet line so they are never collinear. Deterministic per node id.
 */
export function computeLayout(state: GraphState): Map<string, XY> {
  const pos = new Map<string, XY>();
  const core = state.nodeOrder.find((id) => state.nodes[id].kind === 'core');
  if (!core) return pos;
  pos.set(core, { x: 0, y: 0 });

  const placeChildren = (parentId: string, depth: number, parentAngle: number, seen: Set<string>) => {
    const children = childrenOf(state, parentId).filter((id) => !seen.has(id));
    const parent = pos.get(parentId);
    if (!parent) return;

    children.forEach((id, i) => {
      seen.add(id);
      let ang: number;
      let rad: number;

      if (depth === 1) {
        ang = i * GOLDEN_ANGLE + (seed(id) - 0.5) * 0.7 - Math.PI / 2;
        rad = PLANET_R + (seed(id + 'R') - 0.5) * 130;
      } else {
        const fan = children.length === 1 ? 0 : (i / (children.length - 1) - 0.5) * 0.9;
        const tilt = 0.55 + (seed(id) - 0.5) * 0.5;
        ang = parentAngle + tilt + fan + (seed(id + 'a') - 0.5) * 0.3;
        rad = MOON_R + Math.min(depth - 2, 3) * 28 + (seed(id + 'R') - 0.5) * 70;
      }

      pos.set(id, { x: parent.x + Math.cos(ang) * rad, y: parent.y + Math.sin(ang) * rad });
      placeChildren(id, depth + 1, ang, seen);
    });
  };

  const seen = new Set<string>([core]);
  placeChildren(core, 1, -Math.PI / 2, seen);

  const orphans = state.nodeOrder.filter((id) => !seen.has(id));
  orphans.forEach((id, i) => {
    const ang = (i + childrenOf(state, core).length) * GOLDEN_ANGLE + (seed(id) - 0.5) * 0.7 - Math.PI / 2;
    const rad = PLANET_R + 170 + (seed(id + 'R') - 0.5) * 130;
    pos.set(id, { x: Math.cos(ang) * rad, y: Math.sin(ang) * rad });
    seen.add(id);
    placeChildren(id, 2, ang, seen);
  });

  return pos;
}
