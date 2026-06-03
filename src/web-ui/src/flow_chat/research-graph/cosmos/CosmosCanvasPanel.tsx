import React, { useEffect, useRef } from 'react';
import { createResearchGraphStore, ResearchGraphProvider } from '../researchGraphStore';
import { CosmosCanvas } from './CosmosCanvas';
import { startMockStream } from '../mockStream';

export const CosmosCanvasPanel: React.FC<{ data?: { source?: string } }> = ({ data }) => {
  const storeRef = useRef(createResearchGraphStore());
  useEffect(() => {
    if (data?.source !== 'mock') return;
    storeRef.current.getState().reset();
    const stop = startMockStream((e) => storeRef.current.getState().ingest(e), { step: 650 });
    return stop;
  }, [data?.source]);
  return (
    <ResearchGraphProvider value={storeRef.current}>
      <CosmosCanvas />
    </ResearchGraphProvider>
  );
};
