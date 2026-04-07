import React from 'react';
import { FlowEdgeData, FlowNodeData } from '../../types/flow';

interface BottomSummaryProps {
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
}

export const BottomSummary: React.FC<BottomSummaryProps> = ({ nodes, edges }) => {
  const destinations = nodes.filter((node) => node.type === 'destination');

  const incomeByNodeId = edges.reduce<Record<string, number>>((accumulator, edge) => {
    const current = accumulator[edge.toNodeId] ?? 0;
    accumulator[edge.toNodeId] = current + edge.amount;
    return accumulator;
  }, {});

  if (destinations.length === 0) {
    return null;
  }

  return (
    <footer className="bottom-summary">
      <h3>Summary</h3>
      <div className="summary-cards">
        {destinations.map((destination) => {
          const amount = incomeByNodeId[destination.id] ?? 0;
          return (
            <div key={destination.id} className="summary-card">
              <span className="summary-card-dot" style={{ backgroundColor: destination.color }} />
              <div className="summary-card-info">
                <span className="summary-card-name">
                  {destination.itemName}
                  {destination.bankName ? <span className="summary-card-bank"> {destination.bankName}</span> : ''}
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
