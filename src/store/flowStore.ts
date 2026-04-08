import { create } from 'zustand';
import type { Connection } from '@xyflow/react';
import { FlowEdgeData, FlowNodeData } from '../types/flow';

/* ── Storage helpers ── */
const SCENARIOS_INDEX_KEY = 'mf:scenarios';
const LEGACY_KEY = 'money-flow-state-v1';

type ScenarioMeta = { id: string; name: string; createdAt: string };
type SlotData = { nodes: FlowNodeData[]; edges: FlowEdgeData[]; updatedAt: string };

const slotKey = (scenarioId: string, month: string) => `mf:${scenarioId}:${month}`;

const loadScenariosIndex = (): ScenarioMeta[] => {
  try {
    const raw = localStorage.getItem(SCENARIOS_INDEX_KEY);
    return raw ? (JSON.parse(raw) as ScenarioMeta[]) ?? [] : [];
  } catch { return []; }
};

const saveScenariosIndex = (scenarios: ScenarioMeta[]) => {
  localStorage.setItem(SCENARIOS_INDEX_KEY, JSON.stringify(scenarios));
};

const loadSlot = (scenarioId: string, month: string): SlotData | null => {
  try {
    const raw = localStorage.getItem(slotKey(scenarioId, month));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SlotData;
    return parsed?.nodes && Array.isArray(parsed.nodes) ? parsed : null;
  } catch { return null; }
};

const saveSlot = (scenarioId: string, month: string, data: SlotData) => {
  localStorage.setItem(slotKey(scenarioId, month), JSON.stringify(data));
};

/* ── Initial data ── */
const initialNodes: FlowNodeData[] = [
  { id: 'income-salary', type: 'income', itemName: '월급', bankName: '회사', amount: 3000000, color: '#4f46e5', x: 0, y: 80 },
  { id: 'dest-living', type: 'destination', itemName: '생활비', bankName: '국민은행', amount: 1500000, color: '#10b981', x: 350, y: 40 },
  { id: 'dest-invest', type: 'destination', itemName: '투자', bankName: '토스증권', amount: 1500000, color: '#f97316', x: 350, y: 140 },
];

const initialEdges: FlowEdgeData[] = [
  { id: 'edge-salary-living', fromNodeId: 'income-salary', toNodeId: 'dest-living', amount: 1500000, ratio: 0.5 },
  { id: 'edge-salary-invest', fromNodeId: 'income-salary', toNodeId: 'dest-invest', amount: 1500000, ratio: 0.5 },
];

/* ── Legacy migration ── */
const migrateLegacy = (): { scenarioId: string; scenarioName: string; month: string; nodes: FlowNodeData[]; edges: FlowEdgeData[] } | null => {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.nodes) return null;
    const scenarioId = crypto.randomUUID().slice(0, 8);
    const scenarioName = parsed.scenarioName || '기본 시나리오';
    const month = parsed.month || new Date().toISOString().slice(0, 7);
    saveScenariosIndex([{ id: scenarioId, name: scenarioName, createdAt: new Date().toISOString() }]);
    saveSlot(scenarioId, month, { nodes: parsed.nodes, edges: parsed.edges, updatedAt: parsed.updatedAt || new Date().toISOString() });
    localStorage.removeItem(LEGACY_KEY);
    return { scenarioId, scenarioName, month, nodes: parsed.nodes, edges: parsed.edges };
  } catch { return null; }
};

const loadInitial = () => {
  if (typeof window === 'undefined') return null;

  const migrated = migrateLegacy();
  if (migrated) return migrated;

  const scenarios = loadScenariosIndex();
  if (scenarios.length === 0) return null;

  const scenario = scenarios[0];
  const now = new Date().toISOString().slice(0, 7);
  const slot = loadSlot(scenario.id, now);
  if (slot) return { scenarioId: scenario.id, scenarioName: scenario.name, month: now, nodes: slot.nodes, edges: slot.edges };

  const prefix = `mf:${scenario.id}:`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const month = key.slice(prefix.length);
      const s = loadSlot(scenario.id, month);
      if (s) return { scenarioId: scenario.id, scenarioName: scenario.name, month, nodes: s.nodes, edges: s.edges };
    }
  }
  return null;
};

