import React from 'react';

/**
 * ActivityBar - VS Code style vertical bar with navigation icons
 */
export const ActivityBar: React.FC = () => {
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-sidebarForeground)',
  };

  return (
    <div
      className="flex flex-col items-center py-2"
      style={{
        width: '3rem',
        backgroundColor: 'var(--color-sidebarBackground)',
        borderRight: `1px solid var(--color-sidebarBorder)`,
      }}
    >
      <button style={buttonStyle}>📂</button>
      <button style={buttonStyle}>🔍</button>
    </div>
  );
};

export default ActivityBar;
