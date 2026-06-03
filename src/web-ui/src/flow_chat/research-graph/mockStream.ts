import type { GraphEvent, Authority } from './types';

const auth = (a: Authority) => a;
const SCRIPT: GraphEvent[] = [
  { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: '调研主题', status: 'exploring', branch: 0 } },
  { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: '起源背景', status: 'exploring', branch: 1 } },
  { t: 'node.add', node: { id: 'p2', parentId: 'core', kind: 'planet', label: '当前格局', status: 'exploring', branch: 2 } },
  { t: 'node.add', node: { id: 'p3', parentId: 'core', kind: 'planet', label: '竞争对手', status: 'exploring', branch: 3 } },
  { t: 'node.add', node: { id: 'p4', parentId: 'core', kind: 'planet', label: '争议焦点', status: 'exploring', branch: 4 } },
  { t: 'node.add', node: { id: 'm11', parentId: 'p1', kind: 'moon', label: '创始时间线', status: 'exploring', branch: 1 } },
  { t: 'cite.add', cite: { id: 'c1', nodeId: 'm11', title: 'Company X 早期访谈', source: 'TechChronicle', author: 'J. Rivera', date: '2019-04', authority: auth('media'), quote: '"我们最初只想解决自己团队的问题。"', url: 'https://techchronicle.example/x' } },
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

/** Emit GraphEvents from a script on a timer. Returns stop(). */
export function startMockStream(emit: (e: GraphEvent) => void, opts: MockStreamOptions = {}): () => void {
  const step = opts.step ?? 600;
  let i = 0;
  const timer = setInterval(() => {
    if (i >= SCRIPT.length) { clearInterval(timer); return; }
    emit(SCRIPT[i++]);
  }, step);
  return () => clearInterval(timer);
}
