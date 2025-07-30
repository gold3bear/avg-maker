// 平台检测和配置
import type { Platform, APIConfig } from './types';

/**
 * 检测当前运行平台
 */
export function detectPlatform(): Platform {
  // 检查是否在Electron环境中
  if (typeof window !== 'undefined' && window.inkAPI && 'versions' in window.process) {
    return 'electron';
  }
  
  // 检查是否在浏览器环境中
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser';
  }
  
  return 'unknown';
}

/**
 * 获取平台特定的配置
 */
export function getPlatformConfig(platform: Platform = detectPlatform()): APIConfig {
  switch (platform) {
    case 'electron':
      return {
        platform: 'electron',
        timeout: 30000, // Electron IPC通常较快
      };
    
    case 'browser':
      return {
        platform: 'browser',
        baseUrl: 'http://localhost:3001', // 预览服务器地址
        timeout: 10000, // HTTP请求可能较慢
      };
    
    default:
      return {
        platform: 'unknown',
        timeout: 5000,
      };
  }
}

/**
 * 检查特定功能是否在当前平台可用
 */
export function isFeatureAvailable(feature: string, platform: Platform = detectPlatform()): boolean {
  const featureMap: Record<Platform, Set<string>> = {
    electron: new Set([
      'openProject',
      'loadProjectPath', 
      'readFile',
      'writeFile',
      'readDir',
      'watchFiles',
      'onFileChanged',
      'compileInk',
      'loadPlugins',
      'exportGame',
      'openPreviewWindow',
      'updatePreviewFile',
      'onSetActiveFile',
      'minimizeWindow',
      'maximizeWindow',
      'closeWindow',
      'setWindowTitle',
      'onAppWillClose',
      'removeAppWillCloseListener',
      'confirmClose',
      'cancelClose',
      'showSaveDialog',
      'logToMain'
    ]),
    browser: new Set([
      'readFile',
      'compileInk',
      'loadPlugins',
      'getCurrentFile',
      'setCurrentFile',
      'onSetActiveFile'
    ]),
    unknown: new Set([])
  };
  
  return featureMap[platform]?.has(feature) ?? false;
}

/**
 * 平台兼容性检查
 */
export function checkCompatibility(): {
  platform: Platform;
  supported: boolean;
  features: string[];
  warnings: string[];
} {
  const platform = detectPlatform();
  const warnings: string[] = [];
  
  if (platform === 'unknown') {
    warnings.push('无法检测到支持的平台环境');
  }
  
  if (platform === 'browser') {
    warnings.push('浏览器模式下某些功能受限（如文件系统访问）');
  }
  
  const availableFeatures = Object.keys(featureMap[platform] || {});
  
  return {
    platform,
    supported: platform !== 'unknown',
    features: availableFeatures,
    warnings
  };
}

// 内部功能映射（从checkCompatibility中提取）
const featureMap: Record<Platform, Record<string, boolean>> = {
  electron: {
    fileSystem: true,
    projectManagement: true,
    windowControl: true,
    compilation: true,
    export: true,
    preview: true
  },
  browser: {
    fileSystem: false,
    projectManagement: false,
    windowControl: false,
    compilation: true,
    export: false,
    preview: true
  },
  unknown: {}
};