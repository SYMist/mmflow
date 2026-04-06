import React from 'react';
import type { Connection } from '@xyflow/react';
import { ReactFlowProvider } from '@xyflow/react';
import { Header } from './layout/Header';
import { MainLayout } from './layout/MainLayout';
import { FlowEdgeData, FlowNodeData } from '../types/flow';

const STORAGE_KEY = 'money-flow-state-v1';

const initialNodes: FlowNodeData[] = [
  {
    id: 'income-salary',
    type: 'income',
    itemName: '월급',
    bankName: '회사',
    amount: 3000000,
    color: '#4f46e5',
    x: 0,
    y: 80,
  },
  {
    id: 'dest-living',
    type: 'destination',
    itemName: '생활비',
    bankName: '국민은행',
    amount: 1500000,
    color: '#10b981',
    x: 350,
    y: 40,
  },
  {
    id: 'dest-invest',
    type: 'destination',
    itemName: '투자',
    bankName: '토스증권',
    amount: 1500000,
    color: '#f97316',
    x: 350,
    y: 140,
  },
];

const initialEdges: FlowEdgeData[] = [
  {
    id: 'edge-salary-living',
    fromNodeId: 'income-salary',
    toNodeId: 'dest-living',
    amount: 1500000,
    ratio: 0.5,
  },
  {
    id: 'edge-salary-invest',
    fromNodeId: 'income-salary',
    toNodeId: 'dest-invest',
    amount: 1500000,
    ratio: 0.5,
  },
];

type PersistedState = {
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  month: string;
  scenarioName: string;
  updatedAt: string;
};

type ContextMenuState =
  | { type: 'node'; x: number; y: number; nodeId: string }
  | { type: 'pane'; x: number; y: number; flowX: number; flowY: number }
  | null;

