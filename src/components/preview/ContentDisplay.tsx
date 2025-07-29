// src/components/preview/ContentDisplay.tsx
// Preview组件的内容显示区域

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { processTextContent } from '../../utils/htmlParser';
import '../../styles/preview.css';

interface ContentDisplayProps {
  output: string[];
  choices: any[];
  onChoiceSelect: (index: number) => void;
  isLoading?: boolean;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
  output,
  choices,
  onChoiceSelect,
  isLoading = false
}) => {
  const { colors } = useTheme();

  // 获取文本类型对应的样式
  const getTextStyles = (textType: string) => {
    switch (textType) {
      case 'dialogue':
        return {
          color: colors.info,
          fontStyle: 'italic',
          paddingLeft: '1rem',
          borderLeft: `3px solid ${colors.info}`,
        };
      case 'system':
        return {
          color: colors.textMuted,
          fontSize: '0.9rem',
          fontStyle: 'italic',
        };
      case 'choice':
        return {
          color: colors.warning,
          fontWeight: 'bold',
        };
      default: // narration
        return {
          color: colors.textPrimary,
        };
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* 输出内容区域 */}
      <div className="space-y-3 mb-6 custom-scrollbar">
        {output.length === 0 && !isLoading ? (
          <div 
            className="text-center py-8"
            style={{ color: colors.textMuted }}
          >
            故事即将开始...
          </div>
        ) : (
          output.map((line, idx) => {
            const { htmlContent, textType, className } = processTextContent(line);
            const textStyles = getTextStyles(textType);

            return (
              <div
                key={idx}
                className={`leading-relaxed text-fade-in ${className}`}
                style={{
                  ...textStyles,
                  animationDelay: `${idx * 100}ms`,
                }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            );
          })
        )}

        {isLoading && (
          <div 
            className="text-center py-4"
            style={{ color: colors.textMuted }}
          >
            <div className="inline-flex items-center space-x-2">
              <div 
                className="w-4 h-4 border-2 border-t-transparent rounded-full loading-spinner"
                style={{ borderColor: colors.info, borderTopColor: 'transparent' }}
              />
              <span>正在处理...</span>
            </div>
          </div>
        )}
      </div>

      {/* 选择区域 */}
      {choices.length > 0 && !isLoading && (
        <div 
          className="border-t pt-4"
          style={{ borderColor: colors.border }}
        >
          <div 
            className="text-sm font-medium mb-3"
            style={{ color: colors.textSecondary }}
          >
            选择你的行动：
          </div>
          <div className="space-y-2">
            {choices.map((choice, idx) => (
              <button
                key={idx}
                className="choice-button w-full text-left px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  // focusRingColor: colors.focus,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.hover;
                  e.currentTarget.style.borderColor = colors.focus;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surface;
                  e.currentTarget.style.borderColor = colors.border;
                }}
                onFocus={() => {
                  // Focus styling handled by CSS focus:ring
                }}
                onClick={() => onChoiceSelect(idx)}
              >
                <div className="flex items-start space-x-3">
                  <span 
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ 
                      backgroundColor: colors.buttonPrimary,
                      color: colors.textPrimary 
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div 
                      className="font-medium"
                      dangerouslySetInnerHTML={{ 
                        __html: processTextContent(choice.text).htmlContent 
                      }}
                    />
                    {choice.tags && choice.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {choice.tags.map((tag: string, tagIdx: number) => (
                          <span
                            key={tagIdx}
                            className="px-2 py-1 text-xs rounded"
                            style={{
                              backgroundColor: colors.primary,
                              color: colors.textMuted,
                              border: `1px solid ${colors.border}`
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 键盘提示 */}
          <div 
            className="mt-3 text-xs text-center"
            style={{ color: colors.textMuted }}
          >
            提示：使用数字键 1-{choices.length} 快速选择
          </div>
        </div>
      )}
    </div>
  );
};