import React from 'react';
import { useFlowStore, getMonthsWithData, getPreviousMonthWithData, type ScenarioMeta } from '../../store/flowStore';

/* ── Month Picker ── */
const MonthPicker: React.FC<{
  currentMonth: string;
  scenarioId: string;
  onSelectMonth: (month: string) => void;
  onCopyFromPrevious: (targetMonth: string, sourceMonth: string) => void;
}> = ({ currentMonth, scenarioId, onSelectMonth, onCopyFromPrevious }) => {
  const [open, setOpen] = React.useState(false);
  const [pendingMonth, setPendingMonth] = React.useState<string | null>(null);
  const [previousMonth, setPreviousMonth] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  const monthsWithData = React.useMemo(() => new Set(getMonthsWithData(scenarioId)), [scenarioId, open]);

  // Parse current month to get year for display
  const [viewYear, setViewYear] = React.useState(() => parseInt(currentMonth.slice(0, 4)));

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
    return { key: m, label: `${i + 1}월`, hasData: monthsWithData.has(m), isCurrent: m === currentMonth };
  });

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelectMonth = (month: string) => {
    if (month === currentMonth) { setOpen(false); return; }

    if (monthsWithData.has(month)) {
      onSelectMonth(month);
      setOpen(false);
      return;
    }

    // Empty month — check for previous
    const prev = getPreviousMonthWithData(scenarioId, month);
    if (prev) {
      setPendingMonth(month);
      setPreviousMonth(prev);
    } else {
      onSelectMonth(month);
      setOpen(false);
    }
  };

  const handleCopy = () => {
    if (pendingMonth && previousMonth) {
      onCopyFromPrevious(pendingMonth, previousMonth);
    }
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

      {/* Copy from previous month modal */}
      {pendingMonth && previousMonth && (
        <div className="modal-overlay" onClick={handleSkip}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-message">
              <strong>{formatMonth(previousMonth)}</strong>의 데이터를 불러올까요?
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn modal-btn-secondary" onClick={handleSkip}>
                아니오
              </button>
              <button type="button" className="modal-btn modal-btn-primary" onClick={handleCopy}>
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Scenario Switcher ── */
const ScenarioSwitcher: React.FC<{
  currentId: string;
  currentName: string;
  onChangeName: (name: string) => void;
  onCreate: (name: string) => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  getScenarios: () => ScenarioMeta[];
}> = ({ currentId, currentName, onChangeName, onCreate, onSwitch, onDelete, getScenarios }) => {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const scenarios = React.useMemo(() => getScenarios(), [open, getScenarios]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setEditing(false); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="scenario-switcher" ref={ref}>
      {editing ? (
        <input
          className="scenario-name-input"
          type="text"
          value={currentName}
          onChange={(e) => onChangeName(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false); }}
          autoFocus
        />
      ) : (
        <button type="button" className="scenario-trigger" onClick={() => setOpen(!open)} onDoubleClick={() => { setOpen(false); setEditing(true); }}>
          {currentName}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {open && (
        <div className="scenario-dropdown">
          {scenarios.map((s) => (
            <div key={s.id} className={`scenario-item ${s.id === currentId ? 'scenario-item-current' : ''}`}>
              <button type="button" className="scenario-item-name" onClick={() => { onSwitch(s.id); setOpen(false); }}>
                {s.name}
              </button>
              {scenarios.length > 1 && (
                <button
                  type="button"
                  className="scenario-item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`"${s.name}" 시나리오를 삭제할까요?`)) {
                      onDelete(s.id);
                    }
                  }}
                  aria-label="삭제"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="scenario-add-btn"
            onClick={() => {
              const name = window.prompt('새 시나리오 이름');
              if (name?.trim()) { onCreate(name.trim()); setOpen(false); }
            }}
          >
            + 새 시나리오
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Header ── */
interface HeaderProps {
  month: string;
  scenarioName: string;
  onChangeMonth: (month: string) => void;
  onChangeScenario: (scenario: string) => void;
  totalIn: number;
  totalOut: number;
  lastSavedAt?: string | null;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onExport?: () => void;
  onImport?: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  month,
  scenarioName,
  onChangeMonth,
  onChangeScenario,
  totalIn,
  totalOut,
  lastSavedAt,
  saveStatus = 'idle',
  onExport,
  onImport,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const store = useFlowStore();

  const remaining = totalIn - totalOut;
  const savedLabel = (() => {
    if (saveStatus === 'saving') return 'saving...';
    if (saveStatus === 'error') return 'error';
    if (lastSavedAt) return new Date(lastSavedAt).toLocaleTimeString('ko-KR');
    return '-';
  })();

  return (
    <header className="app-header">
      <div className="app-header-left">
        <div className="app-title">Money Flow</div>
        <div className="header-controls">
          <ScenarioSwitcher
            currentId={store.scenarioId}
            currentName={scenarioName}
            onChangeName={onChangeScenario}
            onCreate={store.createScenario}
            onSwitch={store.switchScenario}
            onDelete={store.deleteScenario}
            getScenarios={store.getScenarios}
          />
          <MonthPicker
            currentMonth={month}
            scenarioId={store.scenarioId}
            onSelectMonth={onChangeMonth}
            onCopyFromPrevious={store.copyFromPreviousMonth}
          />
        </div>
      </div>
      <div className="app-header-right">
        <div className="header-stat">
          <span className="header-stat-label">수입</span>
          <span className="header-stat-value header-stat-in">{totalIn.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="header-stat">
          <span className="header-stat-label">이체</span>
          <span className="header-stat-value header-stat-out">{totalOut.toLocaleString('ko-KR')}원</span>
        </div>
        <div className="header-stat">
          <span className="header-stat-label">잔액</span>
          <span className={`header-stat-value ${remaining >= 0 ? 'header-stat-positive' : 'header-stat-negative'}`}>
            {remaining.toLocaleString('ko-KR')}원
          </span>
        </div>
        <span className="header-save-status">{savedLabel}</span>
        <div className="header-io-buttons">
          <button type="button" className="header-io-btn" onClick={onExport} title="백업 내보내기">
            ↓
          </button>
          <button
            type="button"
            className="header-io-btn"
            onClick={() => fileInputRef.current?.click()}
            title="백업 가져오기"
          >
            ↑
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onImport) onImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </header>
  );
};
