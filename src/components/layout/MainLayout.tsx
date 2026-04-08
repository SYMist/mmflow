import React from 'react';
import { useFlowStore } from '../../store/flowStore';
import { Sidebar } from '../sidebar/Sidebar';
import { FlowCanvas } from '../canvas/FlowCanvas';
import { BottomSummary } from '../summary/BottomSummary';

export const MainLayout: React.FC = () => {
  const sidebarOpen = useFlowStore((s) => s.sidebarOpen);
  const toggleSidebar = useFlowStore((s) => s.toggleSidebar);

  return (
    <main className={`main-layout ${sidebarOpen ? '' : 'main-layout-sidebar-hidden'}`}>
      <div className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-wrapper-open' : ''}`}>
        <Sidebar />
      </div>
      <div className="canvas-wrapper">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        <FlowCanvas />
      </div>
      <BottomSummary />
    </main>
  );
};
