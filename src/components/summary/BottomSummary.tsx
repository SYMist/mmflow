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

  return (
    <footer className="bottom-summary">
      <h3>이번 달 요약</h3>
      <table>
        <thead>
          <tr>
            <th>목적지</th>
            <th>유입 합계</th>
          </tr>
        </thead>
        <tbody>
          {destinations.map((destination) => (
            <tr key={destination.id}>
              <td>
                {destination.itemName}
                {destination.bankName ? ` · ${destination.bankName}` : ''}
              </td>
              <td>{(incomeByNodeId[destination.id] ?? 0).toLocaleString('ko-KR')}원</td>
            </tr>
          ))}
        </tbody>
      </table>
    </footer>
  );
};
