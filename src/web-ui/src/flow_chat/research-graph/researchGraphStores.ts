import { createResearchGraphStore, type ResearchGraphStore } from './researchGraphStore';

/** Process-wide registry of research-graph stores keyed by session id, so the
 *  streaming layer and the canvas panel share one store per research session. */
const stores = new Map<string, ResearchGraphStore>();

export function getResearchGraphStore(sessionId: string): ResearchGraphStore {
  let store = stores.get(sessionId);
  if (!store) {
    store = createResearchGraphStore();
    stores.set(sessionId, store);
  }
  return store;
}

export function resetResearchGraphStore(sessionId: string): void {
  stores.get(sessionId)?.getState().reset();
}

export function disposeResearchGraphStore(sessionId: string): void {
  stores.delete(sessionId);
}
