import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Header } from './layout/Header';
import { MainLayout } from './layout/MainLayout';
import { EmptyState } from './canvas/EmptyState';
import { useFlowStore, type ExportData } from '../store/flowStore';

export const App: React.FC = () => {
  const store = useFlowStore();

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? store.redo() : store.undo();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        if (store.editingNodeId) return;

        if (store.selectedNodeId) {
          event.preventDefault();
          if (window.confirm('이 노드와 연결된 규칙이 모두 삭제됩니다. 계속할까요?')) {
            store.deleteNode(store.selectedNodeId);
          }
        } else if (store.selectedEdgeId) {
          event.preventDefault();
          store.deleteEdge(store.selectedEdgeId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store.selectedNodeId, store.selectedEdgeId, store.editingNodeId, store]);

  // Sidebar context menu on nodes
  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest('.react-flow') || !target.closest('.sidebar')) return;
      const nodeEl = target.closest<HTMLElement>('[data-node-id]');
      const nodeId = nodeEl?.getAttribute('data-node-id');
      if (!nodeId) return;
      event.preventDefault();
      event.stopPropagation();
      store.selectNode(nodeId);
      store.openNodeMenu({ x: event.clientX, y: event.clientY, nodeId });
    };
    window.addEventListener('contextmenu', handler, { capture: true });
    return () => window.removeEventListener('contextmenu', handler, { capture: true } as EventListenerOptions);
  }, [store]);

  // Auto-save (debounced)
  React.useEffect(() => {
    const handle = window.setTimeout(() => store.persist(), 300);
    return () => window.clearTimeout(handle);
  }, [store.nodes, store.edges, store.month, store.scenarioName]);

  const totalIn = store.totalIn();
  const totalOut = store.totalOut();
  const hasNodes = store.nodes.length > 0;

  return (
    <div className="app-root">
      {store.contextMenu ? (
        <div className="context-menu-overlay" onClick={store.closeMenu} onContextMenu={store.closeMenu}>
          <div
            className="context-menu"
            style={{ left: store.contextMenu.x, top: store.contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
          >
            {store.contextMenu.type === 'node' ? (
              <button type="button" className="context-menu-item" onClick={() => store.deleteNode(store.contextMenu!.type === 'node' ? store.contextMenu!.nodeId : '')}>
                삭제
              </button>
            ) : (
              <div className="context-menu-item context-menu-parent">
                <span>노드 생성</span>
                <span className="context-menu-caret">▶</span>
                <div className="context-submenu">
                  <button type="button" className="context-menu-item" onClick={() => store.contextMenu?.type === 'pane' && store.createNodeAt('income', store.contextMenu.flowX, store.contextMenu.flowY)}>수입</button>
                  <button type="button" className="context-menu-item" onClick={() => store.contextMenu?.type === 'pane' && store.createNodeAt('destination', store.contextMenu.flowX, store.contextMenu.flowY)}>목적지</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      <Header
        month={store.month}
        scenarioName={store.scenarioName}
        onChangeMonth={store.setMonth}
        onChangeScenario={store.setScenarioName}
        totalIn={totalIn}
        totalOut={totalOut}
        lastSavedAt={store.lastSavedAt}
        saveStatus={store.saveStatus}
        onExport={() => {
          const data = store.exportAll();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `money-flow-backup-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        onImport={(file: File) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const data = JSON.parse(reader.result as string) as ExportData;
              if (store.importAll(data)) {
                window.location.reload();
              } else {
                window.alert('올바르지 않은 백업 파일입니다.');
              }
            } catch {
              window.alert('파일을 읽을 수 없습니다.');
            }
          };
          reader.readAsText(file);
        }}
      />
      <ReactFlowProvider>
        {hasNodes ? (
          <MainLayout />
        ) : (
          <EmptyState onAddIncome={store.addIncome} onAddDestination={store.addDestination} />
        )}
      </ReactFlowProvider>
    </div>
  );
};
