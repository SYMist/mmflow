import { create } from 'zustand';
import type { Connection } from '@xyflow/react';
import {
  FlowEdgeData,
  FlowNodeData,
  CanvasMeta,
  CanvasMember,
  MemberType,
  CanvasGoal,
  Group,
  normalizeMatchKey,
} from '../types/flow';

/* ── Storage keys ── */
const KEY_CANVASES = 'mfv3:canvases';
const slotKey = (canvasId: string, month: string) => `mfv3:canvas:${canvasId}:${month}`;
const metaKey = (canvasId: string) => `mfv3:canvas:${canvasId}:meta`;

/* ── Storage helpers ── */
type CanvasIndexEntry = { id: string; name: string; createdAt: string };
type SlotData = {
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  groups: Group[];
  updatedAt: string;
};

const loadCanvasIndex = (): CanvasIndexEntry[] => {
  try {
    const raw = localStorage.getItem(KEY_CANVASES);
    return raw ? (JSON.parse(raw) as CanvasIndexEntry[]) ?? [] : [];
  } catch { return []; }
};

const saveCanvasIndex = (entries: CanvasIndexEntry[]) => {
  localStorage.setItem(KEY_CANVASES, JSON.stringify(entries));
};

const loadCanvasMeta = (id: string): CanvasMeta | null => {
  try {
    const raw = localStorage.getItem(metaKey(id));
    return raw ? (JSON.parse(raw) as CanvasMeta) : null;
  } catch { return null; }
};

const saveCanvasMeta = (meta: CanvasMeta) => {
  localStorage.setItem(metaKey(meta.id), JSON.stringify(meta));
};

const loadSlot = (canvasId: string, month: string): SlotData | null => {
  try {
    const raw = localStorage.getItem(slotKey(canvasId, month));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SlotData;
    return parsed?.nodes && Array.isArray(parsed.nodes) ? parsed : null;
  } catch { return null; }
};

const saveSlot = (canvasId: string, month: string, data: SlotData) => {
  localStorage.setItem(slotKey(canvasId, month), JSON.stringify(data));
};

const removeSlot = (canvasId: string, month: string) => {
  localStorage.removeItem(slotKey(canvasId, month));
};

