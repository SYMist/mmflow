import React from 'react';
import { FlowEdgeData, FlowNodeData } from '../../types/flow';

interface DetailPanelProps {
  selectedNode?: FlowNodeData;
  selectedEdge?: FlowEdgeData;
  onRenameNode: (id: string, name: string) => void;
  onChangeBankName: (id: string, bankName: string) => void;
  onChangeNodeAmount: (id: string, amount: number) => void;
  onDeleteNode: (id: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedNode,
  selectedEdge,
  onRenameNode,
  onChangeBankName,
  onChangeNodeAmount,
  onDeleteNode,
}) => {
  const [draftItemName, setDraftItemName] = React.useState<string>('');
  const [draftBankName, setDraftBankName] = React.useState<string>('');
  const [draftAmount, setDraftAmount] = React.useState<number>(0);

  React.useEffect(() => {
    if (selectedNode) {
      setDraftItemName(selectedNode.itemName);
      setDraftBankName(selectedNode.bankName);
      setDraftAmount(selectedNode.amount);
    }
  }, [selectedNode]);

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="detail-panel">
        <h3>상세 정보</h3>
        <p>왼쪽 리스트나 플로우캔버스에서 항목을 선택하세요.</p>
      </aside>
    );
  }

  if (selectedNode) {
    return (
      <aside className="detail-panel">
        <h3>노드 상세</h3>
        <label>
          <div>항목 명</div>
          <input
            type="text"
            value={draftItemName}
            onChange={(event) => setDraftItemName(event.target.value)}
          />
        </label>
        <label>
          <div>은행 이름</div>
          <input
            type="text"
            value={draftBankName}
            onChange={(event) => setDraftBankName(event.target.value)}
          />
        </label>
        <label>
          <div>금액</div>
          <input
            type="number"
            value={Number.isNaN(draftAmount) ? '' : draftAmount}
            onChange={(event) => {
              const next = Number(event.target.value);
              setDraftAmount(Number.isNaN(next) ? 0 : next);
            }}
          />
        </label>
        <div>유형: {selectedNode.type === 'income' ? '수입' : '목적지'}</div>
        <button
          type="button"
          onClick={() => {
            onRenameNode(selectedNode.id, draftItemName);
            onChangeBankName(selectedNode.id, draftBankName);
            onChangeNodeAmount(selectedNode.id, draftAmount);
          }}
        >
          확인
        </button>
        <button
          type="button"
          onClick={() => {
            // 간단 보호: 사용자가 실수로 누를 수 있으니 확인 한번
            if (window.confirm('이 노드와 연결된 규칙이 모두 삭제됩니다. 계속할까요?')) {
              onDeleteNode(selectedNode.id);
            }
          }}
        >
          노드 삭제
        </button>
      </aside>
    );
  }

  if (selectedEdge) {
    const ratioText =
      selectedEdge.ratio != null ? `${Math.round(selectedEdge.ratio * 100)}%` : undefined;

    return (
      <aside className="detail-panel">
        <h3>규칙 상세</h3>
        <div>금액: {selectedEdge.amount.toLocaleString('ko-KR')}원</div>
        <div>비중: {ratioText ?? '-'}</div>
      </aside>
    );
  }

  return null;
};
