import React from 'react';
import type { Connection } from '@xyflow/react';
import { FlowEdgeData, FlowNodeData } from '../../types/flow';
import { Sidebar } from '../sidebar/Sidebar';
import { FlowCanvas } from '../canvas/FlowCanvas';
import { DetailPanel } from '../detail/DetailPanel';
import { BottomSummary } from '../summary/BottomSummary';

interface MainLayoutProps {
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  selectedNodeId?: string;
  selectedEdgeId?: string;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onOpenNodeMenu: (payload: { x: number; y: number; nodeId: string }) => void;
  onOpenPaneMenu: (payload: { x: number; y: number; flowX: number; flowY: number }) => void;
  isContextMenuOpen: boolean;
  onAddIncome: () => void;
  onAddDestination: () => void;
  onRenameNode: (id: string, name: string) => void;
  onChangeBankName: (id: string, bankName: string) => void;
  onChangeNodeAmount: (id: string, amount: number) => void;
  onDeleteNode: (id: string) => void;
  onAddNodeAround: (sourceNodeId: string, direction: 'left' | 'right' | 'top' | 'bottom') => void;
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
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  onOpenNodeMenu,
  onOpenPaneMenu,
  isContextMenuOpen,
  onAddIncome,
  onAddDestination,
  onRenameNode,
  onChangeBankName,
  onChangeNodeAmount,
  onDeleteNode,
  onAddNodeAround,
  onMoveNode,
  onClearSelection,
  onCreateEdge,
  onUpdateEdgeAmount,
  onReconnectEdge,
  onDeleteEdge,
}) => {
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  return (
    <main className="main-layout">
      <Sidebar
        nodes={nodes}
        edges={edges}
        onSelectNode={onSelectNode}
        onSelectEdge={onSelectEdge}
        onAddIncome={onAddIncome}
        onAddDestination={onAddDestination}
        onOpenNodeMenu={onOpenNodeMenu}
      />
      <FlowCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        onSelectNode={onSelectNode}
        onSelectEdge={onSelectEdge}
        onOpenNodeMenu={onOpenNodeMenu}
        onOpenPaneMenu={onOpenPaneMenu}
        isContextMenuOpen={isContextMenuOpen}
        onAddNodeAround={onAddNodeAround}
        onMoveNode={onMoveNode}
        onClearSelection={onClearSelection}
        onCreateEdge={onCreateEdge}
        onUpdateEdgeAmount={onUpdateEdgeAmount}
        onReconnectEdge={onReconnectEdge}
        onDeleteEdge={onDeleteEdge}
      />
      <DetailPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onRenameNode={onRenameNode}
        onChangeBankName={onChangeBankName}
        onChangeNodeAmount={onChangeNodeAmount}
        onDeleteNode={onDeleteNode}
      />
      <BottomSummary nodes={nodes} edges={edges} />
    </main>
  );
};
