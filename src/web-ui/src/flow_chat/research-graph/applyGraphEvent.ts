import { produce } from 'immer';
import type { GraphState, GraphEvent } from './types';

export const applyGraphEvent = (state: GraphState, event: GraphEvent): GraphState =>
  produce(state, (draft) => {
    switch (event.t) {
      case 'node.add': {
        if (draft.nodes[event.node.id]) return;
        draft.nodes[event.node.id] = event.node;
        draft.nodeOrder.push(event.node.id);
        if (!draft.citeByNode[event.node.id]) draft.citeByNode[event.node.id] = [];
        break;
      }
      case 'node.update': {
        const n = draft.nodes[event.id];
        if (n) Object.assign(n, event.patch);
        break;
      }
      case 'cite.add': {
        if (draft.citations[event.cite.id]) return;
        draft.citations[event.cite.id] = event.cite;
        (draft.citeByNode[event.cite.nodeId] ??= []).push(event.cite.id);
        break;
      }
      case 'verdict': {
        const n = draft.nodes[event.nodeId];
        if (n) n.status = event.verdict === 'decided' ? 'settled' : event.verdict;
        break;
      }
      case 'report': {
        draft.report.push(event.section);
        break;
      }
    }
  });

export const childrenOf = (state: GraphState, id: string): string[] =>
  state.nodeOrder.filter((nid) => state.nodes[nid]?.parentId === id);

export const citeCount = (state: GraphState, id: string): number => {
  if (!state.nodes[id]) return 0;
  let n = state.citeByNode[id]?.length ?? 0;
  for (const child of childrenOf(state, id)) n += citeCount(state, child);
  return n;
};
