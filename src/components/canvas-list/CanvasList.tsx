import React from 'react';
import { useFlowStoreV3 } from '../../store/flowStoreV3';
import { CANVAS_GOAL_LABELS, MEMBER_TYPE_LABELS } from '../../types/flow';
import { CanvasCreateModal } from './CanvasCreateModal';

export const CanvasList: React.FC = () => {
  const canvases = useFlowStoreV3((s) => s.canvases);
  const goToCanvas = useFlowStoreV3((s) => s.goToCanvas);
  const deleteCanvas = useFlowStoreV3((s) => s.deleteCanvas);
  const renameCanvas = useFlowStoreV3((s) => s.renameCanvas);
  const refreshCanvases = useFlowStoreV3((s) => s.refreshCanvases);

  const [showCreate, setShowCreate] = React.useState(false);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');

  React.useEffect(() => {
    refreshCanvases();
  }, [refreshCanvases]);

  // Load full meta for each canvas card
  const cards = canvases.map((c) => {
    try {
      const raw = localStorage.getItem(`mfv3:canvas:${c.id}:meta`);
      const meta = raw ? JSON.parse(raw) : null;
      return { ...c, meta };
    } catch {
      return { ...c, meta: null };
    }
  });

  return (
    <div className="canvas-list-page">
      <header className="canvas-list-header">
        <h1>Money Flow</h1>
        <button type="button" className="primary-btn" onClick={() => setShowCreate(true)}>
          + 새 캔버스
        </button>
      </header>

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" opacity="0.3" />
                <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="empty-state-title">첫 캔버스를 만들어보세요</h2>
            <p className="empty-state-desc">
              가구 경제, 데이트 통장, 여행 자금 등 자금 흐름을 설계할 캔버스를 만드세요.
            </p>
            <div className="empty-state-actions">
              <button type="button" className="empty-state-btn empty-state-btn-income" onClick={() => setShowCreate(true)}>
                + 캔버스 만들기
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="canvas-grid">
          {cards.map((c) => (
            <div key={c.id} className="canvas-card">
              <button type="button" className="canvas-card-body" onClick={() => goToCanvas(c.id)}>
                {renamingId === c.id ? (
                  <input
                    className="canvas-card-name-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => {
                      if (renameValue.trim()) renameCanvas(c.id, renameValue.trim());
                      setRenamingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (renameValue.trim()) renameCanvas(c.id, renameValue.trim());
                        setRenamingId(null);
                      }
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <h3 className="canvas-card-name">{c.name}</h3>
                )}
                {c.meta && (
                  <div className="canvas-card-meta">
                    <span className="canvas-card-tag">{MEMBER_TYPE_LABELS[c.meta.memberType as keyof typeof MEMBER_TYPE_LABELS]}</span>
                    <span className="canvas-card-tag">{c.meta.members?.length ?? 0}명</span>
                    <span className="canvas-card-goal">{CANVAS_GOAL_LABELS[c.meta.goal as keyof typeof CANVAS_GOAL_LABELS]}</span>
                  </div>
                )}
              </button>
              <div className="canvas-card-actions">
                <button
                  type="button"
                  className="canvas-card-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(c.id);
                    setRenameValue(c.name);
                  }}
                  title="이름 수정"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 10h2l5-5-2-2-5 5v2zM7 3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="canvas-card-action-btn canvas-card-action-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`"${c.name}" 캔버스를 삭제할까요? 모든 월별 데이터가 함께 삭제됩니다.`)) {
                      deleteCanvas(c.id);
                    }
                  }}
                  title="삭제"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 3h8M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M3 3l.5 7a1 1 0 001 1h3a1 1 0 001-1L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CanvasCreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};
