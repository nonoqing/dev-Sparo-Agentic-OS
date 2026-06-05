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

  const planets = childrenOf(state, core);
  planets.forEach((pid, i) => {
    const ang = i * GOLDEN_ANGLE + (seed(pid) - 0.5) * 0.7 - Math.PI / 2;
    const rad = PLANET_R + (seed(pid + 'R') - 0.5) * 130;
    const px = Math.cos(ang) * rad;
    const py = Math.sin(ang) * rad;
    pos.set(pid, { x: px, y: py });

    const moons = childrenOf(state, pid);
    const outward = Math.atan2(py, px);
    moons.forEach((mid, k) => {
      const tilt = 0.55 + (seed(mid) - 0.5) * 0.5; // offset from outward → non-collinear
      const fan = moons.length === 1 ? 0 : (k / (moons.length - 1) - 0.5) * 0.8;
      const a = outward + tilt + fan + (seed(mid + 'a') - 0.5) * 0.3;
      const rad2 = MOON_R + (seed(mid + 'R') - 0.5) * 70;
      pos.set(mid, { x: px + Math.cos(a) * rad2, y: py + Math.sin(a) * rad2 });
    });
  });
  return pos;
}
