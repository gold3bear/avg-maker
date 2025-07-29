// src/components/preview/NavigationBar.tsx
// Preview组件的导航栏

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { GameState, NavigationAction } from '../../types/preview';

interface NavigationBarProps {
  gameState: GameState;
  onAction: (action: NavigationAction) => void;
  isLoading?: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  gameState,
  onAction,
  isLoading = false
}) => {
  const { colors } = useTheme();

  const buttonStyle = {
    backgroundColor: colors.buttonSecondary,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: colors.surface,
    color: colors.textMuted,
    cursor: 'not-allowed',
  };

  const hoverStyle = {
    backgroundColor: colors.buttonSecondaryHover,
  };

  return (
    <div 
      className="flex items-center justify-between p-3 border-b"
      style={{ 
        backgroundColor: colors.toolbarBackground,
        borderColor: colors.toolbarBorder 
      }}
    >
      {/* 左侧：导航按钮 */}
      <div className="flex items-center space-x-2">
        {/* 后退按钮 */}
        <button
          className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          style={gameState.canUndo && !isLoading ? buttonStyle : disabledButtonStyle}
          disabled={!gameState.canUndo || isLoading}
          onMouseEnter={(e) => {
            if (gameState.canUndo && !isLoading) {
              Object.assign(e.currentTarget.style, hoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (gameState.canUndo && !isLoading) {
              Object.assign(e.currentTarget.style, buttonStyle);
            }
          }}
          onClick={() => onAction({ type: 'UNDO' })}
          title="后退到上一步 (Ctrl+Z)"
        >
          ◀ 后退
        </button>

        {/* 前进按钮 */}
        <button
          className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          style={gameState.canRedo && !isLoading ? buttonStyle : disabledButtonStyle}
          disabled={!gameState.canRedo || isLoading}
          onMouseEnter={(e) => {
            if (gameState.canRedo && !isLoading) {
              Object.assign(e.currentTarget.style, hoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (gameState.canRedo && !isLoading) {
              Object.assign(e.currentTarget.style, buttonStyle);
            }
          }}
          onClick={() => onAction({ type: 'REDO' })}
          title="前进到下一步 (Ctrl+Y)"
        >
          ▶ 前进
        </button>

        {/* 重置按钮 */}
        <button
          className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
          style={buttonStyle}
          disabled={isLoading}
          onMouseEnter={(e) => {
            if (!isLoading) {
              Object.assign(e.currentTarget.style, hoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              Object.assign(e.currentTarget.style, buttonStyle);
            }
          }}
          onClick={() => onAction({ type: 'RESET' })}
          title="重新开始故事 (Ctrl+R)"
        >
          🔄 重置
        </button>
      </div>

      {/* 右侧：导出按钮 */}
      <div className="flex items-center space-x-2">
        {/* 导出网页按钮 */}
        <button
          className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
          style={buttonStyle}
          disabled={isLoading}
          onMouseEnter={(e) => {
            if (!isLoading) {
              Object.assign(e.currentTarget.style, hoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              Object.assign(e.currentTarget.style, buttonStyle);
            }
          }}
          onClick={() => onAction({ type: 'EXPORT_WEB' })}
          title="导出为网页版本"
        >
          🌐 网页
        </button>

        {/* 导出桌面按钮 */}
        <button
          className="px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
          style={buttonStyle}
          disabled={isLoading}
          onMouseEnter={(e) => {
            if (!isLoading) {
              Object.assign(e.currentTarget.style, hoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              Object.assign(e.currentTarget.style, buttonStyle);
            }
          }}
          onClick={() => onAction({ type: 'EXPORT_DESKTOP' })}
          title="导出为桌面应用"
        >
          🖥️ 桌面
        </button>
      </div>
    </div>
  );
};