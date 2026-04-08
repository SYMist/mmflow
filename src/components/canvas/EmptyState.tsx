import React from 'react';

interface EmptyStateProps {
  onAddIncome: () => void;
  onAddDestination: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddIncome, onAddDestination }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <div className="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" opacity="0.3" />
            <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="empty-state-title">머니 플로우를 시작하세요</h2>
        <p className="empty-state-desc">
          수입과 목적지 노드를 추가하고, 연결선으로 돈의 흐름을 설계해보세요.
        </p>
        <div className="empty-state-actions">
          <button type="button" className="empty-state-btn empty-state-btn-income" onClick={onAddIncome}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            수입 추가
          </button>
          <button type="button" className="empty-state-btn empty-state-btn-dest" onClick={onAddDestination}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            목적지 추가
          </button>
        </div>
        <p className="empty-state-hint">
          캔버스에서 우클릭하여 노드를 추가할 수도 있습니다
        </p>
      </div>
    </div>
  );
};
