import React from 'react';
import { FlowEdgeData, FlowNodeData } from '../../types/flow';
import { IncomeList } from './IncomeList';
import { DestinationList } from './DestinationList';
import { RuleList } from './RuleList';

interface SidebarProps {
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onAddIncome: () => void;
  onAddDestination: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  edges,
  onSelectNode,
  onSelectEdge,
  onAddIncome,
  onAddDestination,
}) => {
  const incomes = nodes.filter((node) => node.type === 'income');
  const destinations = nodes.filter((node) => node.type === 'destination');

  return (
    <aside className="sidebar">
      <IncomeList
        incomes={incomes}
        onSelect={onSelectNode}
        onAdd={onAddIncome}
      />
      <DestinationList
        destinations={destinations}
        onSelect={onSelectNode}
        onAdd={onAddDestination}
      />
      <RuleList edges={edges} nodes={nodes} onSelect={onSelectEdge} />
    </aside>
  );
};
