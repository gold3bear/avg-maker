// src/utils/inkKnotDetection.ts
// Ink引擎Knot名称检测工具
// 解决Ink引擎内部容器标识符与实际knot名称的区分问题

import { Story } from 'inkjs';

export interface KnotDetectionOptions {
  /** 是否启用详细调试日志 */
  enableDebugLog?: boolean;
  /** 自定义的knot流程映射 */
  customKnotFlowMap?: KnotFlowMap;
  /** fallback knot名称 */
  fallbackKnot?: string;
}

export interface KnotFlowMap {
  [currentKnot: string]: {
    /** 每个选择对应的目标knot */
    choices: string[];
    /** 默认目标knot（如果choices数组不够） */
    defaultTarget?: string;
  };
}

/** 默认的knot流程映射 - 基于常见AVG游戏结构 */
const DEFAULT_KNOT_FLOW_MAP: KnotFlowMap = {
  'game_start': {
    choices: ['character_setup', 'background_info'],
    defaultTarget: 'character_setup'
  },
  'background_info': {
    choices: ['character_setup'],
    defaultTarget: 'character_setup'
  },
  'character_setup': {
    choices: ['profession_choice'],
    defaultTarget: 'profession_choice'
  },
  'profession_choice': {
    choices: ['day1_start'],
    defaultTarget: 'day1_start'
  },
  'day1_start': {
    choices: ['day1_first_reaction'],
    defaultTarget: 'day1_first_reaction'
  },
  'day1_first_reaction': {
    choices: [
      'day1_direct_response',
      'day1_cautious_response', 
      'day1_analytical_first_response',
      'day1_technical_response'
    ],
    defaultTarget: 'day1_direct_response'
  }
};

/**
 * Ink Knot名称检测器类
 * 提供多种策略来准确识别当前所在的knot名称
 */
export class InkKnotDetector {
  private debugLog: boolean;
  private knotFlowMap: KnotFlowMap;
  private lastKnownKnot: string = 'game_start';

  constructor(options: KnotDetectionOptions = {}) {
    this.debugLog = options.enableDebugLog ?? false;
    this.knotFlowMap = { ...DEFAULT_KNOT_FLOW_MAP, ...options.customKnotFlowMap };
  }

  /**
   * 更新最近已知的knot名称
   */
  updateLastKnownKnot(knotName: string): void {
    if (this.isValidKnotName(knotName)) {
      this.lastKnownKnot = knotName;
      if (this.debugLog) {
        console.log('📍 Updated lastKnownKnot to:', knotName);
      }
    }
  }

  /**
   * 获取当前最近已知的knot名称
   */
  getLastKnownKnot(): string {
    return this.lastKnownKnot;
  }

  /**
   * 检查是否为有效的knot名称（过滤Ink内部容器标识符）
   */
  isValidKnotName(name: string): boolean {
    if (!name || name === '' || name === 'DEFAULT_FLOW') return false;
    // 过滤Ink内部生成的容器标识符
    if (name.match(/^c-\d+$/)) return false; // choice容器: c-0, c-1, c-2等
    if (name === 'b') return false; // 分支容器
    if (name.match(/^g-\d+$/)) return false; // 生成的容器: g-0, g-1等
    if (name.match(/^\d+$/)) return false; // 纯数字容器
    return true;
  }

  /**
   * 基于当前knot和选择索引预测目标knot
   */
  predictTargetKnot(currentKnot: string, choiceIndex: number): string {
    if (this.debugLog) {
      console.log('🔮 Predicting target knot from current:', currentKnot, 'choice index:', choiceIndex);
    }

    const flowInfo = this.knotFlowMap[currentKnot];
    if (flowInfo) {
      // 使用预定义的流程映射
      if (choiceIndex < flowInfo.choices.length) {
        const predicted = flowInfo.choices[choiceIndex];
        if (this.debugLog) {
          console.log('✅ Predicted from flow map:', predicted);
        }
        return predicted;
      } else if (flowInfo.defaultTarget) {
        if (this.debugLog) {
          console.log('✅ Using default target:', flowInfo.defaultTarget);
        }
        return flowInfo.defaultTarget;
      }
    }

    // 如果没有预定义映射，返回当前knot
    if (this.debugLog) {
      console.log('⚠️ No flow mapping found, keeping current knot:', currentKnot);
    }
    return currentKnot;
  }

