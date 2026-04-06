import React from 'react';
import { FlowNodeData } from '../../types/flow';

interface DestinationListProps {
  destinations: FlowNodeData[];
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export const DestinationList: React.FC<DestinationListProps> = ({
  destinations,
  onSelect,
  onAdd,
}) => {
  return (
    <section className="sidebar-section">
      <div className="sidebar-section-header">
        <h3>목적지</h3>
        <button type="button" onClick={onAdd}>
          + 추가
        </button>
      </div>
      <ul className="sidebar-list">
        {destinations.map((destination) => (
          <li key={destination.id}>
            <button
              type="button"
              className="sidebar-list-item"
              onClick={() => onSelect(destination.id)}
              data-node-id={destination.id}
            >
              <span className="color-dot" style={{ backgroundColor: destination.color }} />
              <span>
                {destination.itemName}
                {destination.bankName ? ` · ${destination.bankName}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
