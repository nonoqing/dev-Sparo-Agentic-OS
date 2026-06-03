# 研究星河 Cosmos Deep Research — 前端实现计划(子项目 A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个 mock 流驱动、可拖拽/缩放/折叠的"研究星河"放射状脑图前端,节点挂引用、点开看文献详情、点核心收束成报告 —— 与后端通过 `GraphEvent` schema 解耦。

**Architecture:** 纯数据层(`GraphEvent` reducer + zustand store)→ 纯布局层(放射 + 星系簇环绕)→ 视觉层(深空星河 SVG 画布 + 抽屉)。前端只渲染图谱;mock 流先跑通体验,后端(子项目 B,另立计划)按同一 schema 产出。

**Tech Stack:** React + TypeScript + zustand/immer + Vitest 4 + SVG + SCSS。Sparo web-ui 现有 panel 系统(`PanelContentType` + `FlexiblePanel`)。

**设计依据:** `docs/superpowers/specs/2026-06-02-cosmos-deepresearch-design.md`
**视觉参照原型(已评审,在仓库内):** `.superpowers/brainstorm/58195-1780399628/content/river-cosmos.html` —— 精确的配色/SVG/CSS 数值从此文件移植。

**根目录约定:** 所有相对路径以 `src/web-ui/` 为根。测试命令在 `src/web-ui/` 下执行。

---

## 文件结构(先锁定边界)

新增目录 `src/web-ui/src/flow_chat/research-graph/`:

| 文件 | 职责 |
|---|---|
| `types.ts` | 契约:`GraphEvent` / `ResearchNode` / `Citation` / `ReportSection` / `GraphState` |
| `applyGraphEvent.ts` | 纯 reducer:`(GraphState, GraphEvent) => GraphState`;含 `citeCount` / `childrenOf` 选择器 |
| `researchGraphStore.ts` | `createResearchGraphStore()` 工厂(zustand vanilla)+ React context/hook |
| `ribbon.ts` | 纯函数:父→子锥形丝带 SVG path 生成 |
| `computeLayout.ts` | 纯函数:图谱 → `Map<id,{x,y}>`(core 居中、planet 放射、moon 环绕) |
| `mockStream.ts` | 模拟探索:定时发射 `GraphEvent`,返回 stop 函数 |
| `cosmos/Starfield.tsx` `cosmos/Starfield.scss` | 背景:星云 + 银河带 + 双层星场(视差) |
| `cosmos/StarStreams.tsx` | SVG 星流层(消费 ribbon + layout) |
| `cosmos/StarNode.tsx` | 单节点 pill(orb + 标签 + 引用数 + 徽标) |
| `cosmos/CosmosCanvas.tsx` `cosmos/CosmosCanvas.scss` | 容器:pan/zoom/drag/折叠 + 组合各层 |
| `cosmos/CitationDrawer.tsx` | 引用文献详情抽屉 |
| `cosmos/ReportDrawer.tsx` | 收束报告抽屉 |
| `cosmos/CosmosCanvasPanel.tsx` | aux 面板入口:建 store + (mock 时)起流 + 渲染 CosmosCanvas |

修改:
- `src/app/components/panels/base/types.ts` — `PanelContentType` 加 `'cosmos-canvas'`
- `src/app/components/panels/base/FlexiblePanel.tsx` — switch 加 `case 'cosmos-canvas'`
- `src/flow_chat/components/WelcomePanel.tsx` — 临时 dev 启动按钮(子项目 B 接真实流后移除)

---

## Task 1: 契约类型 `types.ts`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/types.ts`
- Test: `src/web-ui/src/flow_chat/research-graph/types.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { createInitialGraph } from './types';

describe('createInitialGraph', () => {
  it('returns an empty graph', () => {
    const g = createInitialGraph();
    expect(g.nodeOrder).toEqual([]);
    expect(Object.keys(g.nodes)).toEqual([]);
    expect(Object.keys(g.citations)).toEqual([]);
    expect(g.report).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `npx vitest run src/flow_chat/research-graph/types.test.ts`
Expected: FAIL — `createInitialGraph` 未定义。

- [ ] **Step 3: 写实现**

```ts
export type Verdict = 'decided' | 'contested' | 'gap' | 'tentative';
export type NodeKind = 'core' | 'planet' | 'moon';
export type NodeStatus = 'exploring' | 'settled' | 'contested' | 'gap' | 'tentative';
export type Authority = 'primary' | 'authoritative' | 'media' | 'community';

export interface ResearchNode {
  id: string;
  parentId: string | null; // null = core
  kind: NodeKind;
  label: string;
  status: NodeStatus;
  branch: number; // 1..5 配色归属(继承自所属 planet)
}

export interface Citation {
  id: string;
  nodeId: string;
  title: string;
  source: string;
  author?: string;
  date?: string;
  authority: Authority;
  quote?: string;
  url?: string;
  corroborated?: boolean;
}

export interface ReportSection {
  nodeId: string;
  heading: string;
  body: string;
  citeIds: string[];
}

export type GraphEvent =
  | { t: 'node.add'; node: ResearchNode }
  | { t: 'node.update'; id: string; patch: Partial<ResearchNode> }
  | { t: 'cite.add'; cite: Citation }
  | { t: 'verdict'; nodeId: string; verdict: Verdict }
  | { t: 'report'; section: ReportSection };