/* ── Types ── */
type Direction = 'left' | 'right' | 'top' | 'bottom';

type ContextMenuState =
  | { type: 'node'; x: number; y: number; nodeId: string }
  | { type: 'pane'; x: number; y: number; flowX: number; flowY: number }
  | null;

type Snapshot = { nodes: FlowNodeData[]; edges: FlowEdgeData[] };

export type { ScenarioMeta };

export type ExportData = {
  version: 2;
  exportedAt: string;
  scenarios: ScenarioMeta[];
  slots: Record<string, SlotData>;
};

/** Get all months that have data for a given scenario */
export const getMonthsWithData = (scenarioId: string): string[] => {
  const prefix = `mf:${scenarioId}:`;
  const months: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const month = key.slice(prefix.length);
      if (/^\d{4}-\d{2}$/.test(month)) months.push(month);
    }
  }
  return months.sort();
};

/** Get the immediately preceding month string (e.g. 2026-04 → 2026-03) */
const getPrevMonthKey = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1); // month is 1-based, Date month is 0-based
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Returns the previous month only if it's the immediately preceding month and has data */
export const getPreviousMonthWithData = (scenarioId: string, month: string): string | null => {
  const prev = getPrevMonthKey(month);
  const slot = loadSlot(scenarioId, prev);
  return slot ? prev : null;
};

/** Copy data from one month slot to another */
const copySlot = (scenarioId: string, fromMonth: string, toMonth: string) => {
  const slot = loadSlot(scenarioId, fromMonth);
  if (slot) {
    saveSlot(scenarioId, toMonth, { ...slot, updatedAt: new Date().toISOString() });
  }
};

/* ── Store ── */
interface FlowStore {
  // Data
  scenarioId: string;
  month: string;
  scenarioName: string;
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];

  // UI
  selectedNodeId?: string;
  selectedEdgeId?: string;
  editingNodeId?: string;
  sidebarOpen: boolean;
  contextMenu: ContextMenuState;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: string | null;

  // Computed
  totalIn: () => number;
  totalOut: () => number;

  // History
  _history: Snapshot[];
  _future: Snapshot[];
  _isUndoRedo: boolean;
  _editSnapshotSaved: boolean;
  _saveSnapshot: () => void;

  // Actions – scenario
  getScenarios: () => ScenarioMeta[];
  createScenario: (name: string) => void;
  switchScenario: (scenarioId: string) => void;
  deleteScenario: (scenarioId: string) => void;
  setScenarioName: (name: string) => void;

  // Actions – data
  setMonth: (month: string) => void;
  copyFromPreviousMonth: (targetMonth: string, sourceMonth: string) => void;
  addIncome: () => void;
  addDestination: () => void;
  createNodeAt: (type: FlowNodeData['type'], x: number, y: number) => void;
  addNodeAround: (sourceNodeId: string, direction: Direction) => void;
  moveNode: (id: string, x: number, y: number) => void;
  renameNode: (id: string, name: string) => void;
  changeBankName: (id: string, bankName: string) => void;
  changeNodeAmount: (id: string, amount: number) => void;
  changeNodeColor: (id: string, color: string) => void;
  deleteNode: (id: string) => void;
  createEdge: (sourceId: string, targetId: string, sourceHandleId?: string | null, targetHandleId?: string | null) => void;
  updateEdgeAmount: (edgeId: string, amount: number) => void;
  reconnectEdge: (edgeId: string, connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;

  // Actions – UI
  selectNode: (id: string) => void;
  selectEdge: (id: string) => void;
  clearSelection: () => void;
  openNodeMenu: (payload: { x: number; y: number; nodeId: string }) => void;
  openPaneMenu: (payload: { x: number; y: number; flowX: number; flowY: number }) => void;
  closeMenu: () => void;
  toggleSidebar: () => void;
  startEditNode: (id: string) => void;
  commitEditNode: () => void;
  cancelEditNode: () => void;

  // Actions – history
  undo: () => void;
  redo: () => void;

  // Actions – persistence
  persist: () => void;
  exportAll: () => ExportData;
  importAll: (data: ExportData) => boolean;
}

const MAX_HISTORY = 50;

