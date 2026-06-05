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
