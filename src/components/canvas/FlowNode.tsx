import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeType } from '../../types/flow';

type Direction = 'left' | 'right' | 'top' | 'bottom';

const NODE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#10b981', '#0ea5e9', '#64748b'];

type MoneyNodeData = {
  itemName: string;
  bankName: string;
  amount: number;
  type: NodeType;
  color: string;
  isEditing?: boolean;
  onAddNeighbor?: (direction: Direction) => void;
  onRename?: (name: string) => void;
  onChangeBankName?: (bankName: string) => void;
  onChangeAmount?: (amount: number) => void;
  onChangeColor?: (color: string) => void;
  onDelete?: () => void;
  onCommitEdit?: () => void;
  onCancelEdit?: () => void;
};

const TypeIcon: React.FC<{ type: NodeType }> = ({ type }) => {
  if (type === 'income') {
    return (
      <svg className="flow-node-type-icon flow-node-type-icon-income" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v10M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="flow-node-type-icon flow-node-type-icon-dest" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 12V2M4 9l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const FlowNode: React.FC<any> = ({ data, selected, dragging }) => {
  const node = data as MoneyNodeData;
  const isDragging = Boolean(selected && dragging);
  const isEditing = Boolean(node.isEditing);

  const [draftName, setDraftName] = React.useState(node.itemName);
  const [draftBank, setDraftBank] = React.useState(node.bankName);
  const [draftAmount, setDraftAmount] = React.useState(node.amount);

  React.useEffect(() => {
    if (isEditing) {
      setDraftName(node.itemName);
      setDraftBank(node.bankName);
      setDraftAmount(node.amount);
    }
  }, [isEditing, node.itemName, node.bankName, node.amount]);

  const handleCommit = (event: React.MouseEvent) => {
    event.stopPropagation();
    node.onRename?.(draftName);
    node.onChangeBankName?.(draftBank);
    node.onChangeAmount?.(draftAmount);
    node.onCommitEdit?.();
  };

  const handleCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    node.onCancelEdit?.();
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('이 노드와 연결된 규칙이 모두 삭제됩니다. 계속할까요?')) {
      node.onDelete?.();
    }
  };

  const handleAddClick = (direction: Direction, event: React.MouseEvent) => {
    event.stopPropagation();
    node.onAddNeighbor?.(direction);
  };

  const handles = (
    <>
      <Handle type="source" position={Position.Top} id="s-top" className="flow-node-add flow-node-add-top" onClick={(e) => handleAddClick('top', e)} />
      <Handle type="source" position={Position.Right} id="s-right" className="flow-node-add flow-node-add-right" onClick={(e) => handleAddClick('right', e)} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="flow-node-add flow-node-add-bottom" onClick={(e) => handleAddClick('bottom', e)} />
      <Handle type="source" position={Position.Left} id="s-left" className="flow-node-add flow-node-add-left" onClick={(e) => handleAddClick('left', e)} />
      <Handle type="target" position={Position.Top} id="t-top" className="flow-node-target flow-node-target-top" />
      <Handle type="target" position={Position.Right} id="t-right" className="flow-node-target flow-node-target-right" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="flow-node-target flow-node-target-bottom" />
      <Handle type="target" position={Position.Left} id="t-left" className="flow-node-target flow-node-target-left" />
    </>
  );

  if (isEditing) {
    return (
      <div
        className="flow-node flow-node-selected flow-node-editing"
        style={{ borderColor: node.color }}
        onClick={(e) => e.stopPropagation()}
      >
        {handles}
        <div className="flow-node-edit-actions">
          <button type="button" className="flow-node-action-btn flow-node-action-confirm" onClick={handleCommit} aria-label="확인">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button type="button" className="flow-node-action-btn flow-node-action-cancel" onClick={handleCancel} aria-label="취소">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button type="button" className="flow-node-action-btn flow-node-action-delete" onClick={handleDelete} aria-label="삭제">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3 3l.5 7a1 1 0 001 1h3a1 1 0 001-1L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <input
          className="flow-node-edit-input"
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="항목 명"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(e as any); if (e.key === 'Escape') handleCancel(e as any); }}
        />
        <input
          className="flow-node-edit-input flow-node-edit-input-sub"
          type="text"
          value={draftBank}
          onChange={(e) => setDraftBank(e.target.value)}
          placeholder="은행/기관"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(e as any); if (e.key === 'Escape') handleCancel(e as any); }}
        />
        <input
          className="flow-node-edit-input flow-node-edit-input-sub"
          type="number"
          value={draftAmount || ''}
          onChange={(e) => setDraftAmount(Number(e.target.value) || 0)}
          placeholder="금액"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(e as any); if (e.key === 'Escape') handleCancel(e as any); }}
        />
        <div className="flow-node-color-picker">
          {NODE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`flow-node-color-swatch ${c === node.color ? 'flow-node-color-swatch-active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={(e) => { e.stopPropagation(); node.onChangeColor?.(c); }}
              aria-label={`색상 ${c}`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flow-node ${selected ? 'flow-node-selected' : ''} flow-node-type-${node.type}`}
      style={{
        borderColor: node.color,
        opacity: isDragging ? 0.7 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {handles}
      <div className="flow-node-header">
        <TypeIcon type={node.type} />
        <span className="flow-node-name">{node.itemName}</span>
      </div>
      <div className="flow-node-type">
        {node.bankName || (node.type === 'income' ? '수입' : '목적지')}
      </div>
      <div className="flow-node-amount">
        {node.amount ? `${node.amount.toLocaleString('ko-KR')}원` : ''}
      </div>
    </div>
  );
};
