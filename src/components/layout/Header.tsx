import React from 'react';
import { useFlowStoreV3, getMonthsWithData, getPreviousMonthWithData } from '../../store/flowStoreV3';

const MonthPicker: React.FC<{
  currentMonth: string;
  canvasId: string;
  onSelectMonth: (m: string) => void;
  onCopyFromPrevious: (target: string, source: string) => void;
}> = ({ currentMonth, canvasId, onSelectMonth, onCopyFromPrevious }) => {
  const [open, setOpen] = React.useState(false);
  const [pendingMonth, setPendingMonth] = React.useState<string | null>(null);
  const [previousMonth, setPreviousMonth] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  const monthsWithData = React.useMemo(() => new Set(getMonthsWithData(canvasId)), [canvasId, open]);
  const [viewYear, setViewYear] = React.useState(() => parseInt(currentMonth.slice(0, 4)));

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
    return { key: m, label: `${i + 1}월`, hasData: monthsWithData.has(m), isCurrent: m === currentMonth };
  });

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelectMonth = (m: string) => {
    if (m === currentMonth) { setOpen(false); return; }
    if (monthsWithData.has(m)) {
      onSelectMonth(m);
      setOpen(false);
      return;
    }
    const prev = getPreviousMonthWithData(canvasId, m);
    if (prev) {
      setPendingMonth(m);
      setPreviousMonth(prev);
    } else {
      onSelectMonth(m);
      setOpen(false);
    }
  };

  const handleCopy = () => {
    if (pendingMonth && previousMonth) onCopyFromPrevious(pendingMonth, previousMonth);
    setPendingMonth(null);
    setPreviousMonth(null);
    setOpen(false);
  };

  const handleSkip = () => {
    if (pendingMonth) onSelectMonth(pendingMonth);
    setPendingMonth(null);
    setPreviousMonth(null);
    setOpen(false);
  };

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-');
    return `${y}년 ${parseInt(mo)}월`;
  };

  return (
    <div className="month-picker" ref={ref}>
      <button type="button" className="month-picker-trigger" onClick={() => setOpen(!open)}>
        {formatMonth(currentMonth)}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="month-picker-dropdown">
          <div className="month-picker-header">
            <button type="button" className="month-picker-nav" onClick={() => setViewYear((y) => y - 1)}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7 1L3 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <span className="month-picker-year">{viewYear}</span>
            <button type="button" className="month-picker-nav" onClick={() => setViewYear((y) => y + 1)}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div className="month-picker-grid">
            {months.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`month-picker-cell ${m.isCurrent ? 'month-picker-cell-current' : ''} ${m.hasData ? 'month-picker-cell-has-data' : ''}`}
                onClick={() => handleSelectMonth(m.key)}
              >
                {m.label}
                {m.hasData && <span className="month-picker-dot" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {pendingMonth && previousMonth && (
        <div className="modal-overlay" onClick={handleSkip}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-message">
              <strong>{formatMonth(previousMonth)}</strong>의 데이터를 불러올까요?
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn modal-btn-secondary" onClick={handleSkip}>아니오</button>
              <button type="button" className="modal-btn modal-btn-primary" onClick={handleCopy}>예</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC = () => {
  const canvasMeta = useFlowStoreV3((s) => s.canvasMeta);
  const month = useFlowStoreV3((s) => s.month);
  const setMonth = useFlowStoreV3((s) => s.setMonth);
  const copyFromPreviousMonth = useFlowStoreV3((s) => s.copyFromPreviousMonth);
  const goToList = useFlowStoreV3((s) => s.goToList);
  const totalSourceAndSubAmount = useFlowStoreV3((s) => s.totalSourceAndSubAmount);
  const saveStatus = useFlowStoreV3((s) => s.saveStatus);
  const lastSavedAt = useFlowStoreV3((s) => s.lastSavedAt);
  const nodes = useFlowStoreV3((s) => s.nodes);

  if (!canvasMeta) return null;

  const total = totalSourceAndSubAmount();
  const destinationTotal = nodes
    .filter((n) => n.type === 'destination')
    .reduce((s, n) => s + (n.amount || 0), 0);

  const savedLabel = (() => {
    if (saveStatus === 'saving') return 'saving...';
    if (saveStatus === 'error') return 'error';
    if (lastSavedAt) return new Date(lastSavedAt).toLocaleTimeString('ko-KR');
    return '-';
  })();

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button type="button" className="header-back-btn" onClick={goToList} aria-label="캔버스 리스트로">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="app-title">{canvasMeta.name}</div>
        <MonthPicker
          currentMonth={month}
          canvasId={canvasMeta.id}
          onSelectMonth={setMonth}
          onCopyFromPrevious={copyFromPreviousMonth}
        />
      </div>
      <div className="app-header-right">
        <div className="header-stat">
          <span className="header-stat-label">출발+서브</span>
          <span className="header-stat-value header-stat-in">{total.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="header-stat">
          <span className="header-stat-label">도착</span>
          <span className="header-stat-value">{destinationTotal.toLocaleString('ko-KR')}원</span>
        </div>
        <span className="header-save-status">{savedLabel}</span>
      </div>
    </header>
  );
};
