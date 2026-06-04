import type { GraphEvent, Authority, NodeKind, NodeStatus } from './types';

const AUTHORITIES = new Set<string>(['primary', 'authoritative', 'media', 'community']);
const STATUSES = new Set<string>(['exploring', 'settled', 'contested', 'gap', 'tentative']);
const KINDS = new Set<string>(['planet', 'moon']);

/** Parse `[[DR:...]]` markers out of a text fragment into GraphEvents, returning the text with markers removed. Assumes markers are complete (not split across the boundary). */
export function parseDrMarkers(text: string): { events: GraphEvent[]; cleanedText: string } {
  const events: GraphEvent[] = [];
  const cleanedText = text.replace(/\[\[DR:([^\n]*?)\]\]/g, (_match, body: string) => {
    const ev = toEvent(body);
    if (ev) events.push(ev);
    return '';
  });
  return { events, cleanedText };
}

function toEvent(body: string): GraphEvent | null {
  const p = body.split('|');
  switch (p[0]) {
    case 'CORE': {
      const title = p[1]?.trim();
      if (!title) return null;
      return { t: 'node.add', node: { id: 'core', parentId: null, kind: 'core', label: title, status: 'exploring', branch: 0 } };
    }
    case 'NODE': {
      const [, id, parent, k, label] = p;
      if (!id || !parent || !KINDS.has(k) || !label) return null;
      return { t: 'node.add', node: { id: id.trim(), parentId: parent === 'core' ? 'core' : parent.trim(), kind: k as NodeKind, label: label.trim(), status: 'exploring', branch: 0 } };
    }
    case 'CITE': {
      const [, id, nodeId, authority, title, source, url] = p;
      if (!id || !nodeId || !AUTHORITIES.has(authority) || !title) return null;
      return { t: 'cite.add', cite: { id: id.trim(), nodeId: nodeId.trim(), authority: authority as Authority, title: title.trim(), source: (source ?? '').trim(), url: url?.trim() || undefined } };
    }
    case 'STATUS': {
      const [, nodeId, status] = p;
      if (!nodeId || !STATUSES.has(status)) return null;
      return { t: 'node.update', id: nodeId.trim(), patch: { status: status as NodeStatus } };
    }
    default:
      return null; // PHASE and unknown kinds: no event
  }
}
