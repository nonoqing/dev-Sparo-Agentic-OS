/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CosmosCanvas } from './CosmosCanvas';
import { createResearchGraphStore, ResearchGraphProvider } from '../researchGraphStore';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLElement, root: Root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('CosmosCanvas', () => {
  it('renders core and planet labels from the graph', () => {
    const store = createResearchGraphStore();
    store.getState().ingestMany([
      { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: '主题X', status: 'exploring', branch: 0 } },
      { t: 'node.add', node: { id: 'p1', parentId: 'core', kind: 'planet', label: '起源Y', status: 'exploring', branch: 1 } },
    ]);
    act(() => { root.render(<ResearchGraphProvider value={store}><CosmosCanvas /></ResearchGraphProvider>); });
    expect(container.textContent).toContain('主题X');
    expect(container.textContent).toContain('起源Y');
  });
});
