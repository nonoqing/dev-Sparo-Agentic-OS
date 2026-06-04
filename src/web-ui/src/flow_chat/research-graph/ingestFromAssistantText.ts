import { parseDrMarkers } from './markerBridge';
import { getResearchGraphStore } from './researchGraphStores';

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
      getResearchGraphStore(sessionId).getState().ingestMany(events);
    }
    return cleanedText;
  } catch {
    return fullAssistantText;
  }
}
