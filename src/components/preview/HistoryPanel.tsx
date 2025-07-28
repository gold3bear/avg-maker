// src/components/preview/HistoryPanel.tsx
// Preview组件的历史记录面板

import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { HistoryEntry } from '../../types/preview';

interface HistoryPanelProps {
  history: HistoryEntry[];
  currentIndex: number;
  onJumpToHistory: (index: number) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onJumpToHistory
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  if (history.length === 0) {
    return null;
  }

  return (
    <div 
      className="border-t"
      style={{ 
        backgroundColor: colors.secondary,
        borderColor: colors.border 
      }}
    >
      {/* 切换按钮 */}
      <button
        className="w-full px-3 py-2 text-left text-sm font-medium transition-colors duration-200 flex items-center justify-between"
        style={{ 
          backgroundColor: colors.surface,
          color: colors.textSecondary 
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.surface;
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span>📜 历史记录</span>
          <span 
            className="px-2 py-1 rounded text-xs"
            style={{ 
              backgroundColor: colors.primary,
              color: colors.textMuted 
            }}
          >
            {history.length} 步
          </span>
        </div>
        <span 
          className="transition-transform duration-200"
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: colors.textMuted 
          }}
        >
          ▼
        </span>
      </button>

      {/* 历史记录列表 */}
      {isExpanded && (
        <div 
          className="max-h-64 overflow-y-auto"
          style={{ backgroundColor: colors.primary }}
        >
          {history.map((entry, idx) => {
            const isCurrentStep = idx === currentIndex;
            const isFutureStep = idx > currentIndex;
            
            return (
              <div
                key={idx}
                className={`border-b cursor-pointer transition-all duration-200 ${
                  isCurrentStep ? 'ring-2' : ''
                }`}
                style={{ 
                  backgroundColor: isCurrentStep 
                    ? colors.surface 
                    : isFutureStep 
                      ? colors.secondary 
                      : colors.primary,
                  borderColor: colors.border,
                  // ringColor: isCurrentStep ? colors.focus : 'transparent',
                  opacity: isFutureStep ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentStep) {
                    e.currentTarget.style.backgroundColor = colors.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentStep) {
                    e.currentTarget.style.backgroundColor = isFutureStep 
                      ? colors.secondary 
                      : colors.primary;
                  }
                }}
                onClick={() => onJumpToHistory(idx)}
              >
                <div className="p-3">
                  {/* 步骤头部 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ 
                          backgroundColor: isCurrentStep 
                            ? colors.focus 
                            : colors.buttonSecondary,
                          color: colors.textPrimary 
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: colors.textPrimary }}
                      >
                        {entry.knotName}
                      </span>
                      {isCurrentStep && (
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: colors.info,
                            color: colors.textPrimary 
                          }}
                        >
                          当前
                        </span>
                      )}
                    </div>
                    <span 
                      className="text-xs"
                      style={{ color: colors.textMuted }}
                    >
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* 输出内容预览 */}
                  {entry.output.length > 0 && (
                    <div 
                      className="text-xs mb-2 line-clamp-2"
                      style={{ color: colors.textSecondary }}
                    >
                      {entry.output[entry.output.length - 1].substring(0, 100)}
                      {entry.output[entry.output.length - 1].length > 100 ? '...' : ''}
                    </div>
                  )}

                  {/* 选择信息 */}
                  {entry.choiceIndex !== undefined && entry.choices[entry.choiceIndex] && (
                    <div 
                      className="text-xs px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: colors.surface,
                        color: colors.info,
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      选择了: {entry.choices[entry.choiceIndex].text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};