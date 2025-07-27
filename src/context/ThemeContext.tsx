// src/context/ThemeContext.tsx
// 主题管理上下文

import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, defaultTheme, type ThemeName, type ThemeColors } from '../themes';

interface ThemeContextValue {
  currentTheme: ThemeName;
  colors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  availableThemes: Array<{ key: ThemeName; name: string }>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = 'ink-editor-theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 从localStorage读取保存的主题，如果没有则使用默认主题
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && saved in themes) {
        return saved as ThemeName;
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    return defaultTheme;
  });

  // 当主题变化时保存到localStorage
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [currentTheme]);

  // 应用CSS变量到根元素
  useEffect(() => {
    const colors = themes[currentTheme].colors;
    const root = document.documentElement;
    
    // 设置CSS自定义属性
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // 设置Monaco编辑器主题相关的CSS变量
    root.style.setProperty('--vscode-editor-background', colors.editorBackground);
    root.style.setProperty('--vscode-editor-foreground', colors.editorForeground);
    root.style.setProperty('--vscode-editorLineNumber-foreground', colors.textMuted);
    root.style.setProperty('--vscode-editor-selectionBackground', colors.editorSelection);
    root.style.setProperty('--vscode-editor-lineHighlightBackground', colors.editorLineHighlight);
    
    // 更新body的背景色和文本色
    document.body.style.backgroundColor = colors.primary;
    document.body.style.color = colors.textPrimary;
    
    // 添加主题类到body，用于某些需要类选择器的场景
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme}`);
    
  }, [currentTheme]);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
  };

  const availableThemes = Object.entries(themes).map(([key, theme]) => ({
    key: key as ThemeName,
    name: theme.name,
  }));

  const contextValue: ThemeContextValue = {
    currentTheme,
    colors: themes[currentTheme].colors,
    setTheme,
    availableThemes,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};