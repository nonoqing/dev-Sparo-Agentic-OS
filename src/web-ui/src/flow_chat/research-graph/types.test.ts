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
