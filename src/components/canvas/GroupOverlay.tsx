import React from 'react';
import { useViewport } from '@xyflow/react';
import { useFlowStoreV3 } from '../../store/flowStoreV3';

const NODE_W = 160;
const NODE_H = 80;
const PADDING = 14;
const HEADER_H = 22;
const HANDLE_THICKNESS = 12;

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

const computeAutoBounds = (
  members: { x?: number; y?: number }[],
): Bounds | null => {
  if (members.length === 0) return null;
  const xs = members.map((n) => n.x ?? 0);
  const ys = members.map((n) => n.y ?? 0);
  return {
    minX: Math.min(...xs) - PADDING,
    minY: Math.min(...ys) - PADDING - HEADER_H,
    maxX: Math.max(...xs) + NODE_W + PADDING,
    maxY: Math.max(...ys) + NODE_H + PADDING,
  };
};

interface GroupBoxProps {
  bounds: Bounds;
  label: string;
  totalText: string;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onResize: (bounds: Bounds) => void;
  onMove: (dx: number, dy: number) => void;
}

const GroupBox: React.FC<GroupBoxProps> = ({
  bounds, label, totalText, zoom, isSelected, onSelect, onResize, onMove,
}) => {
  const { minX, minY, maxX, maxY } = bounds;
  const width = maxX - minX;
  const height = maxY - minY;

  const startResize = (
    edge: 'left' | 'right' | 'top' | 'bottom',
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { ...bounds };

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      const next = { ...start };
      if (edge === 'left') next.minX = Math.min(start.maxX - 60, start.minX + dx);
      if (edge === 'right') next.maxX = Math.max(start.minX + 60, start.maxX + dx);
      if (edge === 'top') next.minY = Math.min(start.maxY - 60, start.minY + dy);
      if (edge === 'bottom') next.maxY = Math.max(start.minY + 60, start.maxY + dy);
      onResize(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const accent = '#a855f7';

  return (
    <div
      style={{
        position: 'absolute',
        left: minX,
        top: minY,
        width,
        height,
        border: `${isSelected ? 2.5 : 1.5}px dashed ${accent}`,
        borderRadius: 12,
        background: isSelected ? 'rgba(168, 85, 247, 0.10)' : 'rgba(168, 85, 247, 0.03)',
        boxShadow: isSelected ? `0 0 0 4px ${accent}33, 0 4px 12px rgba(168, 85, 247, 0.18)` : 'none',
        pointerEvents: 'none',
      }}
    >
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: '50%',
            transform: 'translateX(-50%)',
            background: accent,
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          그룹 선택됨 · 라벨 드래그로 이동 · 모서리 드래그로 크기 조정
        </div>
      )}
      {/* Label — click to select; drag (when selected) to move group */}
      <div
        className="nodrag nopan"
        onPointerDown={(e) => { e.stopPropagation(); }}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (!isSelected) return; // first mouseup will fire onClick → onSelect
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          let lastX = startX;
          let lastY = startY;
          let moved = false;
          const handleMove = (ev: MouseEvent) => {
            if (!moved) {
              if (Math.abs(ev.clientX - startX) < 3 && Math.abs(ev.clientY - startY) < 3) return;
              moved = true;
            }
            const dx = (ev.clientX - lastX) / zoom;
            const dy = (ev.clientY - lastY) / zoom;
            onMove(dx, dy);
            lastX = ev.clientX;
            lastY = ev.clientY;
          };
          const onUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', onUp);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isSelected) onSelect();
        }}
        style={{
          position: 'absolute',
          top: 4,
          left: 8,
          fontSize: 11,
          fontWeight: 600,
          color: isSelected ? '#ffffff' : accent,
          background: isSelected ? accent : 'rgba(255,255,255,0.9)',
          padding: '4px 10px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          pointerEvents: 'auto',
          cursor: isSelected ? 'move' : 'pointer',
          userSelect: 'none',
          boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.15)' : '0 1px 2px rgba(0,0,0,0.08)',
          border: isSelected ? 'none' : `1px solid ${accent}55`,
        }}
      >
        {label}
        <span style={{ marginLeft: 8, color: isSelected ? 'rgba(255,255,255,0.85)' : '#6b7280' }}>
          {totalText}
        </span>
      </div>

      {/* Resize handles — only when selected */}
      {isSelected && (
        <>
          <div
            className="nodrag nopan"
            onMouseDown={(e) => startResize('left', e)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: -HANDLE_THICKNESS / 2,
              top: 0,
              width: HANDLE_THICKNESS,
              height: '100%',
              cursor: 'ew-resize',
              pointerEvents: 'auto',
              background: `${accent}55`,
            }}
          />
          <div
            className="nodrag nopan"
            onMouseDown={(e) => startResize('right', e)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              right: -HANDLE_THICKNESS / 2,
              top: 0,
              width: HANDLE_THICKNESS,
              height: '100%',
              cursor: 'ew-resize',
              pointerEvents: 'auto',
              background: `${accent}55`,
            }}
          />
          <div
            className="nodrag nopan"
            onMouseDown={(e) => startResize('top', e)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: -HANDLE_THICKNESS / 2,
              left: 0,
              width: '100%',
              height: HANDLE_THICKNESS,
              cursor: 'ns-resize',
              pointerEvents: 'auto',
              background: `${accent}55`,
            }}
          />
          <div
            className="nodrag nopan"
            onMouseDown={(e) => startResize('bottom', e)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: -HANDLE_THICKNESS / 2,
              left: 0,
              width: '100%',
              height: HANDLE_THICKNESS,
              cursor: 'ns-resize',
              pointerEvents: 'auto',
              background: `${accent}55`,
            }}
          />
        </>
      )}
    </div>
  );
};

export const GroupOverlay: React.FC = () => {
  const { x: tx, y: ty, zoom } = useViewport();
  const groups = useFlowStoreV3((s) => s.groups);
  const nodes = useFlowStoreV3((s) => s.nodes);
  const groupTotal = useFlowStoreV3((s) => s.groupTotal);
  const setGroupBounds = useFlowStoreV3((s) => s.setGroupBounds);
  const moveGroup = useFlowStoreV3((s) => s.moveGroup);
  const selectGroup = useFlowStoreV3((s) => s.selectGroup);
  const selection = useFlowStoreV3((s) => s.selection);
  const selectedGroupId = selection?.type === 'group' ? selection.id : undefined;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        // Must be above .react-flow__pane (z=1) and renderer (z=4) so labels/handles are clickable.
        // Body has pointer-events: none so nodes (renderer z=4) remain clickable.
        zIndex: 10,
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

          const bounds = group.bounds ?? computeAutoBounds(members);
          if (!bounds) return null;

          const total = groupTotal(group.id);
          const label = `${members[0].name}${members[0].account ? ` · ${members[0].account}` : ''}`;
          const isSelected = selectedGroupId === group.id;
          return (
            <GroupBox
              key={group.id}
              bounds={bounds}
              label={label}
              totalText={`${total.toLocaleString('ko-KR')}원`}
              zoom={zoom}
              isSelected={isSelected}
              onSelect={() => selectGroup(group.id)}
              onResize={(b) => setGroupBounds(group.id, b)}
              onMove={(dx, dy) => moveGroup(group.id, dx, dy)}
            />
          );
        })}
      </div>
    </div>
  );
};
