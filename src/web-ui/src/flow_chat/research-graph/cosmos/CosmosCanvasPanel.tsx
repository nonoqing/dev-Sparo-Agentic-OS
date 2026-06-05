import React, { useEffect, useRef } from 'react';
import { createResearchGraphStore, ResearchGraphProvider } from '../researchGraphStore';
import { getResearchGraphStore } from '../researchGraphStores';
import { CosmosCanvas } from './CosmosCanvas';
import { startMockStream } from '../mockStream';

/**
 * Aux-pane host for the constellation canvas.
 * - `data.sessionId`: bind to that session's LIVE research-graph store (filled by the stream).
 * - `data.source === 'mock'`: standalone preview driven by the scripted mock stream.
 * - neither: an empty private store.
 */
export const CosmosCanvasPanel: React.FC<{ data?: { source?: string; sessionId?: string } }> = ({ data }) => {
  const ownStoreRef = useRef(createResearchGraphStore());
  const store = data?.sessionId ? getResearchGraphStore(data.sessionId) : ownStoreRef.current;

  useEffect(() => {
    if (data?.sessionId || data?.source !== 'mock') return;
    ownStoreRef.current.getState().reset();
    const stop = startMockStream((e) => ownStoreRef.current.getState().ingest(e), { step: 650 });
    return stop;
  }, [data?.source, data?.sessionId]);

  return (
    <ResearchGraphProvider value={store}>
      <CosmosCanvas />
    </ResearchGraphProvider>
  );
};
