import React from 'react';
import { useFlowStore } from '../../store/flowStore';
import { IncomeList } from './IncomeList';
import { DestinationList } from './DestinationList';
import { RuleList } from './RuleList';

export const Sidebar: React.FC = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const selectNode = useFlowStore((s) => s.selectNode);
  const selectEdge = useFlowStore((s) => s.selectEdge);
  const addIncome = useFlowStore((s) => s.addIncome);
  const addDestination = useFlowStore((s) => s.addDestination);

  const incomes = React.useMemo(() => nodes.filter((n) => n.type === 'income'), [nodes]);
  const destinations = React.useMemo(() => nodes.filter((n) => n.type === 'destination'), [nodes]);

  return (
    <aside className="sidebar">
      <IncomeList incomes={incomes} onSelect={selectNode} onAdd={addIncome} />
      <DestinationList destinations={destinations} onSelect={selectNode} onAdd={addDestination} />
      <RuleList edges={edges} nodes={nodes} onSelect={selectEdge} />
    </aside>
  );
};
