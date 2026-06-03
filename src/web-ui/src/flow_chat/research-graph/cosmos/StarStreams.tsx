import React from 'react';
import type { GraphState } from '../types';
import type { XY } from '../computeLayout';
import { ribbon } from '../ribbon';

interface Props {
  graph: GraphState;
  positions: Map<string, XY>;
  branchColor: (branch: number) => string;
  hidden: Set<string>;
}

const width = (kind: string) => (kind === 'planet' ? 15 : 6);

export const StarStreams: React.FC<Props> = ({ graph, positions, branchColor, hidden }) => {
  const paths: React.ReactNode[] = [];
  graph.nodeOrder.forEach((id, i) => {
    const n = graph.nodes[id];
    if (!n.parentId || hidden.has(id) || hidden.has(n.parentId)) return;
    const p = positions.get(n.parentId), c = positions.get(id);
    if (!p || !c) return;
    const col = branchColor(n.branch);
    const { fill, center } = ribbon(p, c, width(graph.nodes[n.parentId].kind), width(n.kind), i + 1);
    const flowing = n.status === 'exploring';
    paths.push(
      <g key={id}>
        <path d={fill} fill={col} opacity={0.12} style={{ filter: 'blur(8px)' }} />
        <path d={fill} fill={col} opacity={0.28} />
        <path d={center} fill="none" stroke={col} strokeWidth={n.kind === 'planet' ? 2.2 : 1.3}
          strokeLinecap="round" opacity={0.95} strokeDasharray="2 11"
          style={{ animation: `cosmos-flow ${flowing ? '0.9s' : '2.6s'} linear infinite` }} />
      </g>,
    );
  });
  return <svg className="cosmos-streams" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>{paths}</svg>;
};
