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
