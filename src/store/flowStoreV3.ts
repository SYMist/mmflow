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

  // Selection / UI
  selectedNodeId?: string;
  selectedEdgeId?: string;
  editingNodeId?: string;
  contextMenu: ContextMenuState;
  groupProposal: GroupProposal | null;
  selectNode: (id: string) => void;
  selectEdge: (id: string) => void;
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
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
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
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
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
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
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

  // UI / Selection
  selectedNodeId: undefined,
  selectedEdgeId: undefined,
  editingNodeId: undefined,
  contextMenu: null,
  groupProposal: null,

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: undefined, contextMenu: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: undefined, contextMenu: null }),
  clearSelection: () => set({
    selectedNodeId: undefined,
    selectedEdgeId: undefined,
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
    set({ editingNodeId: id, selectedNodeId: id, selectedEdgeId: undefined });
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
    const node: FlowNodeData = {
      id: newId(type === 'source' ? 'src' : 'dst'),
      type,
      name: type === 'source' ? '새 출발' : '새 도착',
      account: '',
      amount: 0,
      color: type === 'source' ? '#6366f1' : '#0ea5e9',
      x: position.x,
      y: position.y,
    };
    set({
      nodes: [...get().nodes, node],
      editingNodeId: node.id,
      selectedNodeId: node.id,
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
    };
    set({
      nodes: [...nodes, sub],
      editingNodeId: sub.id,
      selectedNodeId: sub.id,
      contextMenu: null,
    });
  },

  updateNode: (id, patch) => {
    get()._saveSnapshot();
    set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  },

  moveNode: (id, x, y) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    if (node.type === 'destination') {
      // Move parent + sub together
      const sub = findSubOf(nodes, id);
      const dx = x - (node.x ?? 0);
      const dy = y - (node.y ?? 0);
      set({
        nodes: nodes.map((n) => {
          if (n.id === id) return { ...n, x, y };
          if (sub && n.id === sub.id) return { ...n, x: (n.x ?? 0) + dx, y: (n.y ?? 0) + dy };
          return n;
        }),
      });
    } else {
      set({ nodes: nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) });
    }
  },

  deleteNode: (id) => {
    const { nodes, edges, groups, selectedNodeId, _saveSnapshot } = get();
    _saveSnapshot();
    // If deleting destination, also delete its sub
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
    set({
      nodes: nextNodes,
      edges: nextEdges,
      groups: nextGroups,
      selectedNodeId: removedIds.has(selectedNodeId ?? '') ? undefined : selectedNodeId,
      selectedEdgeId: undefined,
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
    const { nodes, edges, groups, _saveSnapshot } = get();
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
    const { edges, selectedEdgeId, _saveSnapshot } = get();
    _saveSnapshot();
    set({
      edges: edges.filter((e) => e.id !== edgeId),
      selectedEdgeId: selectedEdgeId === edgeId ? undefined : selectedEdgeId,
      contextMenu: null,
    });
  },

  // Group actions
  formGroup: (nodeIds) => {
    if (nodeIds.length < 2) return;
    const { nodes, groups, _saveSnapshot } = get();
    const targets = nodes.filter((n) => nodeIds.includes(n.id) && n.type === 'destination');
    if (targets.length < 2) return;

    const matchName = normalizeMatchKey(targets[0].name);
    const matchAccount = normalizeMatchKey(targets[0].account);
    // All must match
    const allMatch = targets.every(
      (t) => normalizeMatchKey(t.name) === matchName && normalizeMatchKey(t.account) === matchAccount,
    );
    if (!allMatch) return;

    _saveSnapshot();

    // Remove targets from any existing groups (1:1 membership)
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
      nodes: nodes.map((n) =>
        nodeIds.includes(n.id) && n.type === 'destination' ? { ...n, groupId: newGroup.id } : n,
      ),
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