export interface GraphState {
  nodes: Record<string, ResearchNode>;
  nodeOrder: string[];
  citations: Record<string, Citation>;
  citeByNode: Record<string, string[]>;
  report: ReportSection[];
}

export const createInitialGraph = (): GraphState => ({
  nodes: {},
  nodeOrder: [],
  citations: {},
  citeByNode: {},
  report: [],
});
```

- [ ] **Step 4: 运行,确认通过**

Run: `npx vitest run src/flow_chat/research-graph/types.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/types.ts src/web-ui/src/flow_chat/research-graph/types.test.ts
git commit -m "feat(cosmos): research-graph contract types"
```

---

## Task 2: 纯 reducer `applyGraphEvent.ts`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/applyGraphEvent.ts`
- Test: `src/web-ui/src/flow_chat/research-graph/applyGraphEvent.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { createInitialGraph, type GraphEvent } from './types';
import { applyGraphEvent, citeCount, childrenOf } from './applyGraphEvent';

const ev = (...es: GraphEvent[]) => es.reduce(applyGraphEvent, createInitialGraph());

describe('applyGraphEvent', () => {
  it('adds nodes once, preserving order', () => {
    const g = ev(
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: '主题', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: '起源', status: 'exploring', branch: 1 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'dup', status: 'exploring', branch: 1 } },
    );
    expect(g.nodeOrder).toEqual(['core', 'p1']);
    expect(g.nodes.p1.label).toBe('起源');
  });

  it('updates a node via patch', () => {
    const g = ev(
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'x', status: 'exploring', branch: 1 } },
      { t: 'node.update', id: 'p1', patch: { status: 'settled' } },
    );
    expect(g.nodes.p1.status).toBe('settled');
  });

  it('attaches citations and aggregates count over descendants', () => {
    const g = ev(
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'p', status: 'exploring', branch: 1 } },
      { t: 'node.add', node: { id: 'm1', parentId: 'p1', kind: 'moon', label: 'm', status: 'exploring', branch: 1 } },
      { t: 'cite.add', cite: { id: 'c1', nodeId: 'm1', title: 'T', source: 'S', authority: 'primary' } },
      { t: 'cite.add', cite: { id: 'c2', nodeId: 'p1', title: 'T2', source: 'S2', authority: 'media' } },
    );
    expect(childrenOf(g, 'p1')).toEqual(['m1']);
    expect(citeCount(g, 'm1')).toBe(1);
    expect(citeCount(g, 'p1')).toBe(2); // own 1 + descendant 1
  });

  it('maps verdict to node status and appends report sections', () => {
    const g = ev(
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'p', status: 'exploring', branch: 1 } },
      { t: 'verdict', nodeId: 'p1', verdict: 'decided' },
      { t: 'report', section: { nodeId: 'p1', heading: 'H', body: 'B', citeIds: ['c1'] } },
    );
    expect(g.nodes.p1.status).toBe('settled'); // 'decided' -> 'settled'
    expect(g.report).toHaveLength(1);
    expect(g.report[0].heading).toBe('H');
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `npx vitest run src/flow_chat/research-graph/applyGraphEvent.test.ts`
Expected: FAIL — 模块未定义。

- [ ] **Step 3: 写实现**

```ts
import { produce } from 'immer';
import type { GraphState, GraphEvent } from './types';

export const applyGraphEvent = (state: GraphState, event: GraphEvent): GraphState =>
  produce(state, (draft) => {
    switch (event.t) {
      case 'node.add': {
        if (draft.nodes[event.node.id]) return;
        draft.nodes[event.node.id] = event.node;
        draft.nodeOrder.push(event.node.id);
        if (!draft.citeByNode[event.node.id]) draft.citeByNode[event.node.id] = [];
        break;
      }
      case 'node.update': {
        const n = draft.nodes[event.id];
        if (n) Object.assign(n, event.patch);
        break;
      }
      case 'cite.add': {
        if (draft.citations[event.cite.id]) return;
        draft.citations[event.cite.id] = event.cite;
        (draft.citeByNode[event.cite.nodeId] ??= []).push(event.cite.id);
        break;
      }
      case 'verdict': {
        const n = draft.nodes[event.nodeId];
        if (n) n.status = event.verdict === 'decided' ? 'settled' : event.verdict;
        break;
      }
      case 'report': {
        draft.report.push(event.section);
        break;
      }
    }
  });

export const childrenOf = (state: GraphState, id: string): string[] =>
  state.nodeOrder.filter((nid) => state.nodes[nid]?.parentId === id);

