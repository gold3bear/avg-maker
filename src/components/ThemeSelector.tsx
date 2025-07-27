// src/components/ThemeSelector.tsx
// 主题选择器组件

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeSelectorProps {
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className = '' }) => {
  const { currentTheme, availableThemes, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (themeName: string) => {
    setTheme(themeName as any);
    setIsOpen(false);
  };

  const currentThemeInfo = availableThemes.find(t => t.key === currentTheme);

  return (
    <div className={`relative ${className}`}>
      {/* 主题选择按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors"
        style={{
          backgroundColor: 'var(--color-buttonSecondary)',
          color: 'var(--color-textPrimary)',
          border: `1px solid var(--color-border)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-buttonSecondaryHover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-buttonSecondary)';
        }}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="currentColor"
          className="flex-shrink-0"
        >
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 0 1 6 6 6 6 0 0 1-6 6V2z"/>
        </svg>
        <span className="hidden sm:inline">
          {currentThemeInfo?.name || '主题'}
        </span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="currentColor"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4"/>
        </svg>
      </button>

      {/* 主题选择下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div 
            className="absolute right-0 top-full mt-2 py-2 rounded-md shadow-lg z-20 min-w-48"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: `1px solid var(--color-border)`,
              boxShadow: 'var(--color-shadow) 0px 4px 12px',
            }}
          >
            {availableThemes.map((theme) => (
              <button
                key={theme.key}
                onClick={() => handleThemeChange(theme.key)}
                className="w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3"
                style={{
                  color: 'var(--color-textPrimary)',
                  backgroundColor: currentTheme === theme.key ? 'var(--color-active)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (currentTheme !== theme.key) {
                    e.currentTarget.style.backgroundColor = 'var(--color-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTheme !== theme.key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {/* 主题预览圆点 */}
                <div className="flex gap-1">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{
                      backgroundColor: getThemePreviewColor(theme.key, 'primary'),
                      borderColor: 'var(--color-border)',
                    }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{
                      backgroundColor: getThemePreviewColor(theme.key, 'accent'),
                      borderColor: 'var(--color-border)',
                    }}
                  />
                </div>
                
                <span className="flex-1">{theme.name}</span>
                
                {/* 当前主题指示器 */}
                {currentTheme === theme.key && (
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="currentColor"
                    style={{ color: 'var(--color-success)' }}
                  >
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 11.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 获取主题预览颜色
 */
function getThemePreviewColor(themeName: string, type: 'primary' | 'accent'): string {
  const themeColors: { [key: string]: { primary: string; accent: string } } = {
    'light': {
      primary: '#ffffff',
      accent: '#0078d4',
    },
    'dark': {
      primary: '#1e1e1e',
      accent: '#569cd6',
    },
    'github-dark': {
      primary: '#0d1117',
      accent: '#58a6ff',
    },
    'monokai': {
      primary: '#272822',
      accent: '#66d9ef',
    },
  };
  
  return themeColors[themeName]?.[type] || '#cccccc';
}