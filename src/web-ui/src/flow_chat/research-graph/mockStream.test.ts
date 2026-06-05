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
