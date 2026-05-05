import React, { useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useReactFlow,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
} from '@xyflow/react';
import { useFlowStoreV3 } from '../../store/flowStoreV3';
import { FlowNode } from './FlowNode';
import { MoneyEdge } from './MoneyEdge';

export const FlowCanvas: React.FC = () => {
  const {
    nodes, edges,
    selectedNodeId, selectedEdgeId, editingNodeId,
    selectNode, selectEdge, openNodeMenu, openPaneMenu,
    contextMenu, moveNode, clearSelection,
    createEdge, reconnectEdge, deleteEdge,
    updateNode, deleteNode, changeNodeColor,
    startEditNode, commitEditNode, cancelEditNode,
    warningNodeIds,
  } = useFlowStoreV3();

  const isContextMenuOpen = contextMenu !== null;
  const { screenToFlowPosition } = useReactFlow();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode>([]);
  const suppressNextPaneClickRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Custom context menu handler
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container || !container.contains(event.target as Node)) return;

      event.preventDefault();
      event.stopPropagation();
      suppressNextPaneClickRef.current = true;
      window.setTimeout(() => { suppressNextPaneClickRef.current = false; }, 0);

      const nodeEl = (event.target as HTMLElement)?.closest('.react-flow__node') as HTMLElement | null;
      const nodeId = nodeEl?.getAttribute('data-id');

      if (nodeId) {
        selectNode(nodeId);
        openNodeMenu({ x: event.clientX, y: event.clientY, nodeId });
        return;
      }

      const fp = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      openPaneMenu({ x: event.clientX, y: event.clientY, flowX: fp.x, flowY: fp.y });
    };

    window.addEventListener('contextmenu', handler, { capture: true });
    return () => window.removeEventListener('contextmenu', handler, { capture: true } as EventListenerOptions);
  }, [selectNode, openNodeMenu, openPaneMenu, screenToFlowPosition]);

  const warnings = useMemo(() => warningNodeIds(), [warningNodeIds, nodes, edges]);

  // Sync nodes
  useEffect(() => {
    setRfNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return nodes.map((node, index) => {
        const existing = prevMap.get(node.id);
        const isEditing = node.id === editingNodeId;
        const isSelected = node.id === selectedNodeId;
        const hasWarning = warnings.has(node.id);

        if (
          existing &&
          existing.data.name === node.name &&
          existing.data.account === node.account &&
          existing.data.amount === node.amount &&
          existing.data.color === node.color &&
          existing.data.isEditing === isEditing &&
          existing.data.hasWarning === hasWarning &&
          existing.selected === isSelected &&
          existing.position.x === (node.x ?? 0) &&
          existing.position.y === (node.y ?? 0)
        ) {
          return existing;
        }

        return {
          id: node.id,
          type: 'moneyNode',
          data: {
            type: node.type,
            name: node.name,
            account: node.account,
            amount: node.amount,
            color: node.color,
            isEditing,
            hasWarning,
            onRename: (v: string) => updateNode(node.id, { name: v }),
            onChangeAccount: (v: string) => updateNode(node.id, { account: v }),
            onChangeAmount: (v: number) => updateNode(node.id, { amount: v }),
            onChangeColor: (c: string) => changeNodeColor(node.id, c),
            onDelete: () => deleteNode(node.id),
            onCommitEdit: commitEditNode,
            onCancelEdit: cancelEditNode,
          },
          position: {
            x: node.x ?? (node.type === 'source' ? 0 : node.type === 'destination' ? 350 : 200),
            y: node.y ?? index * 80,
          },
          selected: isSelected,
          draggable: !isEditing && node.type !== 'sub',
        } as RFNode;
      });
    });
  }, [nodes, selectedNodeId, editingNodeId, warnings, updateNode, changeNodeColor, deleteNode, commitEditNode, cancelEditNode, setRfNodes]);

  const rfEdges = useMemo<RFEdge[]>(() =>
    edges.map((edge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      sourceHandle: edge.sourceHandleId,
      targetHandle: edge.targetHandleId,
      type: 'moneyEdge',
      selected: edge.id === selectedEdgeId,
      zIndex: edge.id === selectedEdgeId ? 10 : 1,
    })),
  [edges, selectedEdgeId]);

  return (
    <div className="flow-canvas" ref={containerRef}>
      <ReactFlow
        nodeTypes={{ moneyNode: FlowNode }}
        edgeTypes={{ moneyEdge: MoneyEdge }}
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        fitView
        nodesConnectable
        panOnDrag={selectedNodeId || selectedEdgeId ? [2] : true}
        style={{ width: '100%', height: '100%' }}
        onNodeClick={(_e, node) => selectNode(node.id)}
        onNodeDoubleClick={(_e, node) => startEditNode(node.id)}
        onEdgeClick={(_e, edge) => selectEdge(edge.id)}
        onNodeDragStop={(_e, node) => moveNode(node.id, node.position.x ?? 0, node.position.y ?? 0)}
        onPaneClick={(event) => {
          if (suppressNextPaneClickRef.current || isContextMenuOpen || event.button === 2) return;
          clearSelection();
        }}
        onConnect={(conn: Connection) => {
          if (conn.source && conn.target) {
            createEdge(conn.source, conn.target, conn.sourceHandle ?? undefined, conn.targetHandle ?? undefined);
          }
        }}
        edgesReconnectable
        reconnectRadius={14}
        onReconnect={(oldEdge, newConn) => reconnectEdge(oldEdge.id, newConn)}
      >
        <Background gap={20} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};
