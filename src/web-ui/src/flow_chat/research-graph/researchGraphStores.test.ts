import { describe, expect, it, beforeEach } from 'vitest';
import { getResearchGraphStore, resetResearchGraphStore, disposeResearchGraphStore } from './researchGraphStores';

describe('researchGraphStores registry', () => {
  beforeEach(() => { disposeResearchGraphStore('s1'); disposeResearchGraphStore('s2'); });

  it('returns the same store instance for the same sessionId', () => {
    const a = getResearchGraphStore('s1');
    const b = getResearchGraphStore('s1');
    expect(a).toBe(b);
  });

  it('returns distinct stores for different sessionIds', () => {
    expect(getResearchGraphStore('s1')).not.toBe(getResearchGraphStore('s2'));
  });

  it('reset clears a session graph without replacing the instance', () => {
    const store = getResearchGraphStore('s1');
    store.getState().ingest({ t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: 'x', status: 'exploring', branch: 0 } });
    expect(store.getState().graph.nodeOrder).toEqual(['core']);
    resetResearchGraphStore('s1');
    expect(store.getState().graph.nodeOrder).toEqual([]);
    expect(getResearchGraphStore('s1')).toBe(store);
  });

  it('dispose removes the session so a fresh store is created next time', () => {
    const store = getResearchGraphStore('s1');
    disposeResearchGraphStore('s1');
    expect(getResearchGraphStore('s1')).not.toBe(store);
  });
});
