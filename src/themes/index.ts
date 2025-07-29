// src/themes/index.ts
// 主题系统 - 支持多种配色方案，参考VSCode

export interface ThemeColors {
  // 主要背景色
  primary: string;
  secondary: string;
  surface: string;
  
  // 文本颜色
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // 边框和分割线
  border: string;
  divider: string;
  
  // 交互状态
  hover: string;
  active: string;
  focus: string;
  
  // 编辑器特定
  editorBackground: string;
  editorForeground: string;
  editorSelection: string;
  editorLineHighlight: string;
  editorGutter: string;
  
  // 侧边栏
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarBorder: string;
  
  // 工具栏
  toolbarBackground: string;
  toolbarForeground: string;
  toolbarBorder: string;
  
  // 标题栏
  titlebar: string;
  
  // 按钮
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonSecondary: string;
  buttonSecondaryHover: string;
  
  // 状态颜色
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // 特殊
  scrollbar: string;
  shadow: string;
}

// VSCode Dark+ 主题
export const darkTheme: ThemeColors = {
  primary: '#1e1e1e',        // VSCode 主背景
  secondary: '#252526',      // VSCode 次要背景
  surface: '#2d2d30',        // VSCode 表面色
  
  textPrimary: '#cccccc',    // VSCode 主文本
  textSecondary: '#969696',   // VSCode 次要文本
  textMuted: '#6a6a6a',      // VSCode 弱化文本
  
  border: '#3e3e42',         // VSCode 边框
  divider: '#2d2d30',        // 分割线
  
  hover: '#2a2d2e',          // 悬停
  active: '#094771',         // 激活状态
  focus: '#007acc',          // 焦点颜色
  
  editorBackground: '#1e1e1e',
  editorForeground: '#d4d4d4',
  editorSelection: '#264f78',
  editorLineHighlight: '#2a2d2e',
  editorGutter: '#1e1e1e',
  
  sidebarBackground: '#252526',
  sidebarForeground: '#cccccc',
  sidebarBorder: '#2d2d30',
  
  toolbarBackground: '#2d2d30',
  toolbarForeground: '#cccccc',
  toolbarBorder: '#3e3e42',
  
  titlebar: '#323233',
  
  buttonPrimary: '#0e639c',
  buttonPrimaryHover: '#1177bb',
  buttonSecondary: '#0e639c',
  buttonSecondaryHover: '#1177bb',
  
  success: '#89d185',
  warning: '#d7ba7d',
  error: '#f85149',
  info: '#75beff',
  
  scrollbar: '#424242',
  shadow: 'rgba(0, 0, 0, 0.6)',
};

// VSCode Light+ 主题
export const lightTheme: ThemeColors = {
  primary: '#ffffff',
  secondary: '#f3f3f3',
  surface: '#ebebeb',
  
  textPrimary: '#000000',
  textSecondary: '#6c6c6c',
  textMuted: '#8e8e8e',
  
  border: '#e5e5e5',
  divider: '#ebebeb',
  
  hover: '#f0f0f0',
  active: '#0078d4',
  focus: '#005a9e',
  
  editorBackground: '#ffffff',
  editorForeground: '#000000',
  editorSelection: '#add6ff',
  editorLineHighlight: '#f0f0f0',
  editorGutter: '#ffffff',
  
  sidebarBackground: '#f3f3f3',
  sidebarForeground: '#000000',
  sidebarBorder: '#e5e5e5',
  
  toolbarBackground: '#ebebeb',
  toolbarForeground: '#000000',
  toolbarBorder: '#e5e5e5',
  
  titlebar: '#dddddd',
  
  buttonPrimary: '#0078d4',
  buttonPrimaryHover: '#106ebe',
  buttonSecondary: '#0078d4',
  buttonSecondaryHover: '#106ebe',
  
  success: '#107c10',
  warning: '#797673',
  error: '#a1260d',
  info: '#0078d4',
  
  scrollbar: '#c2c2c2',
  shadow: 'rgba(0, 0, 0, 0.2)',
};

// GitHub Dark 主题
export const githubDarkTheme: ThemeColors = {
  primary: '#0d1117',        // GitHub 主背景
  secondary: '#161b22',      // GitHub 次要背景
  surface: '#21262d',        // GitHub 表面色
  
  textPrimary: '#f0f6fc',    // GitHub 主文本
  textSecondary: '#9198a1',   // GitHub 次要文本
  textMuted: '#7d8590',      // GitHub 弱化文本
  
  border: '#30363d',         // GitHub 边框
  divider: '#21262d',        // 分割线
  
  hover: '#262c36',          // 悬停
  active: '#388bfd',         // 激活状态
  focus: '#58a6ff',          // 焦点颜色
  
  editorBackground: '#0d1117',
  editorForeground: '#f0f6fc',
  editorSelection: '#264f78',
  editorLineHighlight: '#161b22',
  editorGutter: '#0d1117',
  
  sidebarBackground: '#161b22',
  sidebarForeground: '#f0f6fc',
  sidebarBorder: '#30363d',
  
  toolbarBackground: '#21262d',
  toolbarForeground: '#f0f6fc',
  toolbarBorder: '#30363d',
  
  titlebar: '#24292f',
  
  buttonPrimary: '#238636',
  buttonPrimaryHover: '#2ea043',
  buttonSecondary: '#21262d',
  buttonSecondaryHover: '#30363d',
  
  success: '#3fb950',
  warning: '#d29922',
  error: '#f85149',
  info: '#58a6ff',
  
  scrollbar: '#30363d',
  shadow: 'rgba(0, 0, 0, 0.7)',
};

// Monokai 主题
export const monokaiTheme: ThemeColors = {
  primary: '#272822',        // Monokai 主背景
  secondary: '#3e3d32',      // Monokai 次要背景
  surface: '#49483e',        // Monokai 表面色
  
  textPrimary: '#f8f8f2',    // Monokai 主文本
  textSecondary: '#75715e',   // Monokai 次要文本
  textMuted: '#75715e',      // Monokai 弱化文本
  
  border: '#49483e',         // Monokai 边框
  divider: '#3e3d32',        // 分割线
  
  hover: '#3e3d32',          // 悬停
  active: '#66d9ef',         // 激活状态
  focus: '#66d9ef',          // 焦点颜色
  
  editorBackground: '#272822',
  editorForeground: '#f8f8f2',
  editorSelection: '#49483e',
  editorLineHighlight: '#3e3d32',
  editorGutter: '#272822',
  
  sidebarBackground: '#3e3d32',
  sidebarForeground: '#f8f8f2',
  sidebarBorder: '#49483e',
  
  toolbarBackground: '#49483e',
  toolbarForeground: '#f8f8f2',
  toolbarBorder: '#75715e',
  
  titlebar: '#49483e',
  
  buttonPrimary: '#a6e22e',
  buttonPrimaryHover: '#b8f040',
  buttonSecondary: '#66d9ef',
  buttonSecondaryHover: '#78e1f7',
  
  success: '#a6e22e',
  warning: '#e6db74',
  error: '#f92672',
  info: '#66d9ef',
  
  scrollbar: '#75715e',
  shadow: 'rgba(0, 0, 0, 0.8)',
};

export const themes = {
  light: { name: 'Light (VSCode)', colors: lightTheme },
  dark: { name: 'Dark (VSCode)', colors: darkTheme },
  'github-dark': { name: 'GitHub Dark', colors: githubDarkTheme },
  monokai: { name: 'Monokai', colors: monokaiTheme },
} as const;

export type ThemeName = keyof typeof themes;

export const defaultTheme: ThemeName = 'dark';