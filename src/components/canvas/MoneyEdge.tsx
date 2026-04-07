import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

type MoneyEdgeData = {
  amount: number;
  ratio?: number;
  onChangeAmount?: (id: string, amount: number) => void;
  onDeleteEdge?: (id: string) => void;
};

export const MoneyEdge: React.FC<any> = ({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}) => {
  const edgeData = data as MoneyEdgeData | undefined;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<number>(edgeData?.amount ?? 0);

  React.useEffect(() => {
    setDraft(edgeData?.amount ?? 0);
  }, [edgeData?.amount]);

  const ratioText =
    edgeData?.ratio != null && Number.isFinite(edgeData.ratio)
      ? `${(edgeData.ratio * 100).toFixed(2)}%`
      : undefined;

  const handleCommit = () => {
    if (!edgeData?.onChangeAmount) {
      setIsEditing(false);
      return;
    }
    edgeData.onChangeAmount(id, Number.isFinite(draft) ? draft : 0);
    setIsEditing(false);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="edge-label edge-label-editable"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            zIndex: 1,
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {isEditing && selected ? (
            <input
              className="edge-label-input"
              type="number"
              value={Number.isNaN(draft) ? '' : draft}
              onChange={(event) => setDraft(Number(event.target.value) || 0)}
              onBlur={handleCommit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleCommit();
                }
                if (event.key === 'Escape') {
                  setIsEditing(false);
                  setDraft(edgeData?.amount ?? 0);
                }
              }}
              autoFocus
            />
          ) : (
            <>
              <button
                type="button"
                className="edge-label-amount"
                onClick={() => {
                  if (selected) {
                    setIsEditing(true);
                  }
                }}
              >
                {ratioText ?? '-'}
              </button>
              {selected ? (
                <button
                  type="button"
                  className="edge-label-delete"
                  onClick={() => edgeData?.onDeleteEdge?.(id)}
                  aria-label="연결선 삭제"
                >
                  ×
                </button>
              ) : null}
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
