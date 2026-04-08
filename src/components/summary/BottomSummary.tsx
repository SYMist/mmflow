import React from 'react';
import { useFlowStore } from '../../store/flowStore';

export const BottomSummary: React.FC = () => {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  const destinations = React.useMemo(() => nodes.filter((n) => n.type === 'destination'), [nodes]);

  const incomeByNodeId = React.useMemo(
    () => edges.reduce<Record<string, number>>((acc, e) => {
      acc[e.toNodeId] = (acc[e.toNodeId] ?? 0) + e.amount;
      return acc;
    }, {}),
    [edges],
  );

  if (destinations.length === 0) return null;

  return (
    <footer className="bottom-summary">
      <h3>Summary</h3>
      <div className="summary-cards">
        {destinations.map((dest) => {
          const amount = incomeByNodeId[dest.id] ?? 0;
          return (
            <div key={dest.id} className="summary-card">
              <span className="summary-card-dot" style={{ backgroundColor: dest.color }} />
              <div className="summary-card-info">
                <span className="summary-card-name">
                  {dest.itemName}
                  {dest.bankName ? <span className="summary-card-bank"> {dest.bankName}</span> : ''}
                </span>
                <span className="summary-card-amount">{amount.toLocaleString('ko-KR')}원</span>
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};
