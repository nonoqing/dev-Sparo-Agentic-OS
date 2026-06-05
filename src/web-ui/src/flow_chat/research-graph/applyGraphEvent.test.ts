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
    expect(citeCount(g, 'p1')).toBe(2);
  });

  it('maps verdict to node status and appends report sections', () => {
    const g = ev(
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: 'p', status: 'exploring', branch: 1 } },
      { t: 'verdict', nodeId: 'p1', verdict: 'decided' },
      { t: 'report', section: { nodeId: 'p1', heading: 'H', body: 'B', citeIds: ['c1'] } },
    );
    expect(g.nodes.p1.status).toBe('settled');
    expect(g.report).toHaveLength(1);
    expect(g.report[0].heading).toBe('H');
  });

  it('anchors nodes with missing parents to core so they remain visible', () => {
    const g = ev(
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: '主题', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'orphan', parentId: 'missing', kind: 'moon', label: '孤儿', status: 'exploring', branch: 1 } },
    );
    expect(g.nodes.orphan.parentId).toBe('core');
    expect(childrenOf(g, 'core')).toEqual(['orphan']);
  });
});
