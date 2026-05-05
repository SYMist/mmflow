import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow,
  type Node as RFNode,
  type Edge as RFEdge,
  type Connection,
  type NodeChange,
} from '@xyflow/react';
import { useFlowStoreV3 } from '../../store/flowStoreV3';
import { FlowNode } from './FlowNode';
import { MoneyEdge } from './MoneyEdge';
import { GroupOverlay } from './GroupOverlay';
import { AreaOverlay } from './AreaOverlay';

export const FlowCanvas: React.FC = () => {
  const {
    nodes, edges,
    selection, editingNodeId,
    selectNode, selectEdge, openNodeMenu, openPaneMenu,
    contextMenu, moveNode, clearSelection,
    createEdge, reconnectEdge,
    updateNode, deleteNode, changeNodeColor,
    startEditNode, commitEditNode, cancelEditNode,
    warningNodeIds, tryGroupOnDrop,
  } = useFlowStoreV3();

  const isContextMenuOpen = contextMenu !== null;
  const { screenToFlowPosition } = useReactFlow();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Local override of positions during drag (RF visual smoothness without store thrash)
  const [draggingPositions, setDraggingPositions] = useState<Record<string, { x: number; y: number }>>({});

  const selectedNodeId = selection?.type === 'node' ? selection.id : undefined;
  const selectedEdgeId = selection?.type === 'edge' ? selection.id : undefined;

  // Custom right-click handler
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container || !container.contains(event.target as Node)) return;
      event.preventDefault();
      event.stopPropagation();

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

  // Derive RF nodes from store + dragging override (single source: Zustand)
  const rfNodes = useMemo<RFNode[]>(() =>
    nodes.map((node, index) => {
      const isEditing = node.id === editingNodeId;
      const isSelected = node.id === selectedNodeId;
      const drag = draggingPositions[node.id];
      const x = drag?.x ?? node.x ?? (node.type === 'source' ? 0 : node.type === 'destination' ? 350 : 200);
      const y = drag?.y ?? node.y ?? index * 80;

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
          hasWarning: warnings.has(node.id),
          onRename: (v: string) => updateNode(node.id, { name: v }),
          onChangeAccount: (v: string) => updateNode(node.id, { account: v }),
          onChangeAmount: (v: number) => updateNode(node.id, { amount: v }),
          onChangeColor: (c: string) => changeNodeColor(node.id, c),
          onDelete: () => deleteNode(node.id),
          onCommitEdit: commitEditNode,
          onCancelEdit: cancelEditNode,
        },
        position: { x, y },
        selected: isSelected,
        // Click-to-select then drag: only the selected node is draggable
        draggable: !isEditing && node.type !== 'sub' && isSelected,
      } as RFNode;
    }),
  [nodes, selectedNodeId, editingNodeId, warnings, draggingPositions, updateNode, changeNodeColor, deleteNode, commitEditNode, cancelEditNode]);

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

  const handleNodesChange = (changes: NodeChange[]) => {
    // We only care about position changes here; selection is handled via onNodeClick
    let dragChanges: Record<string, { x: number; y: number } | null> = {};
    let commitMoves: Array<{ id: string; x: number; y: number }> = [];

    for (const c of changes) {
      if (c.type === 'position' && c.position) {
        if (c.dragging) {
          dragChanges[c.id] = c.position;
        } else {
          // drag end
          commitMoves.push({ id: c.id, x: c.position.x, y: c.position.y });
          dragChanges[c.id] = null;
        }
      }
    }

    if (Object.keys(dragChanges).length > 0) {
      setDraggingPositions((prev) => {
        const next = { ...prev };
        for (const [id, pos] of Object.entries(dragChanges)) {
          if (pos === null) delete next[id];
          else next[id] = pos;
        }
        return next;
      });
    }
    for (const m of commitMoves) {
      moveNode(m.id, m.x, m.y);
      tryGroupOnDrop(m.id);
    }
  };

  return (
    <div className="flow-canvas" ref={containerRef}>
      <ReactFlow
        nodeTypes={{ moneyNode: FlowNode }}
        edgeTypes={{ moneyEdge: MoneyEdge }}
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={handleNodesChange}
        fitView
        nodesConnectable
        panOnDrag={selectedNodeId || selectedEdgeId ? [2] : true}
        style={{ width: '100%', height: '100%' }}
        onNodeClick={(_e, node) => selectNode(node.id)}
        onNodeDoubleClick={(_e, node) => startEditNode(node.id)}
        onEdgeClick={(_e, edge) => selectEdge(edge.id)}
        onPaneClick={(event) => {
          if (isContextMenuOpen || event.button === 2) return;
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
        <AreaOverlay />
        <GroupOverlay />
      </ReactFlow>
    </div>
  );
};
