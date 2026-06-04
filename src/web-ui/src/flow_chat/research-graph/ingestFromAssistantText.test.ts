import { describe, expect, it, beforeEach } from 'vitest';
import { ingestResearchMarkers } from './ingestFromAssistantText';
import { getResearchGraphStore, disposeResearchGraphStore } from './researchGraphStores';

describe('ingestResearchMarkers', () => {
  beforeEach(() => {
    disposeResearchGraphStore('s1');
  });

  it('strips markers from the returned text', () => {
    const text = 'Intro [[DR:CORE|My Topic]] middle [[DR:NODE|n1|core|planet|Sub Area]] end';
    const cleaned = ingestResearchMarkers('s1', text);
    expect(cleaned).not.toContain('[[DR:');
    expect(cleaned).toContain('Intro');
    expect(cleaned).toContain('middle');
    expect(cleaned).toContain('end');
  });

  it('ingests nodes and citations into the session store', () => {
    const text =
      '[[DR:CORE|My Topic]]' +
      '[[DR:NODE|n1|core|planet|Sub Area]]' +
      '[[DR:CITE|c1|n1|primary|Some Source|Publisher|https://example.com]]' +
      '[[DR:STATUS|n1|settled]]';
    ingestResearchMarkers('s1', text);

    const graph = getResearchGraphStore('s1').getState().graph;
    expect(graph.nodeOrder).toEqual(['core', 'n1']);
    expect(graph.nodes.core.kind).toBe('core');
    expect(graph.nodes.n1.label).toBe('Sub Area');
    expect(graph.nodes.n1.status).toBe('settled');
    expect(graph.citations.c1.nodeId).toBe('n1');
    expect(graph.citations.c1.url).toBe('https://example.com');
    expect(graph.citeByNode.n1).toEqual(['c1']);
  });

  it('is idempotent across cumulative reparses of growing text', () => {
    const part1 = '[[DR:CORE|My Topic]][[DR:NODE|n1|core|planet|Sub Area]]';
    const part2 = part1 + '[[DR:NODE|n2|core|planet|Second Area]]';

    ingestResearchMarkers('s1', part1);
    ingestResearchMarkers('s1', part1); // duplicate cumulative reparse
    ingestResearchMarkers('s1', part2);

    const graph = getResearchGraphStore('s1').getState().graph;
    expect(graph.nodeOrder).toEqual(['core', 'n1', 'n2']);
  });

  it('returns text unchanged when there are no markers', () => {
    const text = 'Just plain assistant prose with no markers.';
    expect(ingestResearchMarkers('s1', text)).toBe(text);
    expect(getResearchGraphStore('s1').getState().graph.nodeOrder).toEqual([]);
  });
});