export const citeCount = (state: GraphState, id: string): number => {
  if (!state.nodes[id]) return 0;
  let n = state.citeByNode[id]?.length ?? 0;
  for (const child of childrenOf(state, id)) n += citeCount(state, child);
  return n;
};
```

- [ ] **Step 4: 运行,确认通过**

Run: `npx vitest run src/flow_chat/research-graph/applyGraphEvent.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/applyGraphEvent.ts src/web-ui/src/flow_chat/research-graph/applyGraphEvent.test.ts
git commit -m "feat(cosmos): pure GraphEvent reducer + citation aggregation"
```

---

## Task 3: store 工厂 `researchGraphStore.ts`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/researchGraphStore.ts`
- Test: `src/web-ui/src/flow_chat/research-graph/researchGraphStore.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { createResearchGraphStore } from './researchGraphStore';

describe('createResearchGraphStore', () => {
  it('ingests events and exposes the reduced graph', () => {
    const store = createResearchGraphStore();
    store.getState().ingestMany([
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: '主题', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: '起源', status: 'exploring', branch: 1 } },
    ]);
    expect(store.getState().graph.nodeOrder).toEqual(['core', 'p1']);
    store.getState().reset();
    expect(store.getState().graph.nodeOrder).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `npx vitest run src/flow_chat/research-graph/researchGraphStore.test.ts`
Expected: FAIL。

- [ ] **Step 3: 写实现**

```ts
import { createStore, type StoreApi } from 'zustand/vanilla';
import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import { createInitialGraph, type GraphState, type GraphEvent } from './types';
import { applyGraphEvent } from './applyGraphEvent';

export interface ResearchGraphState {
  graph: GraphState;
  ingest: (e: GraphEvent) => void;
  ingestMany: (es: GraphEvent[]) => void;
  reset: () => void;
}

export type ResearchGraphStore = StoreApi<ResearchGraphState>;

export const createResearchGraphStore = (): ResearchGraphStore =>
  createStore<ResearchGraphState>((set) => ({
    graph: createInitialGraph(),
    ingest: (e) => set((s) => ({ graph: applyGraphEvent(s.graph, e) })),
    ingestMany: (es) => set((s) => ({ graph: es.reduce(applyGraphEvent, s.graph) })),
    reset: () => set({ graph: createInitialGraph() }),
  }));

const StoreContext = createContext<ResearchGraphStore | null>(null);
export const ResearchGraphProvider = StoreContext.Provider;

export function useResearchGraph<T>(selector: (s: ResearchGraphState) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useResearchGraph must be used within ResearchGraphProvider');
  return useStore(store, selector);
}
```

- [ ] **Step 4: 运行,确认通过**

Run: `npx vitest run src/flow_chat/research-graph/researchGraphStore.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/researchGraphStore.ts src/web-ui/src/flow_chat/research-graph/researchGraphStore.test.ts
git commit -m "feat(cosmos): per-canvas research graph store + context"
```

---

## Task 4: 锥形丝带 `ribbon.ts`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/ribbon.ts`
- Test: `src/web-ui/src/flow_chat/research-graph/ribbon.test.ts`

移植自原型 `river-cosmos.html` 的 `ribbon()` 函数(已验证视觉效果)。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { ribbon } from './ribbon';

