import React from 'react';
import { useFlowStoreV3, getMemberCountConstraint } from '../../store/flowStoreV3';
import {
  MemberType,
  CanvasGoal,
  CanvasMember,
  MEMBER_TYPE_LABELS,
  CANVAS_GOAL_LABELS,
} from '../../types/flow';

interface Props {
  onClose: () => void;
}

export const CanvasCreateModal: React.FC<Props> = ({ onClose }) => {
  const createCanvas = useFlowStoreV3((s) => s.createCanvas);
  const goToCanvas = useFlowStoreV3((s) => s.goToCanvas);

  const [name, setName] = React.useState('');
  const [memberType, setMemberType] = React.useState<MemberType>('family');
  const [memberCount, setMemberCount] = React.useState(1);
  const [memberNames, setMemberNames] = React.useState<string[]>(['']);
  const [goal, setGoal] = React.useState<CanvasGoal>('household');
  const [confirming, setConfirming] = React.useState(false);

  // Apply constraint when memberType changes
  React.useEffect(() => {
    const fixed = getMemberCountConstraint(memberType);
    if (fixed !== null) {
      setMemberCount(fixed);
    }
  }, [memberType]);

  // Resize memberNames array when memberCount changes
  React.useEffect(() => {
    setMemberNames((prev) => {
      const next = [...prev];
      while (next.length < memberCount) next.push('');
      return next.slice(0, memberCount);
    });
  }, [memberCount]);

  const fixedCount = getMemberCountConstraint(memberType);

  const canSubmit = (): boolean => {
    if (!name.trim()) return false;
    if (memberCount < 1) return false;
    if (memberNames.some((n) => !n.trim())) return false;
    return true;
  };

  const handleCreate = () => {
    const members: CanvasMember[] = memberNames.map((n) => ({
      id: crypto.randomUUID().slice(0, 8),
      name: n.trim(),
    }));
    const id = createCanvas({ name: name.trim(), memberType, members, goal });
    goToCanvas(id);
    onClose();
  };

  if (confirming) {
    return (
      <div className="modal-overlay" onClick={() => setConfirming(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">캔버스 생성 확인</h3>
          <p className="modal-message">
            <strong>구성원 정보는 생성 후 변경할 수 없습니다.</strong>
            <br />
            아래 내용으로 캔버스를 만드시겠습니까?
          </p>
          <div className="canvas-create-summary">
            <div><strong>이름:</strong> {name}</div>
            <div><strong>구성원:</strong> {MEMBER_TYPE_LABELS[memberType]} ({memberCount}명)</div>
            <div><strong>멤버:</strong> {memberNames.join(', ')}</div>
            <div><strong>목표:</strong> {CANVAS_GOAL_LABELS[goal]}</div>
          </div>
          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={() => setConfirming(false)}>
              뒤로
            </button>
            <button type="button" className="modal-btn modal-btn-primary" onClick={handleCreate}>
              생성
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">새 캔버스 만들기</h3>

        <div className="form-field">
          <label>캔버스 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 우리집 가계부"
            autoFocus
          />
        </div>

        <div className="form-field">
          <label>구성원 타입</label>
          <div className="form-radio-row">
            {(Object.keys(MEMBER_TYPE_LABELS) as MemberType[]).map((mt) => (
              <button
                key={mt}
                type="button"
                className={`form-chip ${memberType === mt ? 'form-chip-active' : ''}`}
                onClick={() => setMemberType(mt)}
              >
                {MEMBER_TYPE_LABELS[mt]}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label>구성원 수</label>
          <input
            type="number"
            min={1}
            max={10}
            value={memberCount}
            disabled={fixedCount !== null}
            onChange={(e) => setMemberCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
          />
          {fixedCount !== null && (
            <small className="form-hint">{MEMBER_TYPE_LABELS[memberType]}는 2명으로 고정됩니다</small>
          )}
        </div>

        <div className="form-field">
          <label>멤버 이름</label>
          {memberNames.map((mn, i) => (
            <input
              key={i}
              type="text"
              value={mn}
              onChange={(e) => {
                const next = [...memberNames];
                next[i] = e.target.value;
                setMemberNames(next);
              }}
              placeholder={`멤버 ${i + 1}`}
              className="form-input-spaced"
            />
          ))}
        </div>

        <div className="form-field">
          <label>목표</label>
          <select value={goal} onChange={(e) => setGoal(e.target.value as CanvasGoal)}>
            {(Object.keys(CANVAS_GOAL_LABELS) as CanvasGoal[]).map((g) => (
              <option key={g} value={g}>{CANVAS_GOAL_LABELS[g]}</option>
            ))}
          </select>
        </div>

        <div className="form-warning">
          ⚠ 구성원 정보(타입·수·이름)는 생성 후 변경할 수 없습니다.
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-primary"
            disabled={!canSubmit()}
            onClick={() => setConfirming(true)}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
};
