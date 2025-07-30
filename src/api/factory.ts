// API工厂 - 根据平台创建对应的API实例
import type { IInkAPI, APIConfig } from './types';
import { detectPlatform, getPlatformConfig } from './platform';
import { ElectronAPIAdapter } from './electron-adapter';
import { BrowserAPIAdapter } from './browser-adapter';

/**
 * API工厂类
 * 负责根据平台自动创建合适的API实例
 */
export class APIFactory {
  private static instance: IInkAPI | null = null;
  private static config: APIConfig | null = null;

  /**
   * 创建API实例
   */
  static createAPI(config?: Partial<APIConfig>): IInkAPI {
    const platform = detectPlatform();
    const fullConfig = {
      ...getPlatformConfig(platform),
      ...config
    };

    switch (platform) {
      case 'electron':
        console.log('🔧 Creating Electron API adapter');
        return new ElectronAPIAdapter();
      
      case 'browser':
        console.log('🌐 Creating Browser API adapter');
        return new BrowserAPIAdapter(fullConfig);
      
      default:
        console.warn('⚠️ Unknown platform, falling back to Browser API');
        return new BrowserAPIAdapter(fullConfig);
    }
  }

  /**
   * 获取单例API实例
   */
  static getInstance(config?: Partial<APIConfig>): IInkAPI {
    if (!this.instance) {
      this.instance = this.createAPI(config);
      this.config = {
        ...getPlatformConfig(),
        ...config
      };
      console.log('📦 API instance created:', this.config.platform);
    }
    return this.instance;
  }

  /**
   * 重置API实例（主要用于测试）
   */
  static reset(): void {
    if (this.instance && 'dispose' in this.instance) {
      (this.instance as any).dispose();
    }
    this.instance = null;
    this.config = null;
    console.log('🔄 API instance reset');
  }

  /**
   * 获取当前配置
   */
  static getConfig(): APIConfig | null {
    return this.config;
  }

  /**
   * 检查功能是否可用
   */
  static isFeatureAvailable(feature: keyof IInkAPI): boolean {
    const instance = this.getInstance();
    return typeof instance[feature] === 'function';
  }

  /**
   * 安全调用API方法
   */
  static async safeCall<T>(
    method: keyof IInkAPI,
    ...args: any[]
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const instance = this.getInstance();
      const fn = instance[method] as Function;
      
      if (typeof fn !== 'function') {
        return {
          success: false,
          error: `Method ${String(method)} not available on this platform`
        };
      }

      const result = await fn.apply(instance, args);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}