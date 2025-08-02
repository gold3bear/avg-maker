// src/components/preview/HistoryPanel.tsx
// Preview组件的历史记录面板

import React, { useRef, useEffect, useState } from 'react';
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
  
  // 调试信息
  React.useEffect(() => {
    console.log('🔍 HistoryPanel received data:');
    console.log('  - history length:', history.length);
    console.log('  - currentIndex:', currentIndex);
    console.log('  - currentIndex is valid:', currentIndex >= 0 && currentIndex < history.length);
    
    if (currentIndex >= 0 && currentIndex < history.length) {
      const currentEntry = history[currentIndex];
      console.log('  - CURRENT ENTRY DETAILS:');
      console.log(`    - knot: "${currentEntry.knotName}"`);
      console.log(`    - content lines: ${currentEntry.output.length}`);
      console.log(`    - content preview: "${currentEntry.output[0]?.substring(0, 50) || 'empty'}..."`);
      console.log(`    - choices: ${currentEntry.choices.length}`);
      console.log(`    - timestamp: ${new Date(currentEntry.timestamp).toLocaleTimeString()}`);
    }
    
    console.log('  - ALL ENTRIES:');
    history.forEach((entry, idx) => {
      const marker = idx === currentIndex ? '👈 CURRENT' : '';
      console.log(`    [${idx}] "${entry.knotName}" - ${entry.output.length} lines, ${entry.choices.length} choices ${marker}`);
      if (entry.output.length > 0) {
        console.log(`        Content: "${entry.output[0]?.substring(0, 40) || 'empty'}..."`);
      }
    });
  }, [history, currentIndex]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // 检查是否需要显示滚动到底部按钮
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px容差
      setShowScrollToBottom(!isNearBottom);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // 监听滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      // 初始检查
      checkScrollPosition();
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [history]);

  if (history.length === 0) {
    return (
      <div 
        className="h-full flex items-center justify-center"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="text-center">
          <div 
            className="text-sm mb-2"
            style={{ color: colors.textMuted }}
          >
            还没有历史记录
          </div>
          <div 
            className="text-xs"
            style={{ color: colors.textMuted }}
          >
            游戏进行时会自动记录每一步
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col relative"
      style={{ backgroundColor: colors.primary }}
    >
      {/* 历史记录列表 */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
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

      {/* 滚动到底部按钮 */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
          style={{
            backgroundColor: colors.buttonPrimary,
            color: colors.textPrimary,
            border: `2px solid ${colors.border}`
          }}
          title="滚动到最新记录"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonPrimaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonPrimary;
          }}
        >
          ⬇️
        </button>
      )}
    </div>
  );
};