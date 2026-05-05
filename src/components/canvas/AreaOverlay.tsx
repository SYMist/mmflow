import React from 'react';
import { useViewport } from '@xyflow/react';
import { useFlowStoreV3, AREA_SHARED_X_MIN, AREA_SHARED_X_MAX } from '../../store/flowStoreV3';

const AREA_HEIGHT = 2000;
const AREA_Y_OFFSET = -1000;
const SIDE_WIDTH = 1200;

export const AreaOverlay: React.FC = () => {
  const { x: tx, y: ty, zoom } = useViewport();
  const canvasMeta = useFlowStoreV3((s) => s.canvasMeta);

  if (!canvasMeta || canvasMeta.members.length < 2) return null;

  const left = canvasMeta.members[0];
  const right = canvasMeta.members[1];

  const areas = [
    {
      key: 'left',
      label: left.name,
      color: '#6366f1',
      x: AREA_SHARED_X_MIN - SIDE_WIDTH,
      width: SIDE_WIDTH,
    },
    {
      key: 'shared',
      label: '공유',
      color: '#a855f7',
      x: AREA_SHARED_X_MIN,
      width: AREA_SHARED_X_MAX - AREA_SHARED_X_MIN,
    },
    {
      key: 'right',
      label: right.name,
      color: '#0ea5e9',
      x: AREA_SHARED_X_MAX,
      width: SIDE_WIDTH,
    },
  ];

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
        {areas.map((a) => (
          <div
            key={a.key}
            style={{
              position: 'absolute',
              left: a.x,
              top: AREA_Y_OFFSET,
              width: a.width,
              height: AREA_HEIGHT,
              border: `1.5px dashed ${a.color}`,
              borderRadius: 16,
              background: `${a.color}0a`,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 12,
                fontSize: 12,
                fontWeight: 700,
                color: a.color,
                background: 'rgba(255, 255, 255, 0.85)',
                padding: '3px 10px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {a.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
