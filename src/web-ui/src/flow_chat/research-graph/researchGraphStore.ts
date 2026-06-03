import { createStore, type StoreApi } from 'zustand/vanilla';
import { createContext, useContext } from 'react';
import { useStore } from 'zustand/react';
import { createInitialGraph, type GraphState, type GraphEvent } from './types';
import { applyGraphEvent } from './applyGraphEvent';

export interface ResearchGraphState {
  graph: GraphState;
  ingest: (e: GraphEvent) => void;
  ingestMany: (es: GraphEvent[]) => void;
  reset: () => void;
}

export type ResearchGraphStore = StoreApi<ResearchGraphState>;

export const createResearchGraphStore = (): ResearchGraphStore =>
  createStore<ResearchGraphState>((set) => ({
    graph: createInitialGraph(),
    ingest: (e) => set((s) => ({ graph: applyGraphEvent(s.graph, e) })),
    ingestMany: (es) => set((s) => ({ graph: es.reduce(applyGraphEvent, s.graph) })),
    reset: () => set({ graph: createInitialGraph() }),
  }));

const StoreContext = createContext<ResearchGraphStore | null>(null);
export const ResearchGraphProvider = StoreContext.Provider;

export function useResearchGraph<T>(selector: (s: ResearchGraphState) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useResearchGraph must be used within ResearchGraphProvider');
  return useStore(store, selector);
}
