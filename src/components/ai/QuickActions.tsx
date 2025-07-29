import React from 'react';

interface QuickActionsProps {
  onAction: (text: string) => void;
}

const actions = ['生成角色', '优化代码', '剧情转折'];

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => (
  <div className="mt-2 flex flex-wrap gap-2">
    {actions.map((a) => (
      <button
        key={a}
        onClick={() => onAction(a)}
        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
      >
        {a}
      </button>
    ))}
  </div>
);

export default QuickActions;
