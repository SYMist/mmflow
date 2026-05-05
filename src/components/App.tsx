import React from 'react';
import { useFlowStoreV3 } from '../store/flowStoreV3';
import { CanvasList } from './canvas-list/CanvasList';
import { CanvasPage } from './CanvasPage';

export const App: React.FC = () => {
  const view = useFlowStoreV3((s) => s.view);

  return (
    <div className="app-root">
      {view === 'list' ? <CanvasList /> : <CanvasPage />}
    </div>
  );
};
