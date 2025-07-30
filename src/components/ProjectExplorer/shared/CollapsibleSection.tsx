import React, { useState, useEffect } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  storageKey?: string;
  className?: string;
  headerActions?: React.ReactNode;
  stickyZIndex?: number;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  storageKey,
  className = '',
  headerActions,
  stickyZIndex = 10
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`projectExplorer.${storageKey}.expanded`);
      return stored !== null ? stored === 'true' : defaultExpanded;
    }
    return defaultExpanded;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`projectExplorer.${storageKey}.expanded`, isExpanded.toString());
    }
  }, [isExpanded, storageKey]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`border-b border-gray-700 ${className}`}>
      <div
        className="sticky top-0 flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-gray-700/50 transition-colors"
        onClick={toggleExpanded}
        style={{
          zIndex: stickyZIndex,
          backgroundColor: 'var(--color-sidebarBackground)',
          borderBottom: `1px solid var(--color-sidebarBorder)`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-sidebarBackground)';
        }}
      >
        <div className="flex items-center gap-1">
          <span
            className="text-xs transform transition-transform duration-200"
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: 'var(--color-textSecondary)'
            }}
          >
            ▶
          </span>
          <span
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-textSecondary)' }}
          >
            {title}
          </span>
        </div>
        {headerActions && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {headerActions}
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="pb-2">
          {children}
        </div>
      )}
    </div>
  );
};