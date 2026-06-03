import type { GraphState } from './types';
import { childrenOf } from './applyGraphEvent';

export interface XY { x: number; y: number }
export const PLANET_R = 320;
export const MOON_R = 150;

/** Deterministic radial + star-cluster layout. Returns world coordinates for every visible node. */
export function computeLayout(state: GraphState): Map<string, XY> {
  const pos = new Map<string, XY>();
  const core = state.nodeOrder.find((id) => state.nodes[id].kind === 'core');
  if (!core) return pos;
  pos.set(core, { x: 0, y: 0 });

  const planets = childrenOf(state, core);
  planets.forEach((pid, i) => {
    const ang = -Math.PI / 2 + (i / Math.max(planets.length, 1)) * Math.PI * 2;
    const px = Math.cos(ang) * PLANET_R, py = Math.sin(ang) * PLANET_R;
    pos.set(pid, { x: px, y: py });

    const moons = childrenOf(state, pid);
    const base = Math.atan2(py, px);
    moons.forEach((mid, j) => {
      const spread = Math.PI * 0.7;
      const a = base - spread / 2 + (moons.length === 1 ? spread / 2 : (j / (moons.length - 1)) * spread);
      pos.set(mid, { x: px + Math.cos(a) * MOON_R, y: py + Math.sin(a) * MOON_R });
    });
  });
  return pos;
}
