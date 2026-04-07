import React from 'react';

interface HeaderProps {
  month: string;
  scenarioName: string;
  onChangeMonth: (month: string) => void;
  onChangeScenario: (scenario: string) => void;
  totalIn: number;
  totalOut: number;
  lastSavedAt?: string | null;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
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
}) => {
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
          <div className="header-field">
            <input
              type="month"
              value={month}
              onChange={(event) => onChangeMonth(event.target.value)}
            />
          </div>
          <div className="header-field">
            <input
              type="text"
              value={scenarioName}
              onChange={(event) => onChangeScenario(event.target.value)}
              placeholder="시나리오 이름"
            />
          </div>
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
      </div>
    </header>
  );
};
