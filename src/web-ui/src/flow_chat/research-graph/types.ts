export type Verdict = 'decided' | 'contested' | 'gap' | 'tentative';
export type NodeKind = 'core' | 'planet' | 'moon';
export type NodeStatus = 'exploring' | 'settled' | 'contested' | 'gap' | 'tentative';
export type Authority = 'primary' | 'authoritative' | 'media' | 'community';

export interface ResearchNode {
  id: string;
  parentId: string | null; // null = core
  kind: NodeKind;
  label: string;
  status: NodeStatus;
  branch: number; // 1..5 color group (inherited from owning planet)
}

export interface Citation {
  id: string;
  nodeId: string;
  title: string;
  source: string;
  author?: string;
  date?: string;
  authority: Authority;
  quote?: string;
  url?: string;
  corroborated?: boolean;
}

export interface ReportSection {
  nodeId: string;
  heading: string;
  body: string;
  citeIds: string[];
}

export type GraphEvent =
  | { t: 'node.add'; node: ResearchNode }
  | { t: 'node.update'; id: string; patch: Partial<ResearchNode> }
  | { t: 'cite.add'; cite: Citation }
  | { t: 'verdict'; nodeId: string; verdict: Verdict }
  | { t: 'report'; section: ReportSection };

export interface GraphState {
  nodes: Record<string, ResearchNode>;
  nodeOrder: string[];
  citations: Record<string, Citation>;
  citeByNode: Record<string, string[]>;
  report: ReportSection[];
}

export const createInitialGraph = (): GraphState => ({
  nodes: {},
  nodeOrder: [],
  citations: {},
  citeByNode: {},
  report: [],
});
