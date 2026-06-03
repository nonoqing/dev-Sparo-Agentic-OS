import React from 'react';
import type { ResearchNode } from '../types';
import type { XY } from '../computeLayout';

interface Props {
  node: ResearchNode;
  pos: XY;
  color: string;
  citeCount: number;
  hasChildren: boolean;
  collapsed: boolean;
  onPointerDown: (e: React.PointerEvent, node: ResearchNode) => void;
  onToggle: (id: string) => void;
  onOpenCitations: (node: ResearchNode) => void;
}

export const StarNode: React.FC<Props> = ({ node, pos, color, citeCount, hasChildren, collapsed, onPointerDown, onToggle, onOpenCitations }) => {
  const style = { transform: `translate(${pos.x}px,${pos.y}px) translate(-50%,-50%)`, ['--c' as string]: color } as React.CSSProperties;
  if (node.kind === 'core') {
    return (
      <div className="cosmos-node cosmos-node--core" style={style} onPointerDown={(e) => { e.stopPropagation(); onOpenCitations(node); }}>
        <div className="cosmos-galcore"><div><div className="ct">{node.label}</div><div className="cs">点击收束成报告</div></div></div>
      </div>
    );
  }
  const flowing = node.status === 'exploring';
  return (
    <div className={`cosmos-node cosmos-node--${node.kind}`} style={style} data-id={node.id}
      onPointerDown={(e) => onPointerDown(e, node)}>
      <div className="cosmos-pill" data-status={node.status}>
        <span className="cosmos-orb" />
        <span className="cosmos-label">{node.label}</span>
        {citeCount > 0
          ? <span className="cosmos-cites" onPointerDown={(e) => { e.stopPropagation(); onOpenCitations(node); }}>引用 <b>{citeCount}</b></span>
          : flowing ? <span className="cosmos-cites cosmos-cites--muted">检索中…</span> : null}
        {node.status === 'contested' && <span className="cosmos-badge cosmos-badge--contested">争议</span>}
        {flowing && <span className="cosmos-badge cosmos-badge--flow">流动中</span>}
        {hasChildren && (
          <span className="cosmos-toggle" onPointerDown={(e) => { e.stopPropagation(); onToggle(node.id); }}>{collapsed ? '+' : '−'}</span>
        )}
      </div>
    </div>
  );
};
