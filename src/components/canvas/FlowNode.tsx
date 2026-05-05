import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeType } from '../../types/flow';

const NODE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#10b981', '#0ea5e9', '#64748b'];

type MoneyNodeData = {
  type: NodeType;
  name: string;
  account: string;
  amount: number;
  color?: string;
  isEditing?: boolean;
  hasWarning?: boolean;
  isInGroup?: boolean;
  hasSubAttached?: boolean;
  onRename?: (v: string) => void;
  onChangeAccount?: (v: string) => void;
  onChangeAmount?: (v: number) => void;
  onChangeColor?: (v: string) => void;
  onDelete?: () => void;
  onCommitEdit?: () => void;
  onCancelEdit?: () => void;
  onAddSub?: () => void;
};

const TypeIcon: React.FC<{ type: NodeType }> = ({ type }) => {
  if (type === 'source') {
    return (
      <svg className="flow-node-type-icon flow-node-type-icon-source" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v10M4 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'destination') {
    return (
      <svg className="flow-node-type-icon flow-node-type-icon-dest" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 12V2M4 9l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // sub
  return (
    <svg className="flow-node-type-icon flow-node-type-icon-sub" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 4v4M4 6h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

export const FlowNode: React.FC<any> = ({ data, selected, dragging }) => {
  const node = data as MoneyNodeData;
  const isDragging = Boolean(selected && dragging);
  const isEditing = Boolean(node.isEditing);
  const isSub = node.type === 'sub';

  const [draftName, setDraftName] = React.useState(node.name);
  const [draftAccount, setDraftAccount] = React.useState(node.account);
  const [draftAmount, setDraftAmount] = React.useState(node.amount);

  React.useEffect(() => {
    if (isEditing) {
      setDraftName(node.name);
      setDraftAccount(node.account);
      setDraftAmount(node.amount);
    }
  }, [isEditing, node.name, node.account, node.amount]);

  const handleCommit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    node.onRename?.(draftName);
    node.onChangeAccount?.(draftAccount);
    node.onChangeAmount?.(draftAmount);
    node.onCommitEdit?.();
  };

  const handleCancel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    node.onCancelEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 노드와 연결된 규칙이 모두 삭제됩니다. 계속할까요?')) {
      node.onDelete?.();
    }
  };

  const handles = (
    <>
      {/* Source/sub: outgoing handles */}
      {(node.type === 'source' || node.type === 'sub') && (
        <>
          <Handle type="source" position={Position.Right} id="s-right" className="flow-node-handle flow-node-handle-right" />
          <Handle type="source" position={Position.Bottom} id="s-bottom" className="flow-node-handle flow-node-handle-bottom" />
        </>
      )}
      {/* Destination: incoming handles */}
      {node.type === 'destination' && (
        <>
          <Handle type="target" position={Position.Left} id="t-left" className="flow-node-handle flow-node-handle-left" />
          <Handle type="target" position={Position.Top} id="t-top" className="flow-node-handle flow-node-handle-top" />
        </>
      )}
    </>
  );

  if (isEditing) {
    return (
      <div
        className={`flow-node flow-node-selected flow-node-editing ${isSub ? 'flow-node-sub' : ''}`}
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
          placeholder="이름"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(e); if (e.key === 'Escape') handleCancel(e); }}
        />
        <input
          className="flow-node-edit-input flow-node-edit-input-sub"
          type="text"
          value={draftAccount}
          onChange={(e) => setDraftAccount(e.target.value)}
          placeholder="계좌"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(e); if (e.key === 'Escape') handleCancel(e); }}
        />
        <input
          className="flow-node-edit-input flow-node-edit-input-sub"
          type="number"
          value={draftAmount || ''}
          onChange={(e) => setDraftAmount(Number(e.target.value) || 0)}
          placeholder="금액"
          onKeyDown={(e) => { if (e.key === 'Enter') handleCommit(e); if (e.key === 'Escape') handleCancel(e); }}
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
      className={`flow-node flow-node-type-${node.type} ${selected ? 'flow-node-selected' : ''} ${node.hasWarning ? 'flow-node-warning' : ''} ${isSub ? 'flow-node-sub' : ''}`}
      style={{
        borderColor: node.hasWarning ? undefined : node.color,
        opacity: isDragging ? 0.7 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      title={node.hasWarning ? '분배 금액이 출발 금액을 초과합니다' : undefined}
    >
      {handles}
      {node.hasWarning && (
        <div className="flow-node-warning-badge" aria-label="경고">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1.5L9 8.5H1L5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M5 4v2M5 7v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      )}
      <div className="flow-node-header">
        <TypeIcon type={node.type} />
        <span className="flow-node-name">{node.name || (node.type === 'source' ? '출발' : node.type === 'destination' ? '도착' : '서브')}</span>
      </div>
      {node.account && <div className="flow-node-account">{node.account}</div>}
      <div className="flow-node-amount">
        {node.amount ? `${node.amount.toLocaleString('ko-KR')}원` : ''}
      </div>
    </div>
  );
};
