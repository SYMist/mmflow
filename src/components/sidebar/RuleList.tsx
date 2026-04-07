import React from 'react';
import { FlowEdgeData, FlowNodeData } from '../../types/flow';

interface RuleListProps {
  edges: FlowEdgeData[];
  nodes: FlowNodeData[];
  onSelect: (id: string) => void;
}

export const RuleList: React.FC<RuleListProps> = ({ edges, nodes, onSelect }) => {
  const nodeMap = React.useMemo(
    () =>
      nodes.reduce<Record<string, FlowNodeData>>((accumulator, node) => {
        accumulator[node.id] = node;
        return accumulator;
      }, {}),
    [nodes],
  );

  return (
    <section className="sidebar-section">
      <div className="sidebar-section-header">
        <h3>규칙</h3>
      </div>
      <ul className="sidebar-list">
        {edges.map((edge) => {
          const fromNode = nodeMap[edge.fromNodeId];
          const toNode = nodeMap[edge.toNodeId];
          const ratio = fromNode?.amount
            ? (edge.amount || toNode?.amount || 0) / fromNode.amount
            : undefined;
          const ratioText =
            ratio != null && Number.isFinite(ratio)
              ? `${(ratio * 100).toFixed(2)}%`
              : undefined;

          return (
            <li key={edge.id}>
              <button
                type="button"
                className="sidebar-list-item"
                onClick={() => onSelect(edge.id)}
              >
                <span>
                  {fromNode?.itemName ?? '출발'} → {toNode?.itemName ?? '목적지'}
                </span>
                <span>{ratioText ?? '-'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
