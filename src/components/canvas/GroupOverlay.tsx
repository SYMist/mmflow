import React from 'react';
import { useViewport } from '@xyflow/react';
import { useFlowStoreV3 } from '../../store/flowStoreV3';

const NODE_W = 160;
const NODE_H = 80;
const PADDING = 14;
const HEADER_H = 22;

export const GroupOverlay: React.FC = () => {
  const { x: tx, y: ty, zoom } = useViewport();
  const groups = useFlowStoreV3((s) => s.groups);
  const nodes = useFlowStoreV3((s) => s.nodes);
  const groupTotal = useFlowStoreV3((s) => s.groupTotal);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {groups.map((group) => {
          const members = group.nodeIds
            .map((nid) => nodes.find((n) => n.id === nid))
            .filter((n): n is NonNullable<typeof n> => Boolean(n));
          if (members.length < 2) return null;

          const xs = members.map((n) => n.x ?? 0);
          const ys = members.map((n) => n.y ?? 0);
          const minX = Math.min(...xs) - PADDING;
          const minY = Math.min(...ys) - PADDING - HEADER_H;
          const maxX = Math.max(...xs) + NODE_W + PADDING;
          const maxY = Math.max(...ys) + NODE_H + PADDING;
          const total = groupTotal(group.id);

          return (
            <div
              key={group.id}
              style={{
                position: 'absolute',
                left: minX,
                top: minY,
                width: maxX - minX,
                height: maxY - minY,
                border: '1.5px dashed #a855f7',
                borderRadius: 12,
                background: 'rgba(168, 85, 247, 0.04)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#a855f7',
                  background: 'rgba(255,255,255,0.85)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                {members[0].name} {members[0].account ? `· ${members[0].account}` : ''}
                <span style={{ marginLeft: 8, color: '#6b7280' }}>
                  {total.toLocaleString('ko-KR')}원
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
