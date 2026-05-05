export type NodeType = 'source' | 'destination' | 'sub';

export interface FlowNodeData {
  id: string;
  type: NodeType;
  name: string;
  account: string;
  amount: number;
  color?: string;
  x?: number;
  y?: number;

  // For sub nodes: parent destination id (1:1)
  parentNodeId?: string;

  // For destination nodes: optional group membership (1 group max)
  groupId?: string;

  // Multi-member canvases
  memberId?: string;
  isShared?: boolean;
}

export interface FlowEdgeData {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  sourceHandleId?: string;
  targetHandleId?: string;
}

export type MemberType = 'family' | 'friend' | 'lover' | 'spouse';
export type CanvasGoal = 'household' | 'date_account' | 'travel' | 'investment' | 'other';

export interface CanvasMember {
  id: string;
  name: string;
}

export interface CanvasMeta {
  id: string;
  name: string;
  memberType: MemberType;
  members: CanvasMember[];
  goal: CanvasGoal;
  createdAt: string;
  updatedAt: string;
  /** Custom area boundaries (multi-member). If undefined, uses defaults. */
  areaBounds?: { sharedXMin: number; sharedXMax: number };
}

export interface Group {
  id: string;
  // Normalized matching key (name + account)
  matchName: string;
  matchAccount: string;
  // Member node ids (destination nodes)
  nodeIds: string[];
  /** Custom box bounds. If undefined, auto-fit to members. */
  bounds?: { minX: number; minY: number; maxX: number; maxY: number };
}

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  family: '가족',
  friend: '친구',
  lover: '연인',
  spouse: '배우자',
};

export const CANVAS_GOAL_LABELS: Record<CanvasGoal, string> = {
  household: '가구 경제 관리',
  date_account: '데이트 통장 관리',
  travel: '여행 자금 관리',
  investment: '투자/자산 관리',
  other: '기타',
};

/** Normalize name/account for group matching: trim + collapse whitespace + lowercase */
export const normalizeMatchKey = (s: string): string =>
  s.trim().replace(/\s+/g, ' ').toLowerCase();
