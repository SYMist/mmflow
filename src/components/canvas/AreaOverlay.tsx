import React from 'react';
import { useViewport } from '@xyflow/react';
import { useFlowStoreV3, getAreaBounds } from '../../store/flowStoreV3';

const AREA_HEIGHT = 100000;
const AREA_Y_OFFSET = -50000;
const SIDE_WIDTH = 50000;
const HANDLE_THICKNESS = 8;
const MIN_SHARED_WIDTH = 80;

export const AreaOverlay: React.FC = () => {
  const { x: tx, y: ty, zoom } = useViewport();
  const canvasMeta = useFlowStoreV3((s) => s.canvasMeta);
  const setAreaBounds = useFlowStoreV3((s) => s.setAreaBounds);

  if (!canvasMeta || canvasMeta.members.length < 2) return null;

  const left = canvasMeta.members[0];
  const right = canvasMeta.members[1];
  const { sharedXMin, sharedXMax } = getAreaBounds(canvasMeta);

  const areas = [
    { key: 'left', label: left.name, color: '#6366f1', x: sharedXMin - SIDE_WIDTH, width: SIDE_WIDTH },
    { key: 'shared', label: '공유', color: '#a855f7', x: sharedXMin, width: sharedXMax - sharedXMin },
    { key: 'right', label: right.name, color: '#0ea5e9', x: sharedXMax, width: SIDE_WIDTH },
  ];

  const labelTops = areas.map((a) => {
    const centerX = a.x + a.width / 2;
    const screenX = centerX * zoom + tx;
    return { ...a, screenX };
  });

  const startResize = (edge: 'minX' | 'maxX', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startScreenX = e.clientX;
    const startMin = sharedXMin;
    const startMax = sharedXMax;

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startScreenX) / zoom;
      if (edge === 'minX') {
        const next = Math.min(startMax - MIN_SHARED_WIDTH, startMin + dx);
        setAreaBounds(next, startMax);
      } else {
        const next = Math.max(startMin + MIN_SHARED_WIDTH, startMax + dx);
        setAreaBounds(startMin, next);
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <>
      {/* Backgrounds (transformed) */}
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
                borderLeft: `1.5px dashed ${a.color}`,
                borderRight: `1.5px dashed ${a.color}`,
                background: `${a.color}0a`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Resize handles (screen-space, follow boundary positions) */}
      <div
        className="nodrag nopan"
        onMouseDown={(e) => startResize('minX', e)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        title="좌측 경계 조정"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: sharedXMin * zoom + tx - HANDLE_THICKNESS / 2,
          width: HANDLE_THICKNESS,
          cursor: 'ew-resize',
          zIndex: 11,
          pointerEvents: 'auto',
          background: 'rgba(168, 85, 247, 0.15)',
        }}
      />
      <div
        className="nodrag nopan"
        onMouseDown={(e) => startResize('maxX', e)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        title="우측 경계 조정"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: sharedXMax * zoom + tx - HANDLE_THICKNESS / 2,
          width: HANDLE_THICKNESS,
          cursor: 'ew-resize',
          zIndex: 11,
          pointerEvents: 'auto',
          background: 'rgba(168, 85, 247, 0.15)',
        }}
      />

      {/* Floating labels */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 0,
          right: 0,
          height: 0,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        {labelTops.map((a) => (
          <div
            key={a.key}
            style={{
              position: 'absolute',
              left: a.screenX,
              transform: 'translateX(-50%)',
              fontSize: 12,
              fontWeight: 700,
              color: a.color,
              background: 'rgba(255, 255, 255, 0.92)',
              padding: '4px 12px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              border: `1px solid ${a.color}33`,
            }}
          >
            {a.label}
          </div>
        ))}
      </div>
    </>
  );
};
