import { parseDrMarkers } from './markerBridge';
import { getResearchGraphStore } from './researchGraphStores';
import { TAB_EVENTS } from '@/app/components/panels/content-canvas/types/content';

/** Sessions whose constellation panel has already been auto-opened (avoid duplicate tabs). */
const openedPanels = new Set<string>();

/** Open the constellation aux tab for a session once its research graph has content. */
function ensureCanvasOpen(sessionId: string): void {
  if (openedPanels.has(sessionId)) return;
  openedPanels.add(sessionId);
  try {
    window.dispatchEvent(
      new CustomEvent(TAB_EVENTS.AGENT_CREATE_TAB, {
        detail: { type: 'cosmos-canvas', title: '研究星座', data: { sessionId } },
      }),
    );
  } catch {
    /* non-browser env (e.g. unit tests) — ignore */
  }
}

/**
 * Parse `[[DR:...]]` markers out of a Deep Research assistant message, ingest the
 * resulting GraphEvents into that session's research-graph store, and return the
 * text with the markers stripped (so they never render in chat).
 *
 * Designed to be called with the FULL accumulated assistant text for the current
 * message on every streaming update: the reducer ignores duplicate `node.add` /
 * `cite.add` by id and `node.update` is idempotent, so re-parsing the whole text
 * each time is safe and avoids cross-chunk marker-splitting problems.
 *
 * Never throws: if parsing/ingestion fails for any reason it returns the original
 * text unchanged so chat rendering is never broken.
 */
export function ingestResearchMarkers(sessionId: string, fullAssistantText: string): string {
  try {
    const { events, cleanedText } = parseDrMarkers(fullAssistantText);
    if (events.length > 0) {
      const store = getResearchGraphStore(sessionId);
      store.getState().ingestMany(events);
      if (store.getState().graph.nodeOrder.length > 0) ensureCanvasOpen(sessionId);
    }
    return cleanedText;
  } catch {
    return fullAssistantText;
  }
}
