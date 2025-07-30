import React from 'react';

interface EmptyStateProps {
  icon?: string;
  message: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📂',
  message,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-4 text-center ${className}`}>
      <div className="text-2xl mb-2 opacity-50">
        {icon}
      </div>
      <div
        className="text-sm"
        style={{ color: 'var(--color-textMuted)' }}
      >
        {message}
      </div>
    </div>
  );
};