  /**
   * 从Story的callStack中检测knot名称
   */
  detectFromCallStack(story: Story): string | null {
    if (!story.state.callStack || !story.state.callStack.elements) {
      return null;
    }

    if (this.debugLog) {
      console.log('🔍 Analyzing callStack with', story.state.callStack.elements.length, 'elements');
    }

    // 从callStack中查找第一个有效的knot名称（从最新的开始往回找）
    for (let i = story.state.callStack.elements.length - 1; i >= 0; i--) {
      const element = story.state.callStack.elements[i];
      if (element && element.currentPointer && element.currentPointer.container) {
        const containerName = element.currentPointer.container.name;
        if (this.debugLog) {
          console.log(`  [${i}]: container="${containerName}", valid="${this.isValidKnotName(containerName)}"`);
        }
        if (this.isValidKnotName(containerName)) {
          if (this.debugLog) {
            console.log('✅ Found valid knot from callStack:', containerName);
          }
          return containerName;
        }
      }
    }

    return null;
  }

  /**
   * 从Story的currentPointer中检测knot名称
   */
  detectFromCurrentPointer(story: Story): string | null {
    if (!story.state.currentPointer || !story.state.currentPointer.container) {
      return null;
    }

    const containerName = story.state.currentPointer.container.name;
    if (this.debugLog) {
      console.log('🔍 Checking currentPointer container:', containerName);
    }

    if (this.isValidKnotName(containerName)) {
      if (this.debugLog) {
        console.log('✅ Found valid knot from currentPointer:', containerName);
      }
      return containerName;
    }

    return null;
  }

  /**
   * 从Story的currentPathString中检测knot名称
   */
  detectFromPathString(story: Story): string | null {
    const pathString = story.state.currentPathString;
    if (!pathString || pathString === 'null' || pathString === '') {
      return null;
    }

    if (this.debugLog) {
      console.log('🔍 Analyzing pathString:', pathString);
    }

    const pathSegments = pathString.split('.');
    for (const segment of pathSegments) {
      if (this.isValidKnotName(segment)) {
        if (this.debugLog) {
          console.log('✅ Found valid knot from pathString:', segment);
        }
        return segment;
      }
    }

    return null;
  }

  /**
   * 综合检测当前knot名称
   * 使用多种策略按优先级顺序检测
   */
  getCurrentKnotName(story: Story, fallbackKnot?: string): string {
    if (this.debugLog) {
      console.log('🔍 Starting comprehensive knot detection');
      console.log('- currentPathString:', story.state.currentPathString);
      console.log('- callStack elements:', story.state.callStack?.elements?.length || 0);
      console.log('- currentPointer container:', story.state.currentPointer?.container?.name);
      console.log('- lastKnownKnot:', this.lastKnownKnot);
    }

    // 策略1: 从callStack检测
    const fromCallStack = this.detectFromCallStack(story);
    if (fromCallStack) return fromCallStack;

    // 策略2: 从currentPointer检测
    const fromPointer = this.detectFromCurrentPointer(story);
    if (fromPointer) return fromPointer;

    // 策略3: 从pathString检测
    const fromPath = this.detectFromPathString(story);
    if (fromPath) return fromPath;

    // 策略4: 使用fallback
    if (fallbackKnot && this.isValidKnotName(fallbackKnot)) {
      if (this.debugLog) {
        console.log('⚠️ Using provided fallback:', fallbackKnot);
      }
      return fallbackKnot;
    }

    // 策略5: 使用lastKnownKnot
    if (this.isValidKnotName(this.lastKnownKnot)) {
      if (this.debugLog) {
        console.log('⚠️ Using lastKnownKnot as fallback:', this.lastKnownKnot);
      }
      return this.lastKnownKnot;
    }

    // 最终fallback
    if (this.debugLog) {
      console.log('❌ All detection methods failed, using final fallback: start');
    }
    return 'start';
  }

