import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Header } from './layout/Header';
import { FlowCanvas } from './canvas/FlowCanvas';
import { useFlowStoreV3 } from '../store/flowStoreV3';

export const CanvasPage: React.FC = () => {
  const {
    canvasMeta, contextMenu, closeMenu,
    createNode, createSubNode, deleteNode,
    nodes, groupProposal, acceptGroupProposal, dismissGroupProposal,
    persist, selectedNodeId, selectedEdgeId, editingNodeId,
    deleteEdge, undo, redo,
  } = useFlowStoreV3();

  // Auto-save (debounced)
  const nodesRef = React.useRef(nodes);
  nodesRef.current = nodes;
  React.useEffect(() => {
    const handle = window.setTimeout(() => persist(), 300);
    return () => window.clearTimeout(handle);
  }, [nodes, persist]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        if (editingNodeId) return;
        if (selectedNodeId) {
          event.preventDefault();
          if (window.confirm('이 노드와 연결된 규칙이 모두 삭제됩니다. 계속할까요?')) {
            deleteNode(selectedNodeId);
          }
        } else if (selectedEdgeId) {
          event.preventDefault();
          deleteEdge(selectedEdgeId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodeId, selectedEdgeId, editingNodeId, deleteNode, deleteEdge, undo, redo]);

  const contextMenuNode = contextMenu?.type === 'node'
    ? nodes.find((n) => n.id === contextMenu.nodeId)
    : null;

  const showHint = nodes.length === 0;

  return (
    <ReactFlowProvider>
      <Header />

      <main className="main-layout-v3">
        <FlowCanvas />
        {showHint && (
          <div className="canvas-empty-hint">
            <p>캔버스 빈 영역에서 우클릭하여 출발 노드 또는 도착 노드를 만들어보세요</p>
          </div>
        )}
      </main>

      {contextMenu && (
        <div className="context-menu-overlay" onClick={closeMenu} onContextMenu={closeMenu}>
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'node' && contextMenuNode && (
              <>
                {contextMenuNode.type === 'destination' && !nodes.some((n) => n.type === 'sub' && n.parentNodeId === contextMenuNode.id) && (
                  <button type="button" className="context-menu-item" onClick={() => { createSubNode(contextMenuNode.id); }}>
                    서브 노드 추가
                  </button>
                )}
                <button type="button" className="context-menu-item" onClick={() => deleteNode(contextMenuNode.id)}>
                  삭제
                </button>
              </>
            )}
            {contextMenu.type === 'pane' && (
              <>
                <button type="button" className="context-menu-item" onClick={() => createNode('source', { x: contextMenu.flowX, y: contextMenu.flowY })}>
                  출발 노드
                </button>
                <button type="button" className="context-menu-item" onClick={() => createNode('destination', { x: contextMenu.flowX, y: contextMenu.flowY })}>
                  도착 노드
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {groupProposal && (
        <div className="modal-overlay" onClick={dismissGroupProposal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">그룹으로 묶기</h3>
            <p className="modal-message">
              도착 노드는 한 개의 출발 노드만 가질 수 있어 새 도착 노드를 자동으로 만들었습니다.
              이름과 계좌가 같으니 그룹으로 묶을까요?
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn modal-btn-secondary" onClick={dismissGroupProposal}>
                별개로 두기
              </button>
              <button type="button" className="modal-btn modal-btn-primary" onClick={acceptGroupProposal}>
                그룹으로 묶기
              </button>
            </div>
          </div>
        </div>
      )}

      {!canvasMeta && null}
    </ReactFlowProvider>
  );
};
