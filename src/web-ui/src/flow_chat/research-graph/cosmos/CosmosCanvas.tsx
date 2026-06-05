import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useResearchGraph } from '../researchGraphStore';
import { computeLayout, type XY } from '../computeLayout';
import { citeCount as citeCountOf, childrenOf } from '../applyGraphEvent';
import { Starfield } from './Starfield';
import { StarStreams } from './StarStreams';
import { StarNode } from './StarNode';
import { CitationDrawer } from './CitationDrawer';
import { ReportDrawer } from './ReportDrawer';
import type { Citation, ResearchNode } from '../types';
import './CosmosCanvas.scss';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function resetCosmosLayout(
  setView: React.Dispatch<React.SetStateAction<{ tx: number; ty: number; s: number }>>,
  setOverrides: React.Dispatch<React.SetStateAction<Map<string, XY>>>,
): void {
  setView({ tx: 0, ty: 0, s: 0.92 });
  setOverrides(new Map());
}

export const CosmosCanvas: React.FC = () => {
  const graph = useResearchGraph((s) => s.graph);
  const [view, setView] = useState({ tx: 0, ty: 0, s: 0.92 });
  const [overrides, setOverrides] = useState<Map<string, XY>>(new Map());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [citeFor, setCiteFor] = useState<ResearchNode | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const vpRef = useRef<HTMLDivElement>(null);
  const pan = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<{ node: ResearchNode; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const baseLayout = useMemo(() => computeLayout(graph), [graph]);
  const positions = useMemo(() => {
    const m = new Map(baseLayout);
    overrides.forEach((v, k) => m.set(k, v));
    return m;
  }, [baseLayout, overrides]);

  const citationsFor = useCallback((node: ResearchNode): Citation[] => {
    const ids: string[] = [];
    const walk = (id: string) => { (graph.citeByNode[id] ?? []).forEach((c) => ids.push(c)); childrenOf(graph, id).forEach(walk); };
    walk(node.id);
    return ids.map((id) => graph.citations[id]).filter(Boolean);
  }, [graph]);

  const onNodePointerDown = (e: React.PointerEvent, node: ResearchNode) => {
    drag.current = { node, sx: e.clientX, sy: e.clientY, ox: positions.get(node.id)?.x ?? 0, oy: positions.get(node.id)?.y ?? 0, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    setOverrides((m) => { const n = new Map(m); n.set(d.node.id, { x: d.ox + dx / view.s, y: d.oy + dy / view.s }); return n; });
  };
  const onDragEnd = () => {
    const d = drag.current; if (!d) return;
    if (!d.moved) { if (citeCountOf(graph, d.node.id) > 0) setCiteFor(d.node); }
    drag.current = null;
  };

  const onVpPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.cosmos-node, .cosmos-hud, .cosmos-drawer')) return;
    pan.current = { x: e.clientX, y: e.clientY };
    vpRef.current?.setPointerCapture(e.pointerId);
  };
  const onVpPointerMove = (e: React.PointerEvent) => {
    if (drag.current) return onDragMove(e);
    if (!pan.current) return;
    setView((v) => ({ ...v, tx: v.tx + (e.clientX - pan.current!.x), ty: v.ty + (e.clientY - pan.current!.y) }));
    pan.current = { x: e.clientX, y: e.clientY };
  };
  const onVpPointerUp = () => { pan.current = null; onDragEnd(); };
  const onWheel = (e: React.WheelEvent) => {
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setView((v) => {
      const ns = clamp(v.s * f, 0.35, 2.4);
      const lx = (e.clientX - v.tx) / v.s, ly = (e.clientY - v.ty) / v.s;
      return { s: ns, tx: e.clientX - ns * lx, ty: e.clientY - ns * ly };
    });
  };

  const toggle = (id: string) => setHidden((h) => { const n = new Set(h); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const isHidden = (n: ResearchNode): boolean => { let p = n.parentId; while (p) { if (hidden.has(p)) return true; p = graph.nodes[p]?.parentId ?? null; } return false; };
  const zoom = (f: number) => setView((v) => { const ns = clamp(v.s * f, 0.35, 2.4); const cx = innerWidth / 2, cy = innerHeight / 2; return { s: ns, tx: cx - ns * ((cx - v.tx) / v.s), ty: cy - ns * ((cy - v.ty) / v.s) }; });

  return (
    <div className="cosmos-viewport" ref={vpRef} onPointerDown={onVpPointerDown} onPointerMove={onVpPointerMove} onPointerUp={onVpPointerUp} onWheel={onWheel}>
      <Starfield parallax={{ x: view.tx, y: view.ty }} />
      <div className="cosmos-world" style={{ transform: `translate(${view.tx}px,${view.ty}px) scale(${view.s})` }}>
        <div className="cosmos-origin">
          <StarStreams graph={graph} positions={positions} hidden={hidden} />
          {graph.nodeOrder.map((id) => {
            const n = graph.nodes[id]; const pos = positions.get(id);
            if (!pos || isHidden(n)) return null;
            return (
              <StarNode key={id} node={n} pos={pos}
                citeCount={citeCountOf(graph, id)}
                hasChildren={childrenOf(graph, id).length > 0}
                collapsed={hidden.has(id)}
                onPointerDown={onNodePointerDown}
                onToggle={toggle}
                onOpenCitations={(node) => node.kind === 'core' ? setReportOpen(true) : setCiteFor(node)} />
            );
          })}
        </div>
      </div>

      <div className="cosmos-hud cosmos-panel">
        <div className="cosmos-hud__title">研究星河 <small>COSMOS</small></div>
        <div className="cosmos-hud__row">
          <button className="cosmos-btn" onClick={() => zoom(1 / 1.15)}>−</button>
          <span className="cosmos-hud__lvl">{Math.round(view.s * 100)}%</span>
          <button className="cosmos-btn" onClick={() => zoom(1.15)}>＋</button>
        </div>
        <button className="cosmos-btn" onClick={() => resetCosmosLayout(setView, setOverrides)}>复位</button>
        <button className="cosmos-btn cosmos-btn--warm" onClick={() => setReportOpen(true)}>⟢ 收束成报告</button>
        <div className="cosmos-hud__hint">拖星体移动 · 滚轮缩放 · 拖空平移<br/>点「引用 N」看文献 · 点核心收束</div>
      </div>

      <CitationDrawer open={!!citeFor} title={citeFor?.label ?? ''} citations={citeFor ? citationsFor(citeFor) : []}
        accent="#e8c878" onClose={() => setCiteFor(null)} />
      <ReportDrawer open={reportOpen} sections={graph.report} onClose={() => setReportOpen(false)} />
    </div>
  );
};
