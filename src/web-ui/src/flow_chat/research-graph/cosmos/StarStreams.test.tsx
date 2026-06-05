import { describe, expect, it } from 'vitest';
import { createInitialGraph } from '../types';
import { StarStreams } from './StarStreams';
import type { XY } from '../computeLayout';

const graph = createInitialGraph();
graph.nodes.core = { id: 'core', parentId: null, kind: 'core', label: 'core', status: 'settled', branch: 0 };
graph.nodes.p1 = { id: 'p1', parentId: 'core', kind: 'planet', label: 'p1', status: 'settled', branch: 1 };
graph.nodes.m1 = { id: 'm1', parentId: 'p1', kind: 'moon', label: 'm1', status: 'settled', branch: 1 };
graph.nodeOrder = ['core', 'p1', 'm1'];

const positions = new Map<string, XY>([
  ['core', { x: 0, y: 0 }],
  ['p1', { x: 100, y: 0 }],
  ['m1', { x: 180, y: 40 }],
]);

describe('StarStreams', () => {
  it('keeps the collapsed node connected to its parent and hides descendant streams', () => {
    const output = StarStreams({ graph, positions, hidden: new Set(['p1']) }) as React.ReactElement;
    expect(output.props.children).toHaveLength(1);
    expect(output.props.children[0].key).toBe('p1');
  });
});