const loadPersistedState = (): PersistedState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const App: React.FC = () => {
  const persisted = loadPersistedState();
  const [month, setMonth] = React.useState<string>(
    persisted?.month ?? '2025-01',
  );
  const [scenarioName, setScenarioName] = React.useState<string>(
    persisted?.scenarioName ?? '기본 시나리오',
  );
  const [nodes, setNodes] = React.useState<FlowNodeData[]>(
    persisted?.nodes ?? initialNodes,
  );
  const [edges, setEdges] = React.useState<FlowEdgeData[]>(
    persisted?.edges ?? initialEdges,
  );
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(
    persisted?.updatedAt ?? null,
  );
  const [saveStatus, setSaveStatus] = React.useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState>(null);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | undefined>();
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | undefined>();

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.closest('.react-flow')) {
        return;
      }

      const sidebar = target.closest('.sidebar');
      if (!sidebar) {
        return;
      }

      const nodeElement = target.closest<HTMLElement>('[data-node-id]');
      const nodeId = nodeElement?.getAttribute('data-node-id');
      if (!nodeId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setSelectedNodeId(nodeId);
      setSelectedEdgeId(undefined);
      setContextMenu({ type: 'node', x: event.clientX, y: event.clientY, nodeId });
    };

    window.addEventListener('contextmenu', handler, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', handler, { capture: true } as AddEventListenerOptions);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setSaveStatus('saving');

    const handle = window.setTimeout(() => {
      const payload: PersistedState = {
        nodes,
        edges,
        month,
        scenarioName,
        updatedAt: new Date().toISOString(),
      };

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setLastSavedAt(payload.updatedAt);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  }, [nodes, edges, month, scenarioName]);

  const totalIn = React.useMemo(() => {
    return nodes
      .filter((node) => node.type === 'income')
      .reduce((sum, _node) => {
        if (_node.id === 'income-salary') {
          return sum + 3000000;
        }
        return sum;
      }, 0);
  }, [nodes]);

  const totalOut = React.useMemo(
    () => edges.reduce((sum, edge) => sum + edge.amount, 0),
    [edges],
  );

  const getFallbackPosition = React.useCallback(
    (node: FlowNodeData, index: number) => ({
      x: node.x ?? (node.type === 'income' ? 0 : 350),
      y: node.y ?? index * 80,
    }),
    [],
  );

  const handleAddIncome = () => {
    const incomes = nodes.filter((node) => node.type === 'income');
    const incomeYs = incomes.map((node, index) => getFallbackPosition(node, index).y);
    const nextY = incomeYs.length ? Math.max(...incomeYs) + 140 : 0;
    const newIncome: FlowNodeData = {
      id: `income-${nodes.length + 1}`,
      type: 'income',
      itemName: `새 수입 ${nodes.length + 1}`,
      bankName: '',
      amount: 0,
      color: '#6366f1',
      x: 0,
      y: nextY,
    };
    setNodes((previous) => [...previous, newIncome]);
  };

  const handleAddDestination = () => {
    const destinations = nodes.filter((node) => node.type === 'destination');
    const destinationYs = destinations.map((node, index) => getFallbackPosition(node, index).y);
    const nextY = destinationYs.length ? Math.max(...destinationYs) + 140 : 0;
    const newDestination: FlowNodeData = {
      id: `dest-${nodes.length + 1}`,
      type: 'destination',
      itemName: `새 목적지 ${nodes.length + 1}`,
      bankName: '',
      amount: 0,
      color: '#0ea5e9',
      x: 350,
      y: nextY,
    };
    setNodes((previous) => [...previous, newDestination]);
  };

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
    setSelectedEdgeId(undefined);
    setContextMenu(null);
  };

  const handleSelectEdge = (id: string) => {
    setSelectedEdgeId(id);
    setSelectedNodeId(undefined);
    setContextMenu(null);
    setEdges((previous) => {
      const index = previous.findIndex((edge) => edge.id === id);
      if (index <= -1 || index === previous.length - 1) {
        return previous;
      }
      const next = [...previous];
      const [selectedEdge] = next.splice(index, 1);
      next.push(selectedEdge);
      return next;
    });
  };

  const handleRenameNode = (id: string, itemName: string) => {
    setNodes((previous) =>
      previous.map((node) => (node.id === id ? { ...node, itemName } : node)),
    );
  };

  const handleDeleteNode = (id: string) => {
    setNodes((previous) => previous.filter((node) => node.id !== id));
    setEdges((previous) =>
      previous.filter(
        (edge) => edge.fromNodeId !== id && edge.toNodeId !== id,
      ),
    );

    if (selectedNodeId === id) {
      setSelectedNodeId(undefined);
    }
    setSelectedEdgeId(undefined);
    setContextMenu(null);
  };

  const handleChangeBankName = (id: string, bankName: string) => {
    setNodes((previous) =>
      previous.map((node) => (node.id === id ? { ...node, bankName } : node)),
    );
  };

  const handleChangeNodeAmount = (id: string, amount: number) => {
    setNodes((previous) =>
      previous.map((node) => (node.id === id ? { ...node, amount } : node)),
    );

    setEdges((previous) =>
      previous.map((edge) => {
        if (edge.fromNodeId !== id) {
          return edge;
        }
        const ratio = amount ? edge.amount / amount : undefined;
        return {
          ...edge,
          ratio,
        };
      }),
    );
  };

  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes((previous) =>
      previous.map((node) => (node.id === id ? { ...node, x, y } : node)),
    );
  };

  const handleAddNodeAround = (
    sourceNodeId: string,
    direction: 'left' | 'right' | 'top' | 'bottom',
  ) => {
    setNodes((prevNodes) => {
      const source = prevNodes.find((node) => node.id === sourceNodeId);
      if (!source) return prevNodes;

      const isSourceIncome = source.type === 'income';
      const newType: FlowNodeData['type'] = isSourceIncome ? 'destination' : 'income';
      const sourceIndex = prevNodes.findIndex((node) => node.id === sourceNodeId);
      const sourceFallback = getFallbackPosition(source, Math.max(sourceIndex, 0));
      const baseX = sourceFallback.x;
      const baseY = sourceFallback.y;
      const offset = 180;

      let x = baseX;
      let y = baseY;
      if (direction === 'left') x = baseX - offset;
      if (direction === 'right') x = baseX + offset;
      if (direction === 'top') y = baseY - offset;
      if (direction === 'bottom') y = baseY + offset;

      const occupiedPositions = prevNodes.map((node, index) => getFallbackPosition(node, index));

      const isOccupied = (candidateX: number, candidateY: number) =>
        occupiedPositions.some(
          (pos) =>
            Math.abs(pos.x - candidateX) < 160 && Math.abs(pos.y - candidateY) < 120,
        );

      const directionVector =
        direction === 'left'
          ? { dx: -1, dy: 0 }
          : direction === 'right'
            ? { dx: 1, dy: 0 }
            : direction === 'top'
              ? { dx: 0, dy: -1 }
              : { dx: 0, dy: 1 };
      const step = 40;
      const maxSteps = 10;
      const lateralOffsets = [0, 1, -1, 2, -2, 3, -3];
      let found = !isOccupied(x, y);
      if (!found) {
        for (let i = 1; i <= maxSteps && !found; i += 1) {
          const baseCandidateX = x + directionVector.dx * step * i;
          const baseCandidateY = y + directionVector.dy * step * i;
          for (const lateral of lateralOffsets) {
            const candidateX =
              directionVector.dx === 0
                ? baseCandidateX + lateral * step
                : baseCandidateX;
            const candidateY =
              directionVector.dy === 0
                ? baseCandidateY + lateral * step
                : baseCandidateY;
            if (!isOccupied(candidateX, candidateY)) {
              x = candidateX;
              y = candidateY;
              found = true;
              break;
            }
          }
        }
      }

      const newIdPrefix = newType === 'income' ? 'income' : 'dest';
      const countForType = prevNodes.filter((node) => node.type === newType).length + 1;
      const newId = `${newIdPrefix}-${countForType}`;

      const newNode: FlowNodeData = {
        id: newId,
        type: newType,
        itemName: newType === 'income' ? `새 수입 ${countForType}` : `새 목적지 ${countForType}`,
        bankName: '',
        amount: 0,
        color: newType === 'income' ? '#6366f1' : '#0ea5e9',
        x,
        y,
      };

      const oppositeDirection =
        direction === 'left'
          ? 'right'
          : direction === 'right'
            ? 'left'
            : direction === 'top'
              ? 'bottom'
              : 'top';

      // 새 노드 추가와 동시에 연결 엣지 생성
      setEdges((prevEdges) => {
        const newEdge: FlowEdgeData =
          isSourceIncome
            ? {
                id: `edge-${source.id}-${newId}`,
                fromNodeId: source.id,
                toNodeId: newId,
                amount: 0,
                sourceHandleId: `s-${direction}`,
                targetHandleId: `t-${oppositeDirection}`,
              }
            : {
                id: `edge-${newId}-${source.id}`,
                fromNodeId: newId,
                toNodeId: source.id,
                amount: 0,
                sourceHandleId: `s-${oppositeDirection}`,
                targetHandleId: `t-${direction}`,
              };
        return [...prevEdges, newEdge];
      });

      return [...prevNodes, newNode];
    });
  };

  const handleCreateEdge = (
    sourceId: string,
    targetId: string,
    sourceHandleId?: string | null,
    targetHandleId?: string | null,
  ) => {
    if (sourceId === targetId) {
      return;
    }

    setEdges((previous) => {
      const exists = previous.some(
        (edge) => edge.fromNodeId === sourceId && edge.toNodeId === targetId,
      );
      if (exists) {
        return previous;
      }

      const newEdge: FlowEdgeData = {
        id: `edge-${sourceId}-${targetId}-${previous.length + 1}`,
        fromNodeId: sourceId,
        toNodeId: targetId,
        amount: 0,
        sourceHandleId: sourceHandleId ?? undefined,
        targetHandleId: targetHandleId ?? undefined,
      };
      return [...previous, newEdge];
    });
  };

  const handleUpdateEdgeAmount = (edgeId: string, amount: number) => {
    setEdges((previous) =>
      previous.map((edge) => {
        if (edge.id !== edgeId) {
          return edge;
        }
        const sourceNode = nodes.find((node) => node.id === edge.fromNodeId);
        const ratio = sourceNode?.amount ? amount / sourceNode.amount : undefined;
        return { ...edge, amount, ratio };
      }),
    );
  };

  const handleReconnectEdge = (edgeId: string, connection: Connection) => {
    setEdges((previous) =>
      previous.map((edge) => {
        if (edge.id !== edgeId) {
          return edge;
        }

        const nextSourceId = connection.source ?? edge.fromNodeId;
        const nextTargetId = connection.target ?? edge.toNodeId;
        const nextEdge: FlowEdgeData = {
          ...edge,
          fromNodeId: nextSourceId,
          toNodeId: nextTargetId,
          sourceHandleId: connection.sourceHandle ?? edge.sourceHandleId,
          targetHandleId: connection.targetHandle ?? edge.targetHandleId,
        };

        const sourceNode = nodes.find((node) => node.id === nextSourceId);
        nextEdge.ratio = sourceNode?.amount ? nextEdge.amount / sourceNode.amount : undefined;

        return nextEdge;
      }),
    );
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((previous) => previous.filter((edge) => edge.id !== edgeId));
    if (selectedEdgeId === edgeId) {
      setSelectedEdgeId(undefined);
    }
    setContextMenu(null);
  };

  const handleOpenNodeMenu = (payload: { x: number; y: number; nodeId: string }) => {
    setContextMenu({ type: 'node', ...payload });
  };

  const handleOpenPaneMenu = (payload: {
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  }) => {
    setContextMenu({ type: 'pane', ...payload });
  };

  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  const handleCreateNodeAt = (type: FlowNodeData['type'], x: number, y: number) => {
    setNodes((previous) => {
      const countForType = previous.filter((node) => node.type === type).length + 1;
      const newIdPrefix = type === 'income' ? 'income' : 'dest';
      const newNode: FlowNodeData = {
        id: `${newIdPrefix}-${countForType}`,
        type,
        itemName: type === 'income' ? `새 수입 ${countForType}` : `새 목적지 ${countForType}`,
        bankName: '',
        amount: 0,
        color: type === 'income' ? '#6366f1' : '#0ea5e9',
        x,
        y,
      };
      return [...previous, newNode];
    });
    setContextMenu(null);
  };
  const handleClearSelection = () => {
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    setContextMenu(null);
  };

  return (
    <div className="app-root">
      {contextMenu ? (
        <div
          className="context-menu-overlay"
          onClick={handleCloseMenu}
          onContextMenu={handleCloseMenu}
        >
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.stopPropagation()}
          >
            {contextMenu.type === 'node' ? (
              <button
                type="button"
                className="context-menu-item"
                onClick={() => handleDeleteNode(contextMenu.nodeId)}
              >
                삭제
              </button>
            ) : (
              <div className="context-menu-item context-menu-parent">
                <span>노드 생성</span>
                <span className="context-menu-caret">▶</span>
                <div className="context-submenu">
                  <button
                    type="button"
                    className="context-menu-item"
                    onClick={() =>
                      handleCreateNodeAt('income', contextMenu.flowX, contextMenu.flowY)
                    }
                  >
                    수입
                  </button>
                  <button
                    type="button"
                    className="context-menu-item"
                    onClick={() =>
                      handleCreateNodeAt('destination', contextMenu.flowX, contextMenu.flowY)
                    }
                  >
                    목적지
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      <Header
        month={month}
        scenarioName={scenarioName}
        onChangeMonth={setMonth}
        onChangeScenario={setScenarioName}
        totalIn={totalIn}
        totalOut={totalOut}
        lastSavedAt={lastSavedAt}
        saveStatus={saveStatus}
      />
      <ReactFlowProvider>
      <MainLayout
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        onSelectNode={handleSelectNode}
        onSelectEdge={handleSelectEdge}
        onOpenNodeMenu={handleOpenNodeMenu}
        onOpenPaneMenu={handleOpenPaneMenu}
        isContextMenuOpen={contextMenu !== null}
        onAddIncome={handleAddIncome}
        onAddDestination={handleAddDestination}
        onRenameNode={handleRenameNode}
        onChangeBankName={handleChangeBankName}
        onChangeNodeAmount={handleChangeNodeAmount}
          onDeleteNode={handleDeleteNode}
          onAddNodeAround={handleAddNodeAround}
          onMoveNode={handleMoveNode}
          onClearSelection={handleClearSelection}
          onCreateEdge={handleCreateEdge}
          onUpdateEdgeAmount={handleUpdateEdgeAmount}
          onReconnectEdge={handleReconnectEdge}
          onDeleteEdge={handleDeleteEdge}
        />
      </ReactFlowProvider>
    </div>
  );
};
