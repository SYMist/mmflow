import React from 'react';

interface EdgeLabelProps {
  amount: number;
  ratio?: number;
}

export const EdgeLabel: React.FC<EdgeLabelProps> = ({ amount, ratio }) => {
  const formattedAmount = amount.toLocaleString('ko-KR');
  const ratioText = ratio != null ? `${Math.round(ratio * 100)}%` : undefined;

  return (
    <span className="edge-label">
      ₩{formattedAmount}
      {ratioText ? ` · ${ratioText}` : null}
    </span>
  );
};

