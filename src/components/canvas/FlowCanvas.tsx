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
import { FlowEdgeData, FlowNodeData } from '../../types/flow';
import { FlowNode } from './FlowNode';
import { MoneyEdge } from './MoneyEdge';

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface FlowCanvasProps {
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  selectedNodeId?: string;
  selectedEdgeId?: string;
  editingNodeId?: string;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onOpenNodeMenu: (payload: { x: number; y: number; nodeId: string }) => void;
  onOpenPaneMenu: (payload: { x: number; y: number; flowX: number; flowY: number }) => void;
  isContextMenuOpen: boolean;
  onAddNodeAround: (sourceNodeId: string, direction: Direction) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onClearSelection: () => void;
  onCreateEdge: (
    sourceId: string,
    targetId: string,
    sourceHandleId?: string | null,
    targetHandleId?: string | null,
  ) => void;
  onUpdateEdgeAmount: (edgeId: string, amount: number) => void;
  onReconnectEdge: (edgeId: string, connection: Connection) => void;
  onDeleteEdge: (edgeId: string) => void;
  onRenameNode: (id: string, name: string) => void;
  onChangeBankName: (id: string, bankName: string) => void;
  onChangeNodeAmount: (id: string, amount: number) => void;
  onDeleteNode: (id: string) => void;
  onStartEditNode: (id: string) => void;
  onCommitEditNode: () => void;
  onCancelEditNode: () => void;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  editingNodeId,
  onSelectNode,
  onSelectEdge,
  onOpenNodeMenu,
  onOpenPaneMenu,
  isContextMenuOpen,
  onAddNodeAround,
  onMoveNode,
  onClearSelection,
  onCreateEdge,
  onUpdateEdgeAmount,
  onReconnectEdge,
  onDeleteEdge,
  onRenameNode,
  onChangeBankName,
  onChangeNodeAmount,
  onDeleteNode,
  onStartEditNode,
  onCommitEditNode,
  onCancelEditNode,
}: FlowCanvasProps) => {
  const { screenToFlowPosition } = useReactFlow();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode>([]);
  const suppressNextPaneClickRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      if (!container.contains(event.target as Node)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      suppressNextPaneClickRef.current = true;
      window.setTimeout(() => {
        suppressNextPaneClickRef.current = false;
      }, 0);

      const target = event.target as HTMLElement | null;
      const nodeElement = target?.closest('.react-flow__node') as HTMLElement | null;
      const nodeId = nodeElement?.getAttribute('data-id');

      if (nodeId) {
        onSelectNode(nodeId);
        onOpenNodeMenu({ x: event.clientX, y: event.clientY, nodeId });
        return;
      }

      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      onOpenPaneMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      });
    };

    window.addEventListener('contextmenu', handler, { capture: true });
    return () => {
      window.removeEventListener('contextmenu', handler, { capture: true } as AddEventListenerOptions);
    };
  }, [onOpenNodeMenu, onOpenPaneMenu, onSelectNode, screenToFlowPosition]);

  useEffect(() => {
    setRfNodes((previousNodes) =>
      nodes.map((node: FlowNodeData, index: number) => {
        const existing = previousNodes.find((rfNode) => rfNode.id === node.id);
        const isEditing = node.id === editingNodeId;

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
            onAddNeighbor: (direction: Direction) => onAddNodeAround(node.id, direction),
            onRename: (name: string) => onRenameNode(node.id, name),
            onChangeBankName: (bankName: string) => onChangeBankName(node.id, bankName),
            onChangeAmount: (amount: number) => onChangeNodeAmount(node.id, amount),
            onDelete: () => onDeleteNode(node.id),
            onCommitEdit: onCommitEditNode,
            onCancelEdit: onCancelEditNode,
          },
          position:
            existing?.position ??
            ({
              x: node.x ?? (node.type === 'income' ? 0 : 350),
              y: node.y ?? index * 80,
            } as RFNode['position']),
          selected: node.id === selectedNodeId,
          draggable: !isEditing,
        } as RFNode;
      }),
    );
  }, [nodes, selectedNodeId, editingNodeId, onAddNodeAround, onRenameNode, onChangeBankName, onChangeNodeAmount, onDeleteNode, onCommitEditNode, onCancelEditNode, setRfNodes]);

  const nodeMap = useMemo(() => {
    return nodes.reduce<Record<string, FlowNodeData>>((accumulator, node) => {
      accumulator[node.id] = node;
      return accumulator;
    }, {});
  }, [nodes]);

  const rfEdges = useMemo<RFEdge[]>(
    () =>
      edges.map((edge: FlowEdgeData) => {
        const fromNode = nodeMap[edge.fromNodeId];
        const toNode = nodeMap[edge.toNodeId];
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
          data: {
            amount: edge.amount,
            ratio,
            onChangeAmount: onUpdateEdgeAmount,
            onDeleteEdge,
          },
          animated: false,
          selected: edge.id === selectedEdgeId,
          zIndex: edge.id === selectedEdgeId ? 10 : 1,
          style: {
            strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
          },
        };
      }),
    [edges, selectedEdgeId, nodeMap],
  );

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
        onNodeClick={(_event, node) => onSelectNode(node.id)}
        onNodeDoubleClick={(_event, node) => onStartEditNode(node.id)}
        onEdgeClick={(_event, edge) => onSelectEdge(edge.id)}
        onNodeDragStop={(_event, node) =>
          onMoveNode(node.id, node.position.x ?? 0, node.position.y ?? 0)
        }
        onPaneClick={(event) => {
          if (suppressNextPaneClickRef.current) {
            return;
          }
          if (isContextMenuOpen) {
            return;
          }
          if (event.button === 2) {
            return;
          }
          onClearSelection();
        }}
        onConnect={(connection: Connection) => {
          if (connection.source && connection.target) {
            onCreateEdge(
              connection.source,
              connection.target,
              connection.sourceHandle ?? undefined,
              connection.targetHandle ?? undefined,
            );
          }
        }}
        edgesReconnectable={true}
        reconnectRadius={14}
        onReconnect={(oldEdge, newConnection) => {
          onReconnectEdge(oldEdge.id, newConnection);
        }}
      >
        <Background gap={20} size={1} color="#e5e7eb" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};
