// src/components/preview/StatusInfo.tsx
// Preview组件的状态信息显示

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { GameState } from '../../types/preview';

interface StatusInfoProps {
  gameState: GameState;
  filePath?: string;
}

export const StatusInfo: React.FC<StatusInfoProps> = ({ gameState, filePath }) => {
  const { colors } = useTheme();

  // 调试信息
  console.log('=== StatusInfo Render ===');
  console.log('gameState.currentKnot:', gameState.currentKnot);
  console.log('gameState:', gameState);

  // 从文件路径中提取文件名
  const fileName = filePath ? filePath.split('/').pop()?.replace('.ink', '') : '未知文件';

  return (
    <div 
      className="flex items-center justify-between px-3 py-2 border-b text-sm"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textSecondary
      }}
    >
      {/* 左侧：文件和节点信息 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
            文件:
          </span>
          <span className="font-medium" style={{ color: colors.textPrimary }}>
            {fileName}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
            节点:
          </span>
          <span 
            className="px-2 py-1 rounded text-xs font-mono"
            style={{ 
              backgroundColor: colors.primary,
              color: colors.info,
              border: `1px solid ${colors.border}`
            }}
          >
            {gameState.currentKnot || 'unknown'}
          </span>
        </div>
      </div>

      {/* 右侧：统计信息 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
            步数:
          </span>
          <span className="font-medium" style={{ color: colors.textPrimary }}>
            {gameState.stepCount}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
            历史:
          </span>
          <span className="font-medium" style={{ color: colors.textPrimary }}>
            {gameState.history.length}
          </span>
        </div>

        {Object.keys(gameState.variables).length > 0 && (
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
              变量:
            </span>
            <span className="font-medium" style={{ color: colors.textPrimary }}>
              {Object.keys(gameState.variables).length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};