import React from 'react';

interface StatusBarProps {
  /** 当前活动文件路径 */
  filePath: string | null;
}

/**
 * StatusBar - bottom status bar similar to VS Code
 */
export const StatusBar: React.FC<StatusBarProps> = ({ filePath }) => {
  return (
    <div
      className="text-xs flex items-center justify-between px-3 h-6"
      style={{
        backgroundColor: 'var(--color-toolbarBackground)',
        borderTop: `1px solid var(--color-border)`,
        color: 'var(--color-toolbarForeground)',
      }}
    >
      <span>{filePath ? filePath : '未选择文件'}</span>
      <span>Ready</span>
    </div>
  );
};

export default StatusBar;