const persisted = loadInitial();
const defaultScenarioId = crypto.randomUUID().slice(0, 8);

const getFallbackPosition = (node: FlowNodeData, index: number) => ({
  x: node.x ?? (node.type === 'income' ? 0 : 350),
  y: node.y ?? index * 80,
});

export const useFlowStore = create<FlowStore>((set, get) => ({
  // Data
  scenarioId: persisted?.scenarioId ?? defaultScenarioId,
  month: persisted?.month ?? new Date().toISOString().slice(0, 7),
  scenarioName: persisted?.scenarioName ?? '기본 시나리오',
  nodes: persisted?.nodes ?? initialNodes,
  edges: persisted?.edges ?? initialEdges,

  // UI
  selectedNodeId: undefined,
  selectedEdgeId: undefined,
  editingNodeId: undefined,
  sidebarOpen: false,
  contextMenu: null,
  saveStatus: 'idle',
  lastSavedAt: null,

  // Computed
  totalIn: () => get().nodes.filter((n) => n.type === 'income').reduce((s, n) => s + n.amount, 0),
  totalOut: () => get().edges.reduce((s, e) => s + e.amount, 0),

  // History
  _history: [],
  _future: [],
  _isUndoRedo: false,
  _editSnapshotSaved: false,

  _saveSnapshot: () => {
    const { nodes, edges, _history } = get();
    set({
      _history: [..._history.slice(-(MAX_HISTORY - 1)), { nodes, edges }],
      _future: [],
    });
  },

  // Actions – data
  setMonth: (month) => {
    const { scenarioId } = get();
    const slot = loadSlot(scenarioId, month);
    set({
      month,
      nodes: slot?.nodes ?? [],
      edges: slot?.edges ?? [],
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      editingNodeId: undefined,
      _history: [],
      _future: [],
    });
  },

  setScenarioName: (scenarioName) => set({ scenarioName }),

  // Actions – scenario
  getScenarios: () => loadScenariosIndex(),

  createScenario: (name) => {
    // Save current data first
    get().persist();
    const newId = crypto.randomUUID().slice(0, 8);
    const scenarios = loadScenariosIndex();
    scenarios.push({ id: newId, name, createdAt: new Date().toISOString() });
    saveScenariosIndex(scenarios);
    const month = new Date().toISOString().slice(0, 7);
    set({
      scenarioId: newId,
      scenarioName: name,
      month,
      nodes: [],
      edges: [],
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      editingNodeId: undefined,
      _history: [],
      _future: [],
    });
  },

  switchScenario: (scenarioId) => {
    // Save current data first
    get().persist();
    const scenarios = loadScenariosIndex();
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    // Find latest month with data
    const months = getMonthsWithData(scenarioId);
    const month = months.length > 0 ? months[months.length - 1] : new Date().toISOString().slice(0, 7);
    const slot = loadSlot(scenarioId, month);

    set({
      scenarioId,
      scenarioName: scenario.name,
      month,
      nodes: slot?.nodes ?? [],
      edges: slot?.edges ?? [],
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      editingNodeId: undefined,
      _history: [],
      _future: [],
    });
  },

  deleteScenario: (scenarioId) => {
    const scenarios = loadScenariosIndex().filter((s) => s.id !== scenarioId);
    saveScenariosIndex(scenarios);

    // Remove all slots for this scenario
    const prefix = `mf:${scenarioId}:`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // If we deleted the current scenario, switch to another or create empty
    if (get().scenarioId === scenarioId) {
      if (scenarios.length > 0) {
        get().switchScenario(scenarios[0].id);
      } else {
        const newId = crypto.randomUUID().slice(0, 8);
        saveScenariosIndex([{ id: newId, name: '기본 시나리오', createdAt: new Date().toISOString() }]);
        set({
          scenarioId: newId,
          scenarioName: '기본 시나리오',
          month: new Date().toISOString().slice(0, 7),
          nodes: [],
          edges: [],
          _history: [],
          _future: [],
        });
      }
    }
  },

  copyFromPreviousMonth: (targetMonth, sourceMonth) => {
    const { scenarioId } = get();
    copySlot(scenarioId, sourceMonth, targetMonth);
    const slot = loadSlot(scenarioId, targetMonth);
    set({
      month: targetMonth,
      nodes: slot?.nodes ?? [],
      edges: slot?.edges ?? [],
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      editingNodeId: undefined,
      _history: [],
      _future: [],
    });
  },

  addIncome: () => {
    const { nodes, _saveSnapshot } = get();
    _saveSnapshot();
    const incomes = nodes.filter((n) => n.type === 'income');
    const ys = incomes.map((n, i) => getFallbackPosition(n, i).y);
    const nextY = ys.length ? Math.max(...ys) + 140 : 0;
    const newNode: FlowNodeData = {
      id: `income-${crypto.randomUUID().slice(0, 8)}`,
      type: 'income',
      itemName: '새 수입',
      bankName: '',
      amount: 0,
      color: '#6366f1',
      x: 0,
      y: nextY,
    };
    set({ nodes: [...nodes, newNode], editingNodeId: newNode.id, selectedNodeId: newNode.id });
  },

  addDestination: () => {
    const { nodes, _saveSnapshot } = get();
    _saveSnapshot();
    const dests = nodes.filter((n) => n.type === 'destination');
    const ys = dests.map((n, i) => getFallbackPosition(n, i).y);
    const nextY = ys.length ? Math.max(...ys) + 140 : 0;
    const newNode: FlowNodeData = {
      id: `dest-${crypto.randomUUID().slice(0, 8)}`,
      type: 'destination',
      itemName: '새 목적지',
      bankName: '',
      amount: 0,
      color: '#0ea5e9',
      x: 350,
      y: nextY,
    };
    set({ nodes: [...nodes, newNode], editingNodeId: newNode.id, selectedNodeId: newNode.id });
  },

  createNodeAt: (type, x, y) => {
    const { nodes, _saveSnapshot } = get();
    _saveSnapshot();
    const prefix = type === 'income' ? 'income' : 'dest';
    const newId = `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    const newNode: FlowNodeData = {
      id: newId,
      type,
      itemName: type === 'income' ? '새 수입' : '새 목적지',
      bankName: '',
      amount: 0,
      color: type === 'income' ? '#6366f1' : '#0ea5e9',
      x,
      y,
    };
    set({
      nodes: [...nodes, newNode],
      editingNodeId: newId,
      selectedNodeId: newId,
      contextMenu: null,
    });
  },

  addNodeAround: (sourceNodeId, direction) => {
    const { nodes, edges, _saveSnapshot } = get();
    _saveSnapshot();

    const source = nodes.find((n) => n.id === sourceNodeId);
    if (!source) return;

    const isSourceIncome = source.type === 'income';
    const newType: FlowNodeData['type'] = isSourceIncome ? 'destination' : 'income';
    const sourceIndex = nodes.findIndex((n) => n.id === sourceNodeId);
    const base = getFallbackPosition(source, Math.max(sourceIndex, 0));
    const offset = 180;

    let x = base.x;
    let y = base.y;
    if (direction === 'left') x = base.x - offset;
    if (direction === 'right') x = base.x + offset;
    if (direction === 'top') y = base.y - offset;
    if (direction === 'bottom') y = base.y + offset;

    const positions = nodes.map((n, i) => getFallbackPosition(n, i));
    const isOccupied = (cx: number, cy: number) =>
      positions.some((p) => Math.abs(p.x - cx) < 160 && Math.abs(p.y - cy) < 120);

    const dv = direction === 'left' ? { dx: -1, dy: 0 }
      : direction === 'right' ? { dx: 1, dy: 0 }
      : direction === 'top' ? { dx: 0, dy: -1 }
      : { dx: 0, dy: 1 };
    const step = 40;
    const laterals = [0, 1, -1, 2, -2, 3, -3];
    let found = !isOccupied(x, y);
    if (!found) {
      for (let i = 1; i <= 10 && !found; i++) {
        const bx = x + dv.dx * step * i;
        const by = y + dv.dy * step * i;
        for (const l of laterals) {
          const cx = dv.dx === 0 ? bx + l * step : bx;
          const cy = dv.dy === 0 ? by + l * step : by;
          if (!isOccupied(cx, cy)) { x = cx; y = cy; found = true; break; }
        }
      }
    }

    const newPrefix = newType === 'income' ? 'income' : 'dest';
    const newId = `${newPrefix}-${crypto.randomUUID().slice(0, 8)}`;
    const opp = direction === 'left' ? 'right' : direction === 'right' ? 'left' : direction === 'top' ? 'bottom' : 'top';

    const newNode: FlowNodeData = {
      id: newId, type: newType,
      itemName: newType === 'income' ? '새 수입' : '새 목적지',
      bankName: '', amount: 0,
      color: newType === 'income' ? '#6366f1' : '#0ea5e9',
      x, y,
    };

    const newEdge: FlowEdgeData = isSourceIncome
      ? { id: `edge-${source.id}-${newId}`, fromNodeId: source.id, toNodeId: newId, amount: 0, sourceHandleId: `s-${direction}`, targetHandleId: `t-${opp}` }
      : { id: `edge-${newId}-${source.id}`, fromNodeId: newId, toNodeId: source.id, amount: 0, sourceHandleId: `s-${opp}`, targetHandleId: `t-${direction}` };

    set({
      nodes: [...nodes, newNode],
      edges: [...edges, newEdge],
      editingNodeId: newId,
      selectedNodeId: newId,
    });
  },

  moveNode: (id, x, y) => {
    set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) });
  },

  renameNode: (id, itemName) => {
    get()._saveSnapshot();
    set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, itemName } : n)) });
  },

  changeBankName: (id, bankName) => {
    get()._saveSnapshot();
    set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, bankName } : n)) });
  },

  changeNodeAmount: (id, amount) => {
    get()._saveSnapshot();
    const nodes = get().nodes.map((n) => (n.id === id ? { ...n, amount } : n));
    const edges = get().edges.map((e) => {
      if (e.fromNodeId !== id) return e;
      return { ...e, ratio: amount ? e.amount / amount : undefined };
    });
    set({ nodes, edges });
  },

  changeNodeColor: (id, color) => {
    get()._saveSnapshot();
    set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, color } : n)) });
  },

  deleteNode: (id) => {
    const { nodes, edges, selectedNodeId, _saveSnapshot } = get();
    _saveSnapshot();
    set({
      nodes: nodes.filter((n) => n.id !== id),
      edges: edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id),
      selectedNodeId: selectedNodeId === id ? undefined : selectedNodeId,
      selectedEdgeId: undefined,
      contextMenu: null,
    });
  },

  createEdge: (sourceId, targetId, sourceHandleId, targetHandleId) => {
    if (sourceId === targetId) return;
    const { nodes, edges, _saveSnapshot } = get();
    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);

    let fromId = sourceId, toId = targetId;
    let fromHandle = sourceHandleId, toHandle = targetHandleId;
    if (sourceNode && targetNode && sourceNode.type === 'destination' && targetNode.type === 'income') {
      fromId = targetId; toId = sourceId; fromHandle = targetHandleId; toHandle = sourceHandleId;
    }

    if (edges.some((e) => e.fromNodeId === fromId && e.toNodeId === toId)) return;
    _saveSnapshot();
    set({
      edges: [...edges, {
        id: `edge-${crypto.randomUUID().slice(0, 8)}`,
        fromNodeId: fromId,
        toNodeId: toId,
        amount: 0,
        sourceHandleId: fromHandle ?? undefined,
        targetHandleId: toHandle ?? undefined,
      }],
    });
  },

  updateEdgeAmount: (edgeId, amount) => {
    const { nodes, edges, _saveSnapshot } = get();
    _saveSnapshot();
    set({
      edges: edges.map((e) => {
        if (e.id !== edgeId) return e;
        const src = nodes.find((n) => n.id === e.fromNodeId);
        return { ...e, amount, ratio: src?.amount ? amount / src.amount : undefined };
      }),
    });
  },

  reconnectEdge: (edgeId, connection) => {
    const { nodes, edges } = get();
    set({
      edges: edges.map((e) => {
        if (e.id !== edgeId) return e;
        const nextSrc = connection.source ?? e.fromNodeId;
        const nextTgt = connection.target ?? e.toNodeId;
        const src = nodes.find((n) => n.id === nextSrc);
        return {
          ...e,
          fromNodeId: nextSrc,
          toNodeId: nextTgt,
          sourceHandleId: connection.sourceHandle ?? e.sourceHandleId,
          targetHandleId: connection.targetHandle ?? e.targetHandleId,
          ratio: src?.amount ? e.amount / src.amount : undefined,
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

  // Actions – UI
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: undefined, contextMenu: null }),
  selectEdge: (id) => {
    const { edges } = get();
    const idx = edges.findIndex((e) => e.id === id);
    let nextEdges = edges;
    if (idx > -1 && idx < edges.length - 1) {
      nextEdges = [...edges];
      const [sel] = nextEdges.splice(idx, 1);
      nextEdges.push(sel);
    }
    set({ selectedEdgeId: id, selectedNodeId: undefined, contextMenu: null, edges: nextEdges });
  },
  clearSelection: () => set({ selectedNodeId: undefined, selectedEdgeId: undefined, editingNodeId: undefined, _editSnapshotSaved: false, contextMenu: null }),
  openNodeMenu: (p) => set({ contextMenu: { type: 'node', ...p } }),
  openPaneMenu: (p) => set({ contextMenu: { type: 'pane', ...p } }),
  closeMenu: () => set({ contextMenu: null }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

  startEditNode: (id) => {
    const s = get();
    if (!s._editSnapshotSaved) {
      s._saveSnapshot();
      set({ _editSnapshotSaved: true });
    }
    set({ editingNodeId: id, selectedNodeId: id, selectedEdgeId: undefined });
  },
  commitEditNode: () => set({ editingNodeId: undefined, _editSnapshotSaved: false }),
  cancelEditNode: () => { get().undo(); set({ editingNodeId: undefined, _editSnapshotSaved: false }); },

  // Actions – history
  undo: () => {
    const { _history, nodes, edges } = get();
    const prev = _history[_history.length - 1];
    if (!prev) return;
    set({
      _history: _history.slice(0, -1),
      _future: [...get()._future, { nodes, edges }],
      _isUndoRedo: true,
      nodes: prev.nodes,
      edges: prev.edges,
    });
  },
  redo: () => {
    const { _future, nodes, edges } = get();
    const next = _future[_future.length - 1];
    if (!next) return;
    set({
      _future: _future.slice(0, -1),
      _history: [...get()._history, { nodes, edges }],
      _isUndoRedo: true,
      nodes: next.nodes,
      edges: next.edges,
    });
  },

  // Actions – persistence
  persist: () => {
    const { scenarioId, month, scenarioName, nodes, edges } = get();
    try {
      set({ saveStatus: 'saving' });
      if (nodes.length === 0 && edges.length === 0) {
        // Don't save empty slots — remove if previously saved
        localStorage.removeItem(slotKey(scenarioId, month));
      } else {
        saveSlot(scenarioId, month, { nodes, edges, updatedAt: new Date().toISOString() });
      }
      const scenarios = loadScenariosIndex();
      const existing = scenarios.find((s) => s.id === scenarioId);
      if (existing) { existing.name = scenarioName; saveScenariosIndex(scenarios); }
      else { saveScenariosIndex([...scenarios, { id: scenarioId, name: scenarioName, createdAt: new Date().toISOString() }]); }
      set({ saveStatus: 'saved', lastSavedAt: new Date().toISOString() });
    } catch { set({ saveStatus: 'error' }); }
  },

  exportAll: () => {
    const scenarios = loadScenariosIndex();
    const slots: Record<string, SlotData> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mf:') && key !== SCENARIOS_INDEX_KEY) {
        try { const r = localStorage.getItem(key); if (r) slots[key] = JSON.parse(r); } catch { /* skip */ }
      }
    }
    return { version: 2 as const, exportedAt: new Date().toISOString(), scenarios, slots };
  },

  importAll: (data) => {
    if (!data || data.version !== 2 || !Array.isArray(data.scenarios)) return false;
    saveScenariosIndex(data.scenarios);
    for (const [key, slotData] of Object.entries(data.slots)) {
      localStorage.setItem(key, JSON.stringify(slotData));
    }
    return true;
  },
}));
