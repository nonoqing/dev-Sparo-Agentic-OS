import React from 'react';
import type { GraphState } from '../types';
import type { XY } from '../computeLayout';

interface Props {
  graph: GraphState;
  positions: Map<string, XY>;
  hidden: Set<string>;
  /** Deprecated; ignored. The constellation renders monochrome gold. Kept so existing call sites still typecheck. */
  branchColor?: (branch: number) => string;
}

export const StarStreams: React.FC<Props> = ({ graph, positions, hidden }) => {
  const lines: React.ReactNode[] = [];
  graph.nodeOrder.forEach((id) => {
    const n = graph.nodes[id];
    if (!n.parentId || hidden.has(id) || hidden.has(n.parentId)) return;
    const a = positions.get(n.parentId);
    const b = positions.get(id);
    if (!a || !b) return;
    const flowing = n.status === 'exploring';
    lines.push(
      <g key={id}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e8c878" strokeWidth={3} opacity={0.08} style={{ filter: 'blur(2px)' }} />
        <line
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke="#d8b46a" strokeWidth={1} opacity={0.5} strokeLinecap="round"
          strokeDasharray={flowing ? '1 7' : undefined}
          style={flowing ? { animation: 'cosmos-flow 1.2s linear infinite' } : undefined}
        />
      </g>,
    );
  });
  return <svg className="cosmos-streams" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>{lines}</svg>;
};
