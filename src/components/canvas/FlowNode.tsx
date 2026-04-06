import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeType } from '../../types/flow';

type Direction = 'left' | 'right' | 'top' | 'bottom';

type MoneyNodeData = {
  itemName: string;
  bankName: string;
  amount: number;
  type: NodeType;
  color: string;
  onAddNeighbor?: (direction: Direction) => void;
};

export const FlowNode: React.FC<any> = ({ data, selected, dragging }) => {
  const node = data as MoneyNodeData;
  const isDragging = Boolean(selected && dragging);

  const handleClick = (direction: Direction, event: React.MouseEvent) => {
    event.stopPropagation();
    node.onAddNeighbor?.(direction);
  };

  return (
    <div
      className={`flow-node ${selected ? 'flow-node-selected' : ''}`}
      style={{
        borderColor: node.color,
        opacity: isDragging ? 0.7 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <Handle
        type="source"
        position={Position.Top}
        id="s-top"
        className="flow-node-add flow-node-add-top"
        onClick={(event) => handleClick('top', event)}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="s-right"
        className="flow-node-add flow-node-add-right"
        onClick={(event) => handleClick('right', event)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="s-bottom"
        className="flow-node-add flow-node-add-bottom"
        onClick={(event) => handleClick('bottom', event)}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="s-left"
        className="flow-node-add flow-node-add-left"
        onClick={(event) => handleClick('left', event)}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="t-top"
        className="flow-node-target flow-node-target-top"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="t-right"
        className="flow-node-target flow-node-target-right"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="t-bottom"
        className="flow-node-target flow-node-target-bottom"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="t-left"
        className="flow-node-target flow-node-target-left"
      />
      <div className="flow-node-name">{node.itemName}</div>
      <div className="flow-node-type">
        {node.bankName || (node.type === 'income' ? '수입' : '목적지')}
      </div>
      <div className="flow-node-amount">
        {node.amount ? `${node.amount.toLocaleString('ko-KR')}원` : ''}
      </div>
    </div>
  );
};
