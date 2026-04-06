import React from 'react';
import { FlowEdgeData } from '../../types/flow';
import { EdgeLabel } from './EdgeLabel';

interface FlowEdgeProps {
  edge: FlowEdgeData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const FlowEdge: React.FC<FlowEdgeProps> = ({ edge, isSelected, onSelect }) => {
  return (
    <div
      className={`flow-edge ${isSelected ? 'flow-edge-selected' : ''}`}
      onClick={() => onSelect(edge.id)}
    >
      <div className="flow-edge-line" />
      <EdgeLabel amount={edge.amount} ratio={edge.ratio} />
    </div>
  );
};

