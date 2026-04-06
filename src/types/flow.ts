export type NodeType = 'income' | 'destination';

export interface FlowNodeData {
  id: string;
  type: NodeType;
  // 항목 명 (예: 월급, 생활비 등)
  itemName: string;
  // 은행/기관 이름 (예: 국민은행, 토스뱅크 등)
  bankName: string;
  // 이 노드에 설정된 기준 금액 (월 기준 목표/예상 금액)
  amount: number;
  color: string;
  icon?: string;
  x?: number;
  y?: number;
}

export interface FlowEdgeData {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  amount: number;
  ratio?: number;
  sourceHandleId?: string;
  targetHandleId?: string;
}
