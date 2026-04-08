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
import { useFlowStore } from '../../store/flowStore';
import { FlowNode } from './FlowNode';
import { MoneyEdge } from './MoneyEdge';

export const FlowCanvas: React.FC = () => {
  const {
    nodes, edges,
    selectedNodeId, selectedEdgeId, editingNodeId,
    selectNode, selectEdge, openNodeMenu, openPaneMenu,
    contextMenu, addNodeAround, moveNode, clearSelection,
    createEdge, updateEdgeAmount, reconnectEdge, deleteEdge,
    renameNode, changeBankName, changeNodeAmount, changeNodeColor, deleteNode,
    startEditNode, commitEditNode, cancelEditNode,
  } = useFlowStore();

  const isContextMenuOpen = contextMenu !== null;
  const { screenToFlowPosition } = useReactFlow();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode>([]);
  const suppressNextPaneClickRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Context menu handler
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

  // Sync nodes to RF nodes — only update changed nodes (P2 optimization)
  useEffect(() => {
    setRfNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return nodes.map((node, index) => {
        const existing = prevMap.get(node.id);
        const isEditing = node.id === editingNodeId;
        const isSelected = node.id === selectedNodeId;

        // Reuse existing RF node if data hasn't changed
        if (
          existing &&
          existing.data.itemName === node.itemName &&
          existing.data.bankName === node.bankName &&
          existing.data.amount === node.amount &&
          existing.data.color === node.color &&
          existing.data.isEditing === isEditing &&
          existing.selected === isSelected
        ) {
          return existing;
        }

        return {
          id: node.id,
          type: 'moneyNode',
          data: {
            itemName: node.itemName,
            bankName: node.bankName,
            amount: node.amount,
            type: node.type,
            color: node.color,
            isEditing,
            onAddNeighbor: (dir: 'left' | 'right' | 'top' | 'bottom') => addNodeAround(node.id, dir),
            onRename: (name: string) => renameNode(node.id, name),
            onChangeBankName: (bn: string) => changeBankName(node.id, bn),
            onChangeAmount: (amt: number) => changeNodeAmount(node.id, amt),
            onChangeColor: (c: string) => changeNodeColor(node.id, c),
            onDelete: () => deleteNode(node.id),
            onCommitEdit: commitEditNode,
            onCancelEdit: cancelEditNode,
          },
          position: existing?.position ?? {
            x: node.x ?? (node.type === 'income' ? 0 : 350),
            y: node.y ?? index * 80,
          },
          selected: isSelected,
          draggable: !isEditing,
        } as RFNode;
      });
    });
  }, [nodes, selectedNodeId, editingNodeId, addNodeAround, renameNode, changeBankName, changeNodeAmount, changeNodeColor, deleteNode, commitEditNode, cancelEditNode, setRfNodes]);

  const nodeMap = useMemo(() => {
    const m = new Map(nodes.map((n) => [n.id, n]));
    return m;
  }, [nodes]);

  const rfEdges = useMemo<RFEdge[]>(() =>
    edges.map((edge) => {
      const fromNode = nodeMap.get(edge.fromNodeId);
      const toNode = nodeMap.get(edge.toNodeId);
      const ratio = fromNode?.amount
        ? (edge.amount || toNode?.amount || 0) / fromNode.amount
        : undefined;

      return {
        id: edge.id,
        source: edge.fromNodeId,
        target: edge.toNodeId,
        sourceHandle: edge.sourceHandleId,
        targetHandle: edge.targetHandleId,
        type: 'moneyEdge',
        data: { amount: edge.amount, ratio, onChangeAmount: updateEdgeAmount, onDeleteEdge: deleteEdge },
        animated: false,
        selected: edge.id === selectedEdgeId,
        zIndex: edge.id === selectedEdgeId ? 10 : 1,
        style: { strokeWidth: edge.id === selectedEdgeId ? 3 : 2 },
      };
    }),
  [edges, selectedEdgeId, nodeMap, updateEdgeAmount, deleteEdge]);

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
