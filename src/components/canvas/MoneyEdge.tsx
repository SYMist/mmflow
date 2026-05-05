import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export const MoneyEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style,
}) => {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <BaseEdge
      path={path}
      style={{
        stroke: selected ? '#6366f1' : '#94a3b8',
        strokeWidth: selected ? 2.5 : 1.5,
        ...style,
      }}
    />
  );
};