describe('ribbon', () => {
  it('produces a closed fill path and a centreline starting at p0', () => {
    const { fill, center } = ribbon({ x: 0, y: 0 }, { x: 100, y: 0 }, 15, 6, 1);
    expect(fill.startsWith('M')).toBe(true);
    expect(fill.trim().endsWith('Z')).toBe(true);
    expect(center.startsWith('M0 0C')).toBe(true);
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `npx vitest run src/flow_chat/research-graph/ribbon.test.ts`
Expected: FAIL。

- [ ] **Step 3: 写实现**

```ts
export interface Pt { x: number; y: number }

/** 父→子锥形河道:返回填充多边形 path 与中线贝塞尔 path。w0/w1 = 起止宽度,seed 控制有机弯曲。 */
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
```

- [ ] **Step 4: 运行,确认通过**

Run: `npx vitest run src/flow_chat/research-graph/ribbon.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/ribbon.ts src/web-ui/src/flow_chat/research-graph/ribbon.test.ts
git commit -m "feat(cosmos): tapered river ribbon path builder"
```

---

## Task 5: 放射 + 星系簇布局 `computeLayout.ts`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/computeLayout.ts`
- Test: `src/web-ui/src/flow_chat/research-graph/computeLayout.test.ts`

布局规则:core 在原点;planet 以半径 `PLANET_R` 放射均布;moon 围绕其 planet 以半径 `MOON_R` 在"背向 core"的扇区内均布(形成一簇星系)。确定性、稳定(节点增减不抖动已存在节点的相对角度——按 `nodeOrder` 内的兄弟序号定角)。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { createInitialGraph, type GraphEvent } from './types';
import { applyGraphEvent } from './applyGraphEvent';
import { computeLayout, PLANET_R } from './computeLayout';

const build = (...es: GraphEvent[]) => es.reduce(applyGraphEvent, createInitialGraph());

describe('computeLayout', () => {
  it('places core at the origin', () => {
    const g = build({ t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 } });
    expect(computeLayout(g).get('core')).toEqual({ x: 0, y: 0 });
  });

  it('places planets on the PLANET_R circle around core', () => {
    const g = build(
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'a', status: 'exploring', branch: 1 } },
      { t: 'node.add', node: { id: 'p2', parentId: 'core', kind: 'planet', label: 'b', status: 'exploring', branch: 2 } },
    );
    const pos = computeLayout(g);
    for (const id of ['p1', 'p2']) {
      const p = pos.get(id)!;
      expect(Math.round(Math.hypot(p.x, p.y))).toBe(PLANET_R);
    }
  });

  it('places a moon near its planet, farther from core than the planet', () => {
    const g = build(
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'a', status: 'exploring', branch: 1 } },
      { t: 'node.add', node: { id: 'm1', parentId: 'p1', kind: 'moon', label: 'm', status: 'exploring', branch: 1 } },
    );
    const pos = computeLayout(g);
    const p = pos.get('p1')!, m = pos.get('m1')!;
    expect(Math.hypot(m.x, m.y)).toBeGreaterThan(Math.hypot(p.x, p.y));
    expect(Math.hypot(m.x - p.x, m.y - p.y)).toBeLessThan(PLANET_R); // 紧挨 planet
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `npx vitest run src/flow_chat/research-graph/computeLayout.test.ts`
Expected: FAIL。

- [ ] **Step 3: 写实现**

```ts
import type { GraphState } from './types';
import { childrenOf } from './applyGraphEvent';

export interface XY { x: number; y: number }
export const PLANET_R = 320;
export const MOON_R = 150;

/** 确定性放射 + 星系簇布局。返回每个可见节点的世界坐标。 */
export function computeLayout(state: GraphState): Map<string, XY> {
  const pos = new Map<string, XY>();
  const core = state.nodeOrder.find((id) => state.nodes[id].kind === 'core');
  if (!core) return pos;
  pos.set(core, { x: 0, y: 0 });

  const planets = childrenOf(state, core);
  planets.forEach((pid, i) => {
    // 顶端起算、顺时针均布;留出常量起始角让构图更自然
    const ang = -Math.PI / 2 + (i / Math.max(planets.length, 1)) * Math.PI * 2;
    const px = Math.cos(ang) * PLANET_R, py = Math.sin(ang) * PLANET_R;
    pos.set(pid, { x: px, y: py });

    const moons = childrenOf(state, pid);
    const base = Math.atan2(py, px); // planet 背向 core 的方向
    moons.forEach((mid, j) => {
      const spread = Math.PI * 0.7;
      const a = base - spread / 2 + (moons.length === 1 ? spread / 2 : (j / (moons.length - 1)) * spread);
      pos.set(mid, { x: px + Math.cos(a) * MOON_R, y: py + Math.sin(a) * MOON_R });
    });
  });
  return pos;
}
```

- [ ] **Step 4: 运行,确认通过**

Run: `npx vitest run src/flow_chat/research-graph/computeLayout.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/computeLayout.ts src/web-ui/src/flow_chat/research-graph/computeLayout.test.ts
git commit -m "feat(cosmos): radial + star-cluster layout"
```

---

## Task 6: mock 流 `mockStream.ts`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/mockStream.ts`
- Test: `src/web-ui/src/flow_chat/research-graph/mockStream.test.ts`

- [ ] **Step 1: 写失败测试(用假定时器)**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createInitialGraph } from './types';
import { applyGraphEvent } from './applyGraphEvent';
import { startMockStream } from './mockStream';

describe('startMockStream', () => {
  it('emits a core then planets then citations over time', () => {
    vi.useFakeTimers();
    let graph = createInitialGraph();
    const stop = startMockStream((e) => { graph = applyGraphEvent(graph, e); }, { step: 100 });
    vi.advanceTimersByTime(5000);
    stop();
    expect(graph.nodes.core?.kind).toBe('core');
    expect(graph.nodeOrder.filter((id) => graph.nodes[id].kind === 'planet').length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(graph.citations).length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('stops emitting after stop() is called', () => {
    vi.useFakeTimers();
    let count = 0;
    const stop = startMockStream(() => { count++; }, { step: 100 });
    vi.advanceTimersByTime(300);
    const mid = count;
    stop();
    vi.advanceTimersByTime(3000);
    expect(count).toBe(mid);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `npx vitest run src/flow_chat/research-graph/mockStream.test.ts`
Expected: FAIL。

- [ ] **Step 3: 写实现**

```ts
import type { GraphEvent, Authority } from './types';

const auth = (a: Authority) => a;
const SCRIPT: GraphEvent[] = [
  { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: '调研主题', status: 'exploring', branch: 0 } },
  { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: '起源背景', status: 'exploring', branch: 1 } },
  { t: 'node.add', node: { id: 'p2', parentId: 'core', kind: 'planet', label: '当前格局', status: 'exploring', branch: 2 } },
  { t: 'node.add', node: { id: 'p3', parentId: 'core', kind: 'planet', label: '竞争对手', status: 'exploring', branch: 3 } },
  { t: 'node.add', node: { id: 'p4', parentId: 'core', kind: 'planet', label: '争议焦点', status: 'exploring', branch: 4 } },
  { t: 'node.add', node: { id: 'm11', parentId: 'p1', kind: 'moon', label: '创始时间线', status: 'exploring', branch: 1 } },
  { t: 'cite.add', cite: { id: 'c1', nodeId: 'm11', title: 'Company X 早期访谈', source: 'TechChronicle', author: 'J. Rivera', date: '2019-04', authority: auth('media'), quote: '“我们最初只想解决自己团队的问题。”', url: 'https://techchronicle.example/x' } },
  { t: 'node.add', node: { id: 'm31', parentId: 'p3', kind: 'moon', label: '竞品格局', status: 'exploring', branch: 3 } },
  { t: 'node.add', node: { id: 'm41', parentId: 'p4', kind: 'moon', label: '定价争议', status: 'exploring', branch: 4 } },
  { t: 'cite.add', cite: { id: 'c2', nodeId: 'm41', title: '涨价风波:用户流失了吗?', source: 'The Verge-like', date: '2024-02', authority: auth('media'), quote: '涨价公告后一周内社区集中讨论。', url: 'https://verge.example/x' } },
  { t: 'cite.add', cite: { id: 'c3', nodeId: 'm31', title: '竞品对比初稿', source: 'SectorView', date: '2024-02', authority: auth('media'), quote: '检索完成,得到两条对比来源。', url: 'https://sectorview.example/x' } },
  { t: 'node.update', id: 'm31', patch: { status: 'settled' } },
  { t: 'verdict', nodeId: 'p4', verdict: 'contested' },
  { t: 'report', section: { nodeId: 'p1', heading: '起源背景', body: '2019 年发布,早期定位与现今差异显著。', citeIds: ['c1'] } },
  { t: 'report', section: { nodeId: 'p4', heading: '争议焦点', body: '涨价引发用户流失讨论;监管口径不一。', citeIds: ['c2'] } },
];

export interface MockStreamOptions { step?: number }

/** 按脚本定时发射 GraphEvent。返回 stop()。 */
export function startMockStream(emit: (e: GraphEvent) => void, opts: MockStreamOptions = {}): () => void {
  const step = opts.step ?? 600;
  let i = 0;
  const timer = setInterval(() => {
    if (i >= SCRIPT.length) { clearInterval(timer); return; }
    emit(SCRIPT[i++]);
  }, step);
  return () => clearInterval(timer);
}
```

- [ ] **Step 4: 运行,确认通过**

Run: `npx vitest run src/flow_chat/research-graph/mockStream.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/mockStream.ts src/web-ui/src/flow_chat/research-graph/mockStream.test.ts
git commit -m "feat(cosmos): scripted mock exploration stream"
```

---

## Task 7: 背景层 `Starfield`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/Starfield.tsx`
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/Starfield.scss`

无独立单测(纯展示);在 Task 12 的画布 projection 测试里间接覆盖渲染不报错。

- [ ] **Step 1: 写组件**

`Starfield.tsx` —— 接收 `parallax: {x:number;y:number}`(由画布平移量乘系数传入),渲染星云 + 银河带 + 双层星场。星点在 mount 时用 `useMemo` 随机生成一次。

```tsx
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
```

- [ ] **Step 2: 写样式**

`Starfield.scss` —— 把原型 `river-cosmos.html` `<style>` 中 `#nebula` / `#band` / `.star` / `@keyframes tw` 的数值移植到类 `.cosmos-nebula` / `.cosmos-band` / `.cosmos-star`(选择器改名,数值照搬:星云的多重 `radial-gradient` 紫/青/玫红、银河带 `linear-gradient(118deg,...)`、`@keyframes tw` 闪烁)。`.cosmos-bg`/`.cosmos-stars` 为 `position:absolute;inset:0;pointer-events:none`。

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无新增报错。

- [ ] **Step 4: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/cosmos/Starfield.tsx src/web-ui/src/flow_chat/research-graph/cosmos/Starfield.scss
git commit -m "feat(cosmos): parallax starfield background"
```

---

## Task 8: 星流层 `StarStreams`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/StarStreams.tsx`

- [ ] **Step 1: 写组件**

接收 `graph`、`positions: Map<id,XY>`、`branchColor(branch)=>string`、`hidden:Set<id>`。对每个有 parent 且可见的节点,用 `ribbon()` 画三层:模糊辉光 + 水体 + 流动中线(`stroke-dasharray` + CSS 动画 `cosmos-flow`)。

```tsx
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
```

`@keyframes cosmos-flow{to{stroke-dashoffset:-60}}` 放进 `CosmosCanvas.scss`(Task 10)。

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无新增报错。

- [ ] **Step 3: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/cosmos/StarStreams.tsx
git commit -m "feat(cosmos): star-stream SVG layer"
```

---

## Task 9: 节点 `StarNode`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/StarNode.tsx`

- [ ] **Step 1: 写组件**

接收 `node`、`pos:XY`、`color`、`citeCount:number`、`hasChildren`、`collapsed`、回调 `onPointerDown`(拖拽起手)、`onToggle`、`onOpenCitations`。core 渲染发光星系核,其余渲染 pill(orb + 衬线标签 + `引用 N` + 状态徽标 + 折叠 toggle)。`引用 N`、toggle、核心点击都 `stopPropagation` 以区分拖拽。

```tsx
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
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无新增报错。

- [ ] **Step 3: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/cosmos/StarNode.tsx
git commit -m "feat(cosmos): star node pill"
```

---

## Task 10: 抽屉 `CitationDrawer` + `ReportDrawer`

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/CitationDrawer.tsx`
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/ReportDrawer.tsx`

- [ ] **Step 1: 写 `CitationDrawer.tsx`**

接收 `open`、`title`、`citations: Citation[]`、`accent:string`、`onClose`。列出文献卡:标题、权威度标签、来源·作者·日期、引述、URL 链接。

```tsx
import React from 'react';
import type { Citation, Authority } from '../types';

const AUTH_LABEL: Record<Authority, string> = { primary: '一手', authoritative: '权威', media: '媒体', community: '社区' };

export const CitationDrawer: React.FC<{ open: boolean; title: string; citations: Citation[]; accent: string; onClose: () => void }>
= ({ open, title, citations, accent, onClose }) => (
  <div className={`cosmos-drawer${open ? ' is-open' : ''}`} style={{ ['--cc' as string]: accent } as React.CSSProperties}>
    <div className="cosmos-drawer__close" onClick={onClose}>×</div>
    <div className="cosmos-drawer__head">CITATIONS · {title}</div>
    <div className="cosmos-drawer__title">{title}</div>
    <div className="cosmos-drawer__sub">引用 {citations.length} 篇文献</div>
    {citations.length === 0 && <div className="cosmos-drawer__sub">该节点仍在检索中,暂无引用。</div>}
    {citations.map((c, i) => (
      <div className="cosmos-cite" key={c.id} style={{ animationDelay: `${0.05 + i * 0.07}s` }}>
        <div className="cosmos-cite__title">{c.title}</div>
        <div className="cosmos-cite__row">
          <span className="cosmos-cite__tag">{AUTH_LABEL[c.authority]}</span>
          <span className="cosmos-cite__src">{c.source}{c.author ? ` · ${c.author}` : ''}{c.date ? ` · ${c.date}` : ''}</span>
        </div>
        {c.quote && <div className="cosmos-cite__quote">{c.quote}</div>}
        {c.url && <a className="cosmos-cite__link" href={c.url} target="_blank" rel="noreferrer">{c.url}</a>}
      </div>
    ))}
  </div>
);
```

- [ ] **Step 2: 写 `ReportDrawer.tsx`**

接收 `open`、`sections: ReportSection[]`、`onClose`。逐段渲染(`heading` + `body` + 引用号),`animation-delay` 错峰浮现。

```tsx
import React from 'react';
import type { ReportSection } from '../types';

export const ReportDrawer: React.FC<{ open: boolean; sections: ReportSection[]; onClose: () => void }>
= ({ open, sections, onClose }) => (
  <div className={`cosmos-drawer cosmos-report${open ? ' is-open' : ''}`}>
    <div className="cosmos-drawer__close" onClick={onClose}>×</div>
    <div className="cosmos-drawer__head">DEEP RESEARCH</div>
    <div className="cosmos-drawer__title">研究主题 · 深度报告</div>
    <div className="cosmos-drawer__sub">收束自全部星流</div>
    {sections.map((s, i) => (
      <div className="cosmos-report__sec" key={i} style={{ animationDelay: `${0.12 + i * 0.1}s` }}>
        <h2>{s.heading}</h2>
        <p>{s.body}{s.citeIds.length > 0 && <span className="cosmos-report__cit">{s.citeIds.join(' · ')}</span>}</p>
      </div>
    ))}
  </div>
);
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无新增报错。

- [ ] **Step 4: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/cosmos/CitationDrawer.tsx src/web-ui/src/flow_chat/research-graph/cosmos/ReportDrawer.tsx
git commit -m "feat(cosmos): citation + report drawers"
```

---

## Task 11: 画布容器 `CosmosCanvas`(pan/zoom/drag/折叠 + 组合)

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/CosmosCanvas.tsx`
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/CosmosCanvas.scss`
- Test: `src/web-ui/src/flow_chat/research-graph/cosmos/CosmosCanvas.projection.test.tsx`

- [ ] **Step 1: 写失败的 projection 测试**

```tsx
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CosmosCanvas } from './CosmosCanvas';
import { createResearchGraphStore, ResearchGraphProvider } from '../researchGraphStore';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLElement, root: Root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('CosmosCanvas', () => {
  it('renders core and planet labels from the graph', () => {
    const store = createResearchGraphStore();
    store.getState().ingestMany([
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: '主题X', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: '起源Y', status: 'exploring', branch: 1 } },
    ]);
    act(() => { root.render(<ResearchGraphProvider value={store}><CosmosCanvas /></ResearchGraphProvider>); });
    expect(container.textContent).toContain('主题X');
    expect(container.textContent).toContain('起源Y');
  });
});
```

- [ ] **Step 2: 运行,确认失败**

Run: `npx vitest run src/flow_chat/research-graph/cosmos/CosmosCanvas.projection.test.tsx`
Expected: FAIL — `CosmosCanvas` 未定义。

- [ ] **Step 3: 写实现**

容器持有视图状态 `{tx,ty,s}`、拖拽 override 坐标 `Map<id,XY>`、`hidden:Set`、抽屉状态。`positions` = `computeLayout(graph)` 与 override 合并。交互逻辑移植自原型 `river-cosmos.html` 的 pan/zoom/drag/click 区分(移动 <5px 视为点击 → 开引用;core 点击 → 开报告)、HUD 按钮(缩放/复位/自适应/折叠由节点 toggle)。分支配色 `branchColor`:`['#5fe0ff','#b48cff','#ffc861','#ff8fc7','#5fffd0'][(branch-1)%5]`。

```tsx
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

const BRANCH = ['#5fe0ff', '#b48cff', '#ffc861', '#ff8fc7', '#5fffd0'];
const branchColor = (b: number) => BRANCH[((b - 1) % BRANCH.length + BRANCH.length) % BRANCH.length] || '#5fe0ff';
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

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

  // pan
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
  const onVpPointerUp = (e: React.PointerEvent) => { pan.current = null; onDragEnd(); };
  const onWheel = (e: React.WheelEvent) => {
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setView((v) => {
      const ns = clamp(v.s * f, 0.35, 2.4);
      const lx = (e.clientX - v.tx) / v.s, ly = (e.clientY - v.ty) / v.s;
      return { s: ns, tx: e.clientX - ns * lx, ty: e.clientY - ns * ly };
    });
  };

  // node drag + click
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

  const toggle = (id: string) => setHidden((h) => { const n = new Set(h); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const isHidden = (n: ResearchNode): boolean => { let p = n.parentId; while (p) { if (hidden.has(p)) return true; p = graph.nodes[p]?.parentId ?? null; } return false; };
  const zoom = (f: number) => setView((v) => { const ns = clamp(v.s * f, 0.35, 2.4); const cx = innerWidth / 2, cy = innerHeight / 2; return { s: ns, tx: cx - ns * ((cx - v.tx) / v.s), ty: cy - ns * ((cy - v.ty) / v.s) }; });

  return (
    <div className="cosmos-viewport" ref={vpRef} onPointerDown={onVpPointerDown} onPointerMove={onVpPointerMove} onPointerUp={onVpPointerUp} onWheel={onWheel}>
      <Starfield parallax={{ x: view.tx, y: view.ty }} />
      <div className="cosmos-world" style={{ transform: `translate(${view.tx}px,${view.ty}px) scale(${view.s})` }}>
        <div className="cosmos-origin">
          <StarStreams graph={graph} positions={positions} branchColor={branchColor} hidden={hidden} />
          {graph.nodeOrder.map((id) => {
            const n = graph.nodes[id]; const pos = positions.get(id);
            if (!pos || isHidden(n)) return null;
            return (
              <StarNode key={id} node={n} pos={pos}
                color={n.kind === 'core' ? '#ffe6a8' : branchColor(n.branch)}
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
        <button className="cosmos-btn" onClick={() => setView({ tx: 0, ty: 0, s: 0.92 })}>复位</button>
        <button className="cosmos-btn cosmos-btn--warm" onClick={() => setReportOpen(true)}>⟢ 收束成报告</button>
        <div className="cosmos-hud__hint">拖星体移动 · 滚轮缩放 · 拖空平移<br/>点「引用 N」看文献 · 点核心收束</div>
      </div>

      <CitationDrawer open={!!citeFor} title={citeFor?.label ?? ''} citations={citeFor ? citationsFor(citeFor) : []}
        accent={citeFor ? branchColor(citeFor.branch) : '#5fe0ff'} onClose={() => setCiteFor(null)} />
      <ReportDrawer open={reportOpen} sections={graph.report} onClose={() => setReportOpen(false)} />
    </div>
  );
};
```

- [ ] **Step 4: 写样式 `CosmosCanvas.scss`**

移植原型 `<style>` 的其余部分到带 `cosmos-` 前缀的类:`.cosmos-viewport`(深空底)、`.cosmos-world`(`transform-origin:0 0`)、`.cosmos-origin`(`left:50%;top:50%`)、`.cosmos-node`/`.cosmos-pill`/`.cosmos-orb`/`.cosmos-label`/`.cosmos-cites`/`.cosmos-toggle`/`.cosmos-badge`(flow/contested)、`.cosmos-galcore`(金白辐射核 + 涟漪)、`.cosmos-hud`/`.cosmos-panel`/`.cosmos-btn`、`.cosmos-drawer`/`.cosmos-cite`/`.cosmos-report`。并加 `@keyframes cosmos-flow{to{stroke-dashoffset:-60}}`、`rise`、`pulse`、`ripple`、`secIn`。字体引入沿用项目全局或在此 `@import` Google Fonts(Fraunces / IBM Plex Mono / Noto Serif SC)。

- [ ] **Step 5: 运行测试,确认通过**

Run: `npx vitest run src/flow_chat/research-graph/cosmos/CosmosCanvas.projection.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/cosmos/CosmosCanvas.tsx src/web-ui/src/flow_chat/research-graph/cosmos/CosmosCanvas.scss src/web-ui/src/flow_chat/research-graph/cosmos/CosmosCanvas.projection.test.tsx
git commit -m "feat(cosmos): interactive canvas container (pan/zoom/drag/collapse)"
```

---

## Task 12: 面板入口 `CosmosCanvasPanel` + 注册到 panel 系统

**Files:**
- Create: `src/web-ui/src/flow_chat/research-graph/cosmos/CosmosCanvasPanel.tsx`
- Modify: `src/web-ui/src/app/components/panels/base/types.ts`(union 加 `'cosmos-canvas'`)
- Modify: `src/web-ui/src/app/components/panels/base/FlexiblePanel.tsx`(switch 加 case)

- [ ] **Step 1: 写 `CosmosCanvasPanel.tsx`**

建 per-mount store;若 `data?.source === 'mock'` 则 mount 时 `startMockStream` 注入,unmount 时 stop;渲染 `<ResearchGraphProvider value={store}><CosmosCanvas/></ResearchGraphProvider>`。

```tsx
import React, { useEffect, useRef } from 'react';
import { createResearchGraphStore, ResearchGraphProvider } from '../researchGraphStore';
import { CosmosCanvas } from './CosmosCanvas';
import { startMockStream } from '../mockStream';

export const CosmosCanvasPanel: React.FC<{ data?: { source?: string } }> = ({ data }) => {
  const storeRef = useRef(createResearchGraphStore());
  useEffect(() => {
    if (data?.source !== 'mock') return;
    storeRef.current.getState().reset();
    const stop = startMockStream((e) => storeRef.current.getState().ingest(e), { step: 650 });
    return stop;
  }, [data?.source]);
  return (
    <ResearchGraphProvider value={storeRef.current}>
      <CosmosCanvas />
    </ResearchGraphProvider>
  );
};
```

- [ ] **Step 2: 注册 content type**

`panels/base/types.ts` 的 `PanelContentType` 联合末尾加一行:

```ts
  | 'design-tokens-studio'
  | 'cosmos-canvas';
```

- [ ] **Step 3: 加渲染 case**

`FlexiblePanel.tsx` 顶部 import:

```ts
import { CosmosCanvasPanel } from '@/flow_chat/research-graph/cosmos/CosmosCanvasPanel';
```

在 `switch (content.type)` 里(例如 `case 'design-tokens-studio'` 之后、`default` 之前)加:

```tsx
      case 'cosmos-canvas': {
        return <CosmosCanvasPanel data={content.data} />;
      }
```

- [ ] **Step 4: 类型检查 + 全量测试**

Run: `npx tsc --noEmit && npx vitest run src/flow_chat/research-graph`
Expected: 类型无新增报错;research-graph 全部测试 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/web-ui/src/flow_chat/research-graph/cosmos/CosmosCanvasPanel.tsx src/web-ui/src/app/components/panels/base/types.ts src/web-ui/src/app/components/panels/base/FlexiblePanel.tsx
git commit -m "feat(cosmos): register cosmos-canvas panel content type"
```

---

## Task 13: 临时 dev 启动器(让你能立刻用上)

> 子项目 B 把真实 GraphEvent 流接进来后,此任务的改动整体移除。

**Files:**
- Modify: `src/web-ui/src/flow_chat/components/WelcomePanel.tsx`

- [ ] **Step 1: 加临时按钮**

在 `WelcomePanel` 顶部 import `TAB_EVENTS`:

```ts
import { TAB_EVENTS } from '@/app/components/panels/content-canvas/types/content';
```

在欢迎面板的操作区加一个明显标注 `DEV` 的按钮,点击派发打开 mock 星河面板:

```tsx
{/* DEV-ONLY:cosmos mock — 子项目B 接真实流后删除 */}
<button
  type="button"
  className="cosmos-dev-launch"
  onClick={() => window.dispatchEvent(new CustomEvent(TAB_EVENTS.AGENT_CREATE_TAB, {
    detail: { type: 'cosmos-canvas', title: '研究星河', data: { source: 'mock' } },
  }))}
>
  ▶ 打开研究星河(DEV·mock)
</button>
```

- [ ] **Step 2: 手动验证(关键 — 确认 aux pane 真的承接事件)**

Run: `npm run dev`(在 `src/web-ui/`)
打开 deep-research 场景,点 "打开研究星河(DEV·mock)":
- **预期:** 右侧 aux pane 出现 cosmos-canvas 标签页,星河随 mock 流逐步生长,可拖拽/缩放/点引用看文献/点核心出报告。
- **若 aux pane 未承接该事件**(deep-research profile 未挂 content-canvas 监听):改为在已知监听 `AGENT_CREATE_TAB` 的场景(dispatcher/coding,含 content-canvas)验证;并在子项目 B 的计划里补一条"为 deep-research profile 挂载 cosmos aux tab"的集成任务。记录实际结果到本任务下方。

- [ ] **Step 3: 提交**

```bash
git add src/web-ui/src/flow_chat/components/WelcomePanel.tsx
git commit -m "chore(cosmos): temporary dev launcher for mock river canvas"
```

---

## 验收(子项目 A 完成标准)

- [ ] `npx vitest run src/flow_chat/research-graph` 全绿(types/reducer/store/ribbon/layout/mockStream/canvas projection)。
- [ ] `npx tsc --noEmit` 无新增报错。
- [ ] dev 启动器能打开星河面板,mock 流驱动下:节点放射 + 星系簇、星流流动、节点可拖拽重布线、滚轮缩放、折叠、点引用看文献详情、点核心出报告。

## 后续(不在本计划)

- **子项目 B**:演进 deep research agent 按 `GraphEvent` schema 流式产出(探索发 node/cite,轻量收束发 verdict/report);Rust 侧 schema 镜像 + 标记解析器;把 cosmos aux tab 正式挂到 deep-research profile,移除 Task 13 的 dev 启动器。
- 升级:重型收束(辩论/仲裁/事实核查分级)、布局持久化、小地图、报告导出。
```
