import React from 'react';
import type { ResearchNode } from '../types';
import type { XY } from '../computeLayout';
import './StarNode.scss';

interface Props {
  node: ResearchNode;
  pos: XY;
  citeCount: number;
  hasChildren: boolean;
  collapsed: boolean;
  onPointerDown: (e: React.PointerEvent, node: ResearchNode) => void;
  onToggle: (id: string) => void;
  onOpenCitations: (node: ResearchNode) => void;
}

/** Deterministic [0,3) phase from id so stars breathe out of sync. */
function phase(id: string): number {
  let x = 2166136261;
  for (let i = 0; i < id.length; i++) { x ^= id.charCodeAt(i); x = Math.imul(x, 16777619); }
  return ((x >>> 0) / 4294967295) * 3;
}

const StarMark: React.FC<{ kind: ResearchNode['kind']; gid: string; ph: number }> = ({ kind, gid, ph }) => {
  const big = kind === 'core', mid = kind === 'planet';
  const glowR = big ? 30 : mid ? 17 : 10;
  const hot = big ? 3.4 : mid ? 2.2 : 1.5;
  const base = big ? 0.9 : mid ? 0.7 : 0.5;
  const peak = Math.min(base + 0.3, 1);
  const dur = (big ? 5 : 4) + ph * 0.45;
  const begin = (ph * 0.7).toFixed(2);
  const r0 = (glowR * 0.93).toFixed(1), r1 = (glowR * 1.12).toFixed(1);
  const len = big ? 19 : 12, w = big ? 2 : 1.3, op = big ? 0.85 : 0.6;
  const box = (glowR + 4) * 2, c = box / 2;
  const vR = `${c},${c - len} ${c + w},${c} ${c},${c + len} ${c - w},${c}`;
  const hR = `${c - len},${c} ${c},${c - w} ${c + len},${c} ${c},${c + w}`;
  return (
    <svg className="cosmos-starmark" width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
      <defs>
        <radialGradient id={`csg-${gid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3d2" stopOpacity="0.9" />
          <stop offset="14%" stopColor="#ffe2a0" stopOpacity="0.42" />
          <stop offset="46%" stopColor="#f3cf86" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#f3cf86" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={glowR} fill={`url(#csg-${gid})`} opacity={base}>
        <animate attributeName="opacity" values={`${base};${peak};${base}`} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines=".4 0 .6 1;.4 0 .6 1" />
        <animate attributeName="r" values={`${r0};${r1};${r0}`} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines=".4 0 .6 1;.4 0 .6 1" />
      </circle>
      {kind !== 'moon' && (
        <g className="cosmos-starmark__spike">
          <polygon points={vR} fill="#fff4d6" opacity={op} />
          <polygon points={hR} fill="#fff4d6" opacity={op} />
        </g>
      )}
      <circle cx={c} cy={c} r={hot} fill="#fff5d8" />
      <circle cx={c} cy={c} r={hot * 0.5} fill="#ffffff" />
    </svg>
  );
};

export const StarNode: React.FC<Props> = ({ node, pos, citeCount, hasChildren, collapsed, onPointerDown, onToggle, onOpenCitations }) => {
  const style = { transform: `translate(${pos.x}px,${pos.y}px)` } as React.CSSProperties;
  const ph = phase(node.id);
  if (node.kind === 'core') {
    return (
      <div className="cosmos-node cosmos-node--core" style={style}
        onPointerDown={(e) => { e.stopPropagation(); onOpenCitations(node); }}>
        <StarMark kind="core" gid={node.id} ph={ph} />
        <div className="cosmos-node__label cosmos-node__label--core">
          <span className="cosmos-label">{node.label}</span>
          <span className="cosmos-sub">点击收束成报告</span>
        </div>
      </div>
    );
  }
  const flowing = node.status === 'exploring';
  return (
    <div className={`cosmos-node cosmos-node--${node.kind}`} style={style} data-id={node.id}
      onPointerDown={(e) => onPointerDown(e, node)}>
      <StarMark kind={node.kind} gid={node.id} ph={ph} />
      <div className="cosmos-node__label">
        <span className="cosmos-label">{node.label}</span>
        <span className="cosmos-meta">
          {citeCount > 0
            ? <span className="cosmos-cites" onPointerDown={(e) => { e.stopPropagation(); onOpenCitations(node); }}>★ 引用 {citeCount}</span>
            : flowing ? <span className="cosmos-cites cosmos-cites--muted">检索中…</span> : null}
          {node.status === 'contested' && <span className="cosmos-badge cosmos-badge--contested">争议</span>}
          {flowing && <span className="cosmos-badge cosmos-badge--flow">流动中</span>}
          {hasChildren && <span className="cosmos-toggle" onPointerDown={(e) => { e.stopPropagation(); onToggle(node.id); }}>{collapsed ? '+' : '−'}</span>}
        </span>
      </div>
    </div>
  );
};
