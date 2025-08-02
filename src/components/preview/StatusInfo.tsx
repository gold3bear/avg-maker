// src/components/preview/StatusInfo.tsx
// Preview组件的状态信息显示

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { GameState } from '../../types/preview';

interface StatusInfoProps {
  gameState: GameState;
  // filePath不再需要，因为CompilePreviewer已经显示了入口文件信息
}

export const StatusInfo: React.FC<StatusInfoProps> = ({ gameState }) => {
  const { colors } = useTheme();

  // 调试信息
  console.log('=== StatusInfo Render ===');
  console.log('gameState.currentKnot:', gameState.currentKnot);
  console.log('gameState:', gameState);

  // 移除文件名显示，因为CompilePreviewer已经有入口文件显示

  return (
    <div 
      className="flex items-center justify-between px-3 py-2 border-b text-sm"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textSecondary
      }}
    >
      {/* 左侧：当前节点信息 */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <span className="text-xs font-medium" style={{ color: colors.textMuted }}>
            当前节点:
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