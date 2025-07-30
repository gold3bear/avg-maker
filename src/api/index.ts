// API抽象层统一入口
export type { 
  IInkAPI, 
  FileNode, 
  CompilationResult, 
  PluginManifest, 
  CurrentFileResponse,
  Platform,
  APIConfig 
} from './types';

export { 
  detectPlatform, 
  getPlatformConfig, 
  isFeatureAvailable,
  checkCompatibility 
} from './platform';

export { APIFactory } from './factory';
export { ElectronAPIAdapter } from './electron-adapter';
export { BrowserAPIAdapter } from './browser-adapter';

// 便捷的全局API实例
import { APIFactory } from './factory';

/**
 * 获取全局API实例
 * 这是应用中使用API的主要入口点
 */
export const inkAPI = {
  /**
   * 获取API实例
   */
  getInstance: APIFactory.getInstance.bind(APIFactory),
  
  /**
   * 重置API实例
   */
  reset: APIFactory.reset.bind(APIFactory),
  
  /**
   * 检查功能可用性
   */
  isFeatureAvailable: APIFactory.isFeatureAvailable.bind(APIFactory),
  
  /**
   * 安全调用API方法
   */
  safeCall: APIFactory.safeCall.bind(APIFactory),
  
  /**
   * 获取当前配置
   */
  getConfig: APIFactory.getConfig.bind(APIFactory)
};

// 为了向后兼容，提供直接的API实例
export const api = inkAPI.getInstance();

/**
 * React Hook: 使用Ink API
 * 提供响应式的API访问和状态管理
 */
import { useState, useEffect, useCallback } from 'react';
import type { IInkAPI } from './types';

export function useInkAPI() {
  const [api] = useState<IInkAPI>(() => inkAPI.getInstance());
  const [isReady, setIsReady] = useState(false);
  const [platform, setPlatform] = useState<string>('unknown');

  useEffect(() => {
    const config = inkAPI.getConfig();
    if (config) {
      setPlatform(config.platform);
      setIsReady(true);
    }
  }, []);

  const safeCall = useCallback(async <T>(
    method: keyof IInkAPI,
    ...args: any[]
  ) => {
    return inkAPI.safeCall<T>(method, ...args);
  }, []);

  const isFeatureAvailable = useCallback((feature: keyof IInkAPI) => {
    return inkAPI.isFeatureAvailable(feature);
  }, []);

  return {
    api,
    isReady,
    platform,
    safeCall,
    isFeatureAvailable
  };
}

/**
 * 初始化API系统
 * 在应用启动时调用
 */
export function initializeAPI(config?: Partial<APIConfig>) {
  console.log('🚀 Initializing API system...');
  
  const api = inkAPI.getInstance(config);
  const apiConfig = inkAPI.getConfig();
  
  console.log(`✅ API system initialized for platform: ${apiConfig?.platform}`);
  
  return {
    api,
    config: apiConfig
  };
}

/**
 * 清理API系统
 * 在应用关闭时调用
 */
export function cleanupAPI() {
  console.log('🧹 Cleaning up API system...');
  inkAPI.reset();
  console.log('✅ API system cleaned up');
}