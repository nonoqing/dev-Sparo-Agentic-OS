import { describe, expect, it } from 'vitest';
import { parseDrMarkers } from './markerBridge';

describe('parseDrMarkers', () => {
  it('parses CORE into a core node.add and strips the marker', () => {
    const { events, cleanedText } = parseDrMarkers('开始研究 [[DR:CORE|电动车市场]] 现在');
    expect(events).toEqual([
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: '电动车市场', status: 'exploring', branch: 0 } },
    ]);
    expect(cleanedText).toBe('开始研究  现在');
  });

  it('parses NODE planet (parent core) and moon (parent node)', () => {
    const { events } = parseDrMarkers('[[DR:NODE|p1|core|planet|起源背景]][[DR:NODE|m1|p1|moon|创始时间线]]');
    expect(events).toEqual([
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: '起源背景', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'm1', parentId: 'p1', kind: 'moon', label: '创始时间线', status: 'exploring', branch: 0 } },
    ]);
  });

  it('parses CITE into cite.add', () => {
    const { events } = parseDrMarkers('[[DR:CITE|c1|p1|media|涨价风波|TheVerge|https://x.example/a]]');
    expect(events).toEqual([
      { t: 'cite.add', cite: { id: 'c1', nodeId: 'p1', authority: 'media', title: '涨价风波', source: 'TheVerge', url: 'https://x.example/a' } },
    ]);
  });

  it('parses STATUS into node.update', () => {
    const { events } = parseDrMarkers('[[DR:STATUS|p1|settled]]');
    expect(events).toEqual([{ t: 'node.update', id: 'p1', patch: { status: 'settled' } }]);
  });

  it('ignores PHASE (no event) but strips it', () => {
    const { events, cleanedText } = parseDrMarkers('a[[DR:PHASE|phase-1]]b');
    expect(events).toEqual([]);
    expect(cleanedText).toBe('ab');
  });

  it('skips malformed markers (bad authority / missing fields) but still strips them', () => {
    const { events, cleanedText } = parseDrMarkers('x[[DR:CITE|c1|p1|bogus|t|s|u]]y[[DR:NODE|onlyid]]z');
    expect(events).toEqual([]);
    expect(cleanedText).toBe('xyz');
  });

  it('returns text unchanged when there are no markers', () => {
    const { events, cleanedText } = parseDrMarkers('plain text, no markers');
    expect(events).toEqual([]);
    expect(cleanedText).toBe('plain text, no markers');
  });
});
