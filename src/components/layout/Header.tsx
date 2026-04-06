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
    if (saveStatus === 'saving') {
      return '저장 중...';
    }
    if (saveStatus === 'error') {
      return '저장 실패';
    }
    if (lastSavedAt) {
      return `저장됨: ${new Date(lastSavedAt).toLocaleTimeString('ko-KR')}`;
    }
    return '저장됨: -';
  })();

  return (
    <header className="app-header">
      <div className="app-header-left">
        <div className="app-title">Money Flow Planner</div>
        <label>
          월 선택
          <input
            type="month"
            value={month}
            onChange={(event) => onChangeMonth(event.target.value)}
          />
        </label>
        <label>
          시나리오
          <input
            type="text"
            value={scenarioName}
            onChange={(event) => onChangeScenario(event.target.value)}
          />
        </label>
      </div>
      <div className="app-header-right">
        <div>이번 달 들어오는 돈: {totalIn.toLocaleString('ko-KR')}원</div>
        <div>이체 합계: {totalOut.toLocaleString('ko-KR')}원</div>
        <div>남는 돈: {remaining.toLocaleString('ko-KR')}원</div>
        <div>{savedLabel}</div>
      </div>
    </header>
  );
};
