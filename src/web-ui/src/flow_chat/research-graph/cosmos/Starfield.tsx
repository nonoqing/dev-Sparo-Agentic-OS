import React, { useMemo } from 'react';
import './Starfield.scss';

interface Star { left: string; top: string; size: number; dur: string; o0: number; o1: number; glow: boolean }

function genStars(count: number, max: number): Star[] {
  return Array.from({ length: count }, () => {
    const z = Math.random();
    const size = Math.random() * max + max * 0.3;
    return {
      left: (Math.random() * 100) + 'vw',
      top: (Math.random() * 100) + 'vh',
      size,
      dur: (1.5 + Math.random() * 3).toFixed(2) + 's',
      o0: +(0.15 + z * 0.3).toFixed(2),
      o1: +(0.6 + z * 0.4).toFixed(2),
      glow: size > 1.8,
    };
  });
}

export const Starfield: React.FC<{ parallax: { x: number; y: number } }> = ({ parallax }) => {
  const far = useMemo(() => genStars(90, 1.4), []);
  const near = useMemo(() => genStars(150, 2.2), []);
  const layer = (stars: Star[], k: number) => (
    <div className="cosmos-stars" style={{ transform: `translate(${parallax.x * k}px,${parallax.y * k}px)` }}>
      {stars.map((s, i) => (
        <span key={i} className="cosmos-star" style={{
          left: s.left, top: s.top, width: s.size, height: s.size,
          ['--d' as string]: s.dur, ['--o0' as string]: s.o0, ['--o1' as string]: s.o1,
          boxShadow: s.glow ? `0 0 ${s.size * 2}px ${s.size * 0.6}px rgba(200,220,255,.6)` : undefined,
        } as React.CSSProperties} />
      ))}
    </div>
  );
  return (
    <div className="cosmos-bg" aria-hidden>
      <div className="cosmos-nebula" style={{ transform: `translate(${parallax.x * 0.03}px,${parallax.y * 0.03}px)` }} />
      <div className="cosmos-band" style={{ transform: `translate(${parallax.x * 0.04}px,${parallax.y * 0.04}px)` }} />
      {layer(far, 0.06)}
      {layer(near, 0.12)}
    </div>
  );
};