const removeCanvas = (canvasId: string) => {
  localStorage.removeItem(metaKey(canvasId));
  const prefix = `mfv3:canvas:${canvasId}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
};

export const getMonthsWithData = (canvasId: string): string[] => {
  const prefix = `mfv3:canvas:${canvasId}:`;
  const months: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const tail = key.slice(prefix.length);
      if (/^\d{4}-\d{2}$/.test(tail)) months.push(tail);
    }
  }
  return months.sort();
};

const getPrevMonthKey = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getPreviousMonthWithData = (canvasId: string, month: string): string | null => {
  const prev = getPrevMonthKey(month);
  return loadSlot(canvasId, prev) ? prev : null;
};

/* ── Member count rules ── */
export const getMemberCountConstraint = (memberType: MemberType): number | null => {
  if (memberType === 'lover' || memberType === 'spouse') return 2;
  return null; // user-decided
};

/* ── Area (zone) coordinates ── */
export const DEFAULT_AREA_SHARED_X_MIN = -180;
export const DEFAULT_AREA_SHARED_X_MAX = 180;

export const getAreaBounds = (meta: CanvasMeta | null) => ({
  sharedXMin: meta?.areaBounds?.sharedXMin ?? DEFAULT_AREA_SHARED_X_MIN,
  sharedXMax: meta?.areaBounds?.sharedXMax ?? DEFAULT_AREA_SHARED_X_MAX,
});

/** Determine area for an x coordinate (multi-member layouts only) */
export const getAreaForPosition = (
  x: number,
  members: CanvasMember[],
  meta?: CanvasMeta | null,
): { memberId?: string; isShared: boolean } => {
  if (members.length < 2) {
    return { memberId: undefined, isShared: false };
  }
  const { sharedXMin, sharedXMax } = getAreaBounds(meta ?? null);
  if (x >= sharedXMin && x <= sharedXMax) {
    return { memberId: undefined, isShared: true };
  }
  if (x < sharedXMin) return { memberId: members[0].id, isShared: false };
  return { memberId: members[1]?.id ?? members[0].id, isShared: false };
};

/* ── Types ── */
type Direction = 'left' | 'right' | 'top' | 'bottom';

type ContextMenuState =
  | { type: 'node'; x: number; y: number; nodeId: string }
  | { type: 'pane'; x: number; y: number; flowX: number; flowY: number }
  | null;

type Snapshot = { nodes: FlowNodeData[]; edges: FlowEdgeData[]; groups: Group[] };

type View = 'list' | 'canvas';

type GroupProposal = {
  candidateNodeId: string; // newly cloned node
  existingNodeIds: string[]; // nodes with same match key
};

export type Selection =
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string }
  | { type: 'group'; id: string }
  | null;

/* ── Store ── */
interface FlowStore {
  // View
  view: View;
  goToList: () => void;
  goToCanvas: (id: string) => void;

  // Canvases
  canvases: CanvasIndexEntry[];
  refreshCanvases: () => void;
  createCanvas: (input: {
    name: string;
    memberType: MemberType;
    members: CanvasMember[];
    goal: CanvasGoal;
  }) => string;
  deleteCanvas: (id: string) => void;
  renameCanvas: (id: string, name: string) => void;

  // Active canvas
  canvasMeta: CanvasMeta | null;
  month: string;
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  groups: Group[];
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: string | null;
  setMonth: (month: string) => void;
  copyFromPreviousMonth: (target: string, source: string) => void;
  persist: () => void;

  // Selection / UI (single source of truth)
  selection: Selection;
  editingNodeId?: string;
  contextMenu: ContextMenuState;
  groupProposal: GroupProposal | null;
  selectNode: (id: string) => void;
  selectEdge: (id: string) => void;
  selectGroup: (id: string) => void;
  clearSelection: () => void;
  openNodeMenu: (p: { x: number; y: number; nodeId: string }) => void;
  openPaneMenu: (p: { x: number; y: number; flowX: number; flowY: number }) => void;
  closeMenu: () => void;
  startEditNode: (id: string) => void;
  commitEditNode: () => void;
  cancelEditNode: () => void;
  acceptGroupProposal: () => void;
  dismissGroupProposal: () => void;

  // Computed
  totalSourceAndSubAmount: () => number;
  /** Returns area-keyed totals: '__shared__' for shared, memberId for private */
  totalsByArea: () => Record<string, number>;
  warningNodeIds: () => Set<string>;

  // Node actions
  createNode: (type: 'source' | 'destination', position: { x: number; y: number }) => void;
  createSubNode: (parentId: string) => void;
  updateNode: (id: string, patch: Partial<FlowNodeData>) => void;
  moveNode: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;
  changeNodeColor: (id: string, color: string) => void;

  // Edge actions
  createEdge: (sourceId: string, targetId: string, sourceHandleId?: string | null, targetHandleId?: string | null) => void;
  reconnectEdge: (edgeId: string, connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;

  // Group actions
  formGroup: (nodeIds: string[]) => void;
  addToGroup: (groupId: string, nodeId: string) => void;
  removeFromGroup: (nodeId: string) => void;
  /** Try to group with overlapping destination after a drop */
  tryGroupOnDrop: (droppedId: string) => void;
  /** Compute total amount of a group */
  groupTotal: (groupId: string) => number;
  /** Set custom group bounds (drag-to-resize) */
  setGroupBounds: (groupId: string, bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
  /** Move group: shifts all members + their sub nodes + bounds (if explicit) by dx/dy */
  moveGroup: (groupId: string, dx: number, dy: number) => void;

  // Area actions (multi-member)
  setAreaBounds: (sharedXMin: number, sharedXMax: number) => void;

  // History
  _history: Snapshot[];
  _future: Snapshot[];
  _editSnapshotSaved: boolean;
  _saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 50;

const snapshotOf = (s: Pick<FlowStore, 'nodes' | 'edges' | 'groups'>): Snapshot => ({
  nodes: s.nodes,
  edges: s.edges,
  groups: s.groups,
});

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

/** Strip sub nodes that lost their parent destination */
const cleanupOrphanSubNodes = (nodes: FlowNodeData[]): FlowNodeData[] => {
  const ids = new Set(nodes.filter((n) => n.type === 'destination').map((n) => n.id));
  return nodes.filter((n) => n.type !== 'sub' || (n.parentNodeId && ids.has(n.parentNodeId)));
};

/** Find sub node attached to a destination */
const findSubOf = (nodes: FlowNodeData[], destinationId: string): FlowNodeData | undefined =>
  nodes.find((n) => n.type === 'sub' && n.parentNodeId === destinationId);

export const useFlowStoreV3 = create<FlowStore>((set, get) => ({
  // View
  view: 'list',
  goToList: () => {
    get().persist();
    set({
      view: 'list',
      canvasMeta: null,
      nodes: [],
      edges: [],
      groups: [],
      selection: null,
      editingNodeId: undefined,
      _history: [],
      _future: [],
    });
    get().refreshCanvases();
  },
  goToCanvas: (id) => {
    const meta = loadCanvasMeta(id);
    if (!meta) return;
    const months = getMonthsWithData(id);
    const month = months.length > 0 ? months[months.length - 1] : new Date().toISOString().slice(0, 7);
    const slot = loadSlot(id, month);
    set({
      view: 'canvas',
      canvasMeta: meta,
      month,
      nodes: slot?.nodes ?? [],
      edges: slot?.edges ?? [],
      groups: slot?.groups ?? [],
      selection: null,
      editingNodeId: undefined,
      _history: [],
      _future: [],
      saveStatus: 'idle',
      lastSavedAt: slot?.updatedAt ?? null,
    });
  },

  // Canvases
  canvases: loadCanvasIndex(),
  refreshCanvases: () => set({ canvases: loadCanvasIndex() }),
  createCanvas: ({ name, memberType, members, goal }) => {
    const id = newId('canvas');
    const now = new Date().toISOString();
    const meta: CanvasMeta = {
      id,
      name,
      memberType,
      members,
      goal,
      createdAt: now,
      updatedAt: now,
    };
    saveCanvasMeta(meta);
    const idx = loadCanvasIndex();
    idx.push({ id, name, createdAt: now });
    saveCanvasIndex(idx);
    set({ canvases: idx });
    return id;
  },
  deleteCanvas: (id) => {
    removeCanvas(id);
    const idx = loadCanvasIndex().filter((c) => c.id !== id);
    saveCanvasIndex(idx);
    const state = get();
    if (state.canvasMeta?.id === id) {
      set({ canvases: idx, view: 'list', canvasMeta: null, nodes: [], edges: [], groups: [] });
    } else {
      set({ canvases: idx });
    }
  },
  renameCanvas: (id, name) => {
    const meta = loadCanvasMeta(id);
    if (!meta) return;
    const updated = { ...meta, name, updatedAt: new Date().toISOString() };
    saveCanvasMeta(updated);
    const idx = loadCanvasIndex().map((c) => (c.id === id ? { ...c, name } : c));
    saveCanvasIndex(idx);
    set({ canvases: idx, canvasMeta: get().canvasMeta?.id === id ? updated : get().canvasMeta });
  },

  // Active canvas
  canvasMeta: null,
  month: new Date().toISOString().slice(0, 7),
  nodes: [],
  edges: [],
  groups: [],
  saveStatus: 'idle',
  lastSavedAt: null,

  setMonth: (month) => {
    const meta = get().canvasMeta;
    if (!meta) return;
    const slot = loadSlot(meta.id, month);
    set({
      month,
      nodes: slot?.nodes ?? [],
      edges: slot?.edges ?? [],
      groups: slot?.groups ?? [],
      selection: null,
      editingNodeId: undefined,
      _history: [],
      _future: [],
    });
  },

  copyFromPreviousMonth: (target, source) => {
    const meta = get().canvasMeta;
    if (!meta) return;
    const src = loadSlot(meta.id, source);
    if (!src) return;
    saveSlot(meta.id, target, { ...src, updatedAt: new Date().toISOString() });
    set({
      month: target,
      nodes: src.nodes,
      edges: src.edges,
      groups: src.groups,
      _history: [],
      _future: [],
    });
  },

  persist: () => {
    const { canvasMeta, month, nodes, edges, groups } = get();
    if (!canvasMeta) return;
    try {
      set({ saveStatus: 'saving' });
      if (nodes.length === 0 && edges.length === 0 && groups.length === 0) {
        removeSlot(canvasMeta.id, month);
      } else {
        saveSlot(canvasMeta.id, month, {
          nodes,
          edges,
          groups,
          updatedAt: new Date().toISOString(),
        });
      }
      set({ saveStatus: 'saved', lastSavedAt: new Date().toISOString() });
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  // UI / Selection (single source)
  selection: null,
  editingNodeId: undefined,
  contextMenu: null,
  groupProposal: null,

  selectNode: (id) => set({ selection: { type: 'node', id }, contextMenu: null }),
  selectEdge: (id) => set({ selection: { type: 'edge', id }, contextMenu: null }),
  selectGroup: (id) => set({ selection: { type: 'group', id }, contextMenu: null }),
  clearSelection: () => set({
    selection: null,
    editingNodeId: undefined,
    _editSnapshotSaved: false,
    contextMenu: null,
  }),
  openNodeMenu: (p) => set({ contextMenu: { type: 'node', ...p } }),
  openPaneMenu: (p) => set({ contextMenu: { type: 'pane', ...p } }),
  closeMenu: () => set({ contextMenu: null }),

  startEditNode: (id) => {
    const s = get();
    if (!s._editSnapshotSaved) {
      s._saveSnapshot();
      set({ _editSnapshotSaved: true });
    }
    set({ editingNodeId: id, selection: { type: 'node', id } });
  },
  commitEditNode: () => set({ editingNodeId: undefined, _editSnapshotSaved: false }),
  cancelEditNode: () => {
    get().undo();
    set({ editingNodeId: undefined, _editSnapshotSaved: false });
  },

  acceptGroupProposal: () => {
    const proposal = get().groupProposal;
    if (!proposal) return;
    const allIds = [...proposal.existingNodeIds, proposal.candidateNodeId];
    get().formGroup(allIds);
    set({ groupProposal: null });
  },
  dismissGroupProposal: () => set({ groupProposal: null }),

  // Computed
  totalSourceAndSubAmount: () => {
    const { nodes } = get();
    return nodes
      .filter((n) => n.type === 'source' || n.type === 'sub')
      .reduce((s, n) => s + (n.amount || 0), 0);
  },

  totalsByArea: () => {
    const { nodes } = get();
    const totals: Record<string, number> = {};
    nodes
      .filter((n) => n.type === 'source' || n.type === 'sub')
      .forEach((n) => {
        const key = n.isShared ? '__shared__' : (n.memberId ?? '__none__');
        totals[key] = (totals[key] ?? 0) + (n.amount || 0);
      });
    return totals;
  },

  warningNodeIds: () => {
    const { nodes, edges } = get();
    const childrenAmountSum = new Map<string, number>();
    edges.forEach((e) => {
      const target = nodes.find((n) => n.id === e.toNodeId);
      const source = nodes.find((n) => n.id === e.fromNodeId);
      if (!target || !source) return;
      // source/sub → destination
      if ((source.type === 'source' || source.type === 'sub') && target.type === 'destination') {
        childrenAmountSum.set(source.id, (childrenAmountSum.get(source.id) ?? 0) + (target.amount || 0));
      }
    });
    const warnings = new Set<string>();
    nodes.forEach((n) => {
      if (n.type !== 'source' && n.type !== 'sub') return;
      const sum = childrenAmountSum.get(n.id) ?? 0;
      if (sum > (n.amount || 0)) warnings.add(n.id);
    });
    return warnings;
  },

  // Node actions
  createNode: (type, position) => {
    get()._saveSnapshot();
    const meta = get().canvasMeta;
    const area = meta ? getAreaForPosition(position.x, meta.members, meta) : { isShared: false };
    const node: FlowNodeData = {
      id: newId(type === 'source' ? 'src' : 'dst'),
      type,
      name: type === 'source' ? '새 출발' : '새 도착',
      account: '',
      amount: 0,
      color: type === 'source' ? '#6366f1' : '#0ea5e9',
      x: position.x,
      y: position.y,
      memberId: area.memberId,
      isShared: area.isShared,
    };
    set({
      nodes: [...get().nodes, node],
      editingNodeId: node.id,
      selection: { type: 'node', id: node.id },
      contextMenu: null,
    });
  },

  createSubNode: (parentId) => {
    const { nodes, _saveSnapshot } = get();
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent || parent.type !== 'destination') return;
    if (findSubOf(nodes, parentId)) return; // 1:1 강제
    _saveSnapshot();
    const sub: FlowNodeData = {
      id: newId('sub'),
      type: 'sub',
      name: '서브',
      account: parent.account,
      amount: 0,
      color: '#a855f7',
      parentNodeId: parentId,
      // Position relative to parent (top-right)
      x: (parent.x ?? 0) + 140,
      y: (parent.y ?? 0) - 50,
      memberId: parent.memberId,
      isShared: parent.isShared,
    };
    set({
      nodes: [...nodes, sub],
      editingNodeId: sub.id,
      selection: { type: 'node', id: sub.id },
      contextMenu: null,
    });
  },

  updateNode: (id, patch) => {
    get()._saveSnapshot();
    set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  },

  moveNode: (id, x, y) => {
    const { nodes, canvasMeta } = get();
    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    // Compute new area for multi-member canvas
    const newArea = canvasMeta && canvasMeta.members.length >= 2
      ? getAreaForPosition(x, canvasMeta.members, canvasMeta)
      : null;

    if (node.type === 'destination') {
      // Move parent + sub together
      const sub = findSubOf(nodes, id);
      const dx = x - (node.x ?? 0);
      const dy = y - (node.y ?? 0);
      set({
        nodes: nodes.map((n) => {
          if (n.id === id) {
            return newArea
              ? { ...n, x, y, memberId: newArea.memberId, isShared: newArea.isShared }
              : { ...n, x, y };
          }
          if (sub && n.id === sub.id) {
            const subX = (n.x ?? 0) + dx;
            const subY = (n.y ?? 0) + dy;
            return newArea
              ? { ...n, x: subX, y: subY, memberId: newArea.memberId, isShared: newArea.isShared }
              : { ...n, x: subX, y: subY };
          }
          return n;
        }),
      });
    } else {
      set({
        nodes: nodes.map((n) => {
          if (n.id !== id) return n;
          return newArea
            ? { ...n, x, y, memberId: newArea.memberId, isShared: newArea.isShared }
            : { ...n, x, y };
        }),
      });
    }
  },

  deleteNode: (id) => {
    const { nodes, edges, groups, selection, _saveSnapshot } = get();
    _saveSnapshot();
    const node = nodes.find((n) => n.id === id);
    let nextNodes = nodes.filter((n) => n.id !== id);
    if (node?.type === 'destination') {
      nextNodes = nextNodes.filter((n) => !(n.type === 'sub' && n.parentNodeId === id));
    }
    nextNodes = cleanupOrphanSubNodes(nextNodes);
    const removedIds = new Set(nodes.map((n) => n.id).filter((nid) => !nextNodes.some((nn) => nn.id === nid)));
    const nextEdges = edges.filter((e) => !removedIds.has(e.fromNodeId) && !removedIds.has(e.toNodeId));
    const nextGroups = groups
      .map((g) => ({ ...g, nodeIds: g.nodeIds.filter((nid) => !removedIds.has(nid)) }))
      .filter((g) => g.nodeIds.length >= 2);
    const nextSelection: Selection = selection?.type === 'node' && removedIds.has(selection.id) ? null : selection;
    set({
      nodes: nextNodes,
      edges: nextEdges,
      groups: nextGroups,
      selection: nextSelection,
      contextMenu: null,
    });
  },

  changeNodeColor: (id, color) => {
    get()._saveSnapshot();
    set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, color } : n)) });
  },

  // Edge actions
  createEdge: (sourceId, targetId, sourceHandleId, targetHandleId) => {
    if (sourceId === targetId) return;
    const { nodes, edges, groups, canvasMeta, _saveSnapshot } = get();
    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    // Allowed direction: source/sub → destination
    let fromId = sourceId, toId = targetId;
    let fromHandle = sourceHandleId, toHandle = targetHandleId;
    if (
      (sourceNode.type === 'destination') &&
      (targetNode.type === 'source' || targetNode.type === 'sub')
    ) {
      fromId = targetId; toId = sourceId;
      fromHandle = targetHandleId; toHandle = sourceHandleId;
    }

    const fromNode = nodes.find((n) => n.id === fromId);
    const toNode = nodes.find((n) => n.id === toId);
    if (!fromNode || !toNode) return;
    if (fromNode.type === 'destination') return; // destination can't be source of edge
    if (toNode.type !== 'destination') return; // target must be destination

    // Multi-member: block private nodes across different areas
    if (canvasMeta && canvasMeta.members.length >= 2) {
      const fromPrivate = !fromNode.isShared && fromNode.memberId;
      const toPrivate = !toNode.isShared && toNode.memberId;
      if (fromPrivate && toPrivate && fromNode.memberId !== toNode.memberId) {
        window.alert('비공유 노드는 다른 영역의 노드와 연결할 수 없습니다.\n공유 영역으로 이동하면 연결할 수 있습니다.');
        return;
      }
    }

    // Prevent duplicate
    if (edges.some((e) => e.fromNodeId === fromId && e.toNodeId === toId)) return;

    // 1:1 강제: target destination already has an incoming edge?
    const existingIncoming = edges.find((e) => e.toNodeId === toId);
    if (existingIncoming) {
      // Auto-clone destination + propose grouping
      _saveSnapshot();
      const cloneId = newId('dst');
      const offsetX = (toNode.x ?? 0) + 30;
      const offsetY = (toNode.y ?? 0) + 30;
      const clone: FlowNodeData = {
        ...toNode,
        id: cloneId,
        x: offsetX,
        y: offsetY,
        // Clone may inherit existing groupId or start fresh - start fresh for clarity
        groupId: undefined,
        parentNodeId: undefined,
      };
      const newEdge: FlowEdgeData = {
        id: newId('edge'),
        fromNodeId: fromId,
        toNodeId: cloneId,
        sourceHandleId: fromHandle ?? undefined,
        targetHandleId: toHandle ?? undefined,
      };
      // Find existing destinations matching the clone (same normalized name+account)
      const matchName = normalizeMatchKey(toNode.name);
      const matchAccount = normalizeMatchKey(toNode.account);
      const matches = nodes.filter((n) =>
        n.type === 'destination' &&
        normalizeMatchKey(n.name) === matchName &&
        normalizeMatchKey(n.account) === matchAccount,
      );
      set({
        nodes: [...nodes, clone],
        edges: [...edges, newEdge],
        groupProposal: {
          candidateNodeId: cloneId,
          existingNodeIds: matches.map((m) => m.id),
        },
      });
      return;
    }

    _saveSnapshot();
    const edge: FlowEdgeData = {
      id: newId('edge'),
      fromNodeId: fromId,
      toNodeId: toId,
      sourceHandleId: fromHandle ?? undefined,
      targetHandleId: toHandle ?? undefined,
    };
    set({ edges: [...edges, edge] });
  },

  reconnectEdge: (edgeId, connection) => {
    set({
      edges: get().edges.map((e) => {
        if (e.id !== edgeId) return e;
        return {
          ...e,
          fromNodeId: connection.source ?? e.fromNodeId,
          toNodeId: connection.target ?? e.toNodeId,
          sourceHandleId: connection.sourceHandle ?? e.sourceHandleId,
          targetHandleId: connection.targetHandle ?? e.targetHandleId,
        };
      }),
    });
  },

  deleteEdge: (edgeId) => {
    const { edges, selection, _saveSnapshot } = get();
    _saveSnapshot();
    const nextSelection: Selection = selection?.type === 'edge' && selection.id === edgeId ? null : selection;
    set({
      edges: edges.filter((e) => e.id !== edgeId),
      selection: nextSelection,
      contextMenu: null,
    });
  },

  // Group actions
  formGroup: (nodeIds) => {
    if (nodeIds.length < 2) return;
    const { nodes, groups, canvasMeta, _saveSnapshot } = get();
    const targets = nodes.filter((n) => nodeIds.includes(n.id) && n.type === 'destination');
    if (targets.length < 2) return;

    const matchName = normalizeMatchKey(targets[0].name);
    const matchAccount = normalizeMatchKey(targets[0].account);
    const allMatch = targets.every(
      (t) => normalizeMatchKey(t.name) === matchName && normalizeMatchKey(t.account) === matchAccount,
    );
    if (!allMatch) return;

    _saveSnapshot();

    // Multi-member: if grouping crosses areas, force shared
    let crossesAreas = false;
    if (canvasMeta && canvasMeta.members.length >= 2) {
      const memberIds = new Set(targets.map((t) => t.isShared ? '__shared__' : (t.memberId ?? '__none__')));
      crossesAreas = memberIds.size > 1;
    }

    const updatedGroups = groups
      .map((g) => ({ ...g, nodeIds: g.nodeIds.filter((nid) => !nodeIds.includes(nid)) }))
      .filter((g) => g.nodeIds.length >= 2);

    const newGroup: Group = {
      id: newId('group'),
      matchName,
      matchAccount,
      nodeIds: targets.map((t) => t.id),
    };

    set({
      groups: [...updatedGroups, newGroup],
      nodes: nodes.map((n) => {
        if (!nodeIds.includes(n.id) || n.type !== 'destination') return n;
        const updated: FlowNodeData = { ...n, groupId: newGroup.id };
        if (crossesAreas) {
          updated.isShared = true;
          updated.memberId = undefined;
        }
        return updated;
      }),
    });
  },

  addToGroup: (groupId, nodeId) => {
    const { nodes, groups, _saveSnapshot } = get();
    const group = groups.find((g) => g.id === groupId);
    const node = nodes.find((n) => n.id === nodeId);
    if (!group || !node || node.type !== 'destination') return;
    if (normalizeMatchKey(node.name) !== group.matchName) return;
    if (normalizeMatchKey(node.account) !== group.matchAccount) return;
    _saveSnapshot();
    // Remove from other groups
    const updatedGroups = groups.map((g) => {
      if (g.id === groupId) {
        return { ...g, nodeIds: Array.from(new Set([...g.nodeIds, nodeId])) };
      }
      return { ...g, nodeIds: g.nodeIds.filter((nid) => nid !== nodeId) };
    }).filter((g) => g.nodeIds.length >= 2);
    set({
      groups: updatedGroups,
      nodes: nodes.map((n) => (n.id === nodeId ? { ...n, groupId } : n)),
    });
  },

  removeFromGroup: (nodeId) => {
    const { nodes, groups, _saveSnapshot } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !node.groupId) return;
    _saveSnapshot();
    const updatedGroups = groups
      .map((g) => ({ ...g, nodeIds: g.nodeIds.filter((nid) => nid !== nodeId) }))
      .filter((g) => g.nodeIds.length >= 2);
    set({
      groups: updatedGroups,
      nodes: nodes.map((n) => (n.id === nodeId ? { ...n, groupId: undefined } : n)),
    });
  },

  tryGroupOnDrop: (droppedId) => {
    const { nodes, groups } = get();
    const dropped = nodes.find((n) => n.id === droppedId);
    if (!dropped || dropped.type !== 'destination') return;

    const NODE_W = 160;
    const NODE_H = 80;
    const PADDING = 14;
    const HEADER_H = 22;
    const dx = dropped.x ?? 0;
    const dy = dropped.y ?? 0;
    const overlap = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.abs(a.x - b.x) < NODE_W * 0.6 && Math.abs(a.y - b.y) < NODE_H * 0.7;

    const droppedName = normalizeMatchKey(dropped.name);
    const droppedAccount = normalizeMatchKey(dropped.account);

    // 1. If dropped node is in a group, check if it left the group's box
    if (dropped.groupId) {
      const group = groups.find((g) => g.id === dropped.groupId);
      if (group) {
        let minX: number, minY: number, maxX: number, maxY: number;
        if (group.bounds) {
          minX = group.bounds.minX;
          minY = group.bounds.minY;
          maxX = group.bounds.maxX;
          maxY = group.bounds.maxY;
        } else {
          const siblings = group.nodeIds
            .filter((nid) => nid !== droppedId)
            .map((nid) => nodes.find((n) => n.id === nid))
            .filter((n): n is NonNullable<typeof n> => Boolean(n));
          if (siblings.length === 0) return;
          const xs = siblings.map((n) => n.x ?? 0);
          const ys = siblings.map((n) => n.y ?? 0);
          minX = Math.min(...xs) - PADDING;
          minY = Math.min(...ys) - PADDING - HEADER_H;
          maxX = Math.max(...xs) + NODE_W + PADDING;
          maxY = Math.max(...ys) + NODE_H + PADDING;
        }

        const cx = dx + NODE_W / 2;
        const cy = dy + NODE_H / 2;
        const inside = cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
        if (!inside) {
          get().removeFromGroup(droppedId);
          return;
        }
      }
    }

    // 2. Try to form/join group with overlapping destination of same key
    const target = nodes.find((n) => {
      if (n.id === droppedId) return false;
      if (n.type !== 'destination') return false;
      if (normalizeMatchKey(n.name) !== droppedName) return false;
      if (normalizeMatchKey(n.account) !== droppedAccount) return false;
      return overlap({ x: dx, y: dy }, { x: n.x ?? 0, y: n.y ?? 0 });
    });
    if (!target) return;

    if (target.groupId) {
      const group = groups.find((g) => g.id === target.groupId);
      if (group) {
        get().addToGroup(group.id, droppedId);
        return;
      }
    }
    if (dropped.groupId) {
      const group = groups.find((g) => g.id === dropped.groupId);
      if (group) {
        get().addToGroup(group.id, target.id);
        return;
      }
    }
    get().formGroup([dropped.id, target.id]);
  },

  groupTotal: (groupId) => {
    const { nodes, groups } = get();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return 0;
    return group.nodeIds.reduce((sum, nid) => {
      const node = nodes.find((n) => n.id === nid);
      return sum + (node?.amount ?? 0);
    }, 0);
  },

  setGroupBounds: (groupId, bounds) => {
    set({
      groups: get().groups.map((g) =>
        g.id === groupId ? { ...g, bounds } : g,
      ),
    });
  },

  moveGroup: (groupId, dx, dy) => {
    const { groups, nodes } = get();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const memberIds = new Set(group.nodeIds);
    // Sub nodes attached to any member destination
    const subIds = new Set(
      nodes
        .filter((n) => n.type === 'sub' && n.parentNodeId && memberIds.has(n.parentNodeId))
        .map((n) => n.id),
    );

    set({
      nodes: nodes.map((n) => {
        if (memberIds.has(n.id) || subIds.has(n.id)) {
          return { ...n, x: (n.x ?? 0) + dx, y: (n.y ?? 0) + dy };
        }
        return n;
      }),
      groups: groups.map((g) => {
        if (g.id !== groupId || !g.bounds) return g;
        return {
          ...g,
          bounds: {
            minX: g.bounds.minX + dx,
            minY: g.bounds.minY + dy,
            maxX: g.bounds.maxX + dx,
            maxY: g.bounds.maxY + dy,
          },
        };
      }),
    });
  },

  setAreaBounds: (sharedXMin, sharedXMax) => {
    const meta = get().canvasMeta;
    if (!meta) return;
    const old = getAreaBounds(meta);
    const dxMin = sharedXMin - old.sharedXMin;
    const dxMax = sharedXMax - old.sharedXMax;

    // Shift nodes that were in the side member areas so they stay relative to the area
    const updatedNodes = get().nodes.map((n) => {
      const x = n.x ?? 0;
      if (x < old.sharedXMin) return { ...n, x: x + dxMin };
      if (x > old.sharedXMax) return { ...n, x: x + dxMax };
      return n;
    });

    const updated: CanvasMeta = { ...meta, areaBounds: { sharedXMin, sharedXMax }, updatedAt: new Date().toISOString() };
    saveCanvasMeta(updated);
    set({ canvasMeta: updated, nodes: updatedNodes });
  },

  // History
  _history: [],
  _future: [],
  _editSnapshotSaved: false,

  _saveSnapshot: () => {
    const s = get();
    set({
      _history: [...s._history.slice(-(MAX_HISTORY - 1)), snapshotOf(s)],
      _future: [],
    });
  },
  undo: () => {
    const s = get();
    const prev = s._history[s._history.length - 1];
    if (!prev) return;
    set({
      _history: s._history.slice(0, -1),
      _future: [...s._future, snapshotOf(s)],
      nodes: prev.nodes,
      edges: prev.edges,
      groups: prev.groups,
    });
  },
  redo: () => {
    const s = get();
    const next = s._future[s._future.length - 1];
    if (!next) return;
    set({
      _future: s._future.slice(0, -1),
      _history: [...s._history, snapshotOf(s)],
      nodes: next.nodes,
      edges: next.edges,
      groups: next.groups,
    });
  },
}));
