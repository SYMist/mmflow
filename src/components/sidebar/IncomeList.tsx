import React from 'react';
import { FlowNodeData } from '../../types/flow';

interface IncomeListProps {
  incomes: FlowNodeData[];
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export const IncomeList: React.FC<IncomeListProps> = ({
  incomes,
  onSelect,
  onAdd,
}) => {
  return (
    <section className="sidebar-section">
      <div className="sidebar-section-header">
        <h3>수입</h3>
        <button type="button" onClick={onAdd}>
          + 추가
        </button>
      </div>
      <ul className="sidebar-list">
        {incomes.map((income) => (
          <li key={income.id}>
            <button
              type="button"
              className="sidebar-list-item"
              onClick={() => onSelect(income.id)}
              data-node-id={income.id}
            >
              <span className="color-dot" style={{ backgroundColor: income.color }} />
              <span>
                {income.itemName}
                {income.bankName ? ` · ${income.bankName}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
