export interface Pt { x: number; y: number }

/** Parent→child tapered river: returns the filled polygon path and the centreline bezier. w0/w1 = start/end width, seed controls organic bow. */
export function ribbon(p0: Pt, p3: Pt, w0: number, w1: number, seed: number): { fill: string; center: string } {
  const dx = p3.x - p0.x, dy = p3.y - p0.y, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  const off = Math.sin(seed * 1.7) * d * 0.13;
  const c1 = { x: p0.x + dx * 0.35 + nx * off, y: p0.y + dy * 0.35 + ny * off };
  const c2 = { x: p0.x + dx * 0.7 + nx * off * 0.7, y: p0.y + dy * 0.7 + ny * off * 0.7 };
  const B = (t: number): Pt => { const u = 1 - t; return {
    x: u*u*u*p0.x + 3*u*u*t*c1.x + 3*u*t*t*c2.x + t*t*t*p3.x,
    y: u*u*u*p0.y + 3*u*u*t*c1.y + 3*u*t*t*c2.y + t*t*t*p3.y }; };
  const T = (t: number): Pt => { const u = 1 - t;
    let x = 3*u*u*(c1.x-p0.x) + 6*u*t*(c2.x-c1.x) + 3*t*t*(p3.x-c2.x);
    let y = 3*u*u*(c1.y-p0.y) + 6*u*t*(c2.y-c1.y) + 3*t*t*(p3.y-c2.y);
    const m = Math.hypot(x, y) || 1; return { x: x/m, y: y/m }; };
  const N = 22, L: [number, number][] = [], R: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, pt = B(t), tg = T(t), hw = (w0 + (w1 - w0) * t) / 2;
    L.push([pt.x - tg.y * hw, pt.y + tg.x * hw]);
    R.push([pt.x + tg.y * hw, pt.y - tg.x * hw]);
  }
  let fill = 'M' + L[0][0].toFixed(1) + ' ' + L[0][1].toFixed(1);
  for (let i = 1; i <= N; i++) fill += 'L' + L[i][0].toFixed(1) + ' ' + L[i][1].toFixed(1);
  for (let i = N; i >= 0; i--) fill += 'L' + R[i][0].toFixed(1) + ' ' + R[i][1].toFixed(1);
  fill += 'Z';
  const center = `M${p0.x} ${p0.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p3.x} ${p3.y}`;
  return { fill, center };
}