  /**
   * 在选择执行时预测并验证knot名称
   * 这是主要的公用方法
   */
  detectKnotAfterChoice(
    story: Story, 
    currentKnot: string, 
    choiceIndex: number,
    options: { verifyAfterContinue?: boolean } = {}
  ): string {
    // 1. 预测目标knot
    const predicted = this.predictTargetKnot(currentKnot, choiceIndex);
    
    // 2. 更新跟踪状态
    this.updateLastKnownKnot(predicted);

    // 3. 如果需要验证，执行一次Continue后验证
    if (options.verifyAfterContinue && story.canContinue) {
      // 保存状态以便恢复
      const savedState = story.state.ToJson();
      
      try {
        // 执行一次Continue
        story.Continue();
        
        // 检测实际的knot
        const detected = this.getCurrentKnotName(story, predicted);
        
        // 恢复状态
        story.state.LoadJson(savedState);
        
        // 如果检测到更好的结果，使用它
        if (detected && detected !== 'start' && detected !== predicted) {
          if (this.debugLog) {
            console.log('🔄 Verification updated knot from', predicted, 'to', detected);
          }
          this.updateLastKnownKnot(detected);
          return detected;
        }
      } catch (error) {
        if (this.debugLog) {
          console.warn('⚠️ Verification failed, using prediction:', error);
        }
        // 恢复状态
        try {
          story.state.LoadJson(savedState);
        } catch (restoreError) {
          console.error('Failed to restore story state:', restoreError);
        }
      }
    }

    return predicted;
  }

  /**
   * 根据入口文件确定初始knot名称
   */
  determineInitialKnot(filePath: string): string {
    const fileName = filePath.split('/').pop()?.replace('.ink', '') || '';
    
    if (this.debugLog) {
      console.log('🎯 Determining initial knot for file:', fileName);
    }

    let initialKnot = 'game_start'; // 默认

    if (fileName === 'story') {
      initialKnot = 'game_start';
    } else if (fileName === 'game_start') {
      initialKnot = 'game_start';
    } else if (fileName === 'day_1') {
      initialKnot = 'day1_start';
    } else if (fileName === 'simple_test') {
      initialKnot = 'start';
    } else if (fileName.includes('_')) {
      // 使用文件名作为初始knot
      initialKnot = fileName;
    }

    this.updateLastKnownKnot(initialKnot);

    if (this.debugLog) {
      console.log('🎯 Initial knot determined:', initialKnot);
    }

    return initialKnot;
  }

  /**
   * 添加自定义knot流程映射
   */
  addKnotFlowMapping(knotName: string, choices: string[], defaultTarget?: string): void {
    this.knotFlowMap[knotName] = { choices, defaultTarget };
    if (this.debugLog) {
      console.log('➕ Added knot flow mapping for:', knotName);
    }
  }

  /**
   * 获取当前的knot流程映射
   */
  getKnotFlowMap(): KnotFlowMap {
    return { ...this.knotFlowMap };
  }
}

/**
 * 创建默认的knot检测器实例
 */
export function createKnotDetector(options: KnotDetectionOptions = {}): InkKnotDetector {
  return new InkKnotDetector(options);
}

/**
 * 便捷函数：快速检测knot名称
 */
export function quickDetectKnot(story: Story, fallbackKnot?: string): string {
  const detector = new InkKnotDetector({ enableDebugLog: false });
  return detector.getCurrentKnotName(story, fallbackKnot);
}

/**
 * 便捷函数：检测选择后的knot名称
 */
export function detectKnotAfterChoice(
  story: Story,
  currentKnot: string,
  choiceIndex: number,
  options: KnotDetectionOptions & { verifyAfterContinue?: boolean } = {}
): string {
  const detector = new InkKnotDetector(options);
  return detector.detectKnotAfterChoice(story, currentKnot, choiceIndex, options);
}

// 导出类型
export type { Story } from 'inkjs';