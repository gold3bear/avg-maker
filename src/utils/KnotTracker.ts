/**
 * KnotTracker - 混合架构的knot检测解决方案
 * 
 * 结合inkjs runtime与自定义knot检测逻辑，解决直接跳转时的knot识别问题
 * 基于inklecate生成的标准JSON结构进行knot信息提取
 */

import { Story } from 'inkjs';

export interface KnotInfo {
  name: string;
  visitCount: number;
  isValid: boolean;
  path: string;
  hasVisitCount: boolean;
}

export interface ExtractedKnotData {
  name: string;
  container: any[];
  hasVisitCount: boolean;
}

export class KnotTracker {
  private storyData: any;
  private currentKnot: string = 'unknown';
  private visitCounts: Map<string, number> = new Map();
  private knotInfo: Record<string, ExtractedKnotData> = {};
  private fallbackName: string = 'unknown';

  constructor(storyJson: string, filePath?: string) {
    this.storyData = JSON.parse(storyJson);
    this.knotInfo = this._extractKnotInfo();
    
    // 从文件路径提取fallback名称
    if (filePath) {
      const fileName = filePath.split('/').pop() || filePath;
      this.fallbackName = fileName.replace('.ink', '').replace(/[^a-zA-Z0-9_]/g, '_');
    }
    
    console.log('🎯 KnotTracker initialized with knots:', Object.keys(this.knotInfo));
    console.log('🎯 Fallback knot name:', this.fallbackName);
  }

  /**
   * 从inklecate生成的JSON中提取knot信息
   */
  private _extractKnotInfo(): Record<string, ExtractedKnotData> {
    const knots: Record<string, ExtractedKnotData> = {};
    
    if (this.storyData.root && Array.isArray(this.storyData.root)) {
      // inklecate在数组的最后一个元素中存储named content
      const lastItem = this.storyData.root[this.storyData.root.length - 1];
      
      if (typeof lastItem === 'object' && lastItem !== null) {
        for (const [key, value] of Object.entries(lastItem)) {
          // 跳过特殊属性（如 #f, #n 等）
          if (key.startsWith('#')) continue;
          
          // knot以数组形式存储
          if (Array.isArray(value)) {
            knots[key] = {
              name: key,
              container: value,
              hasVisitCount: this._hasVisitCountFlags(value)
            };
          }
        }
      }
    }
    
    return knots;
  }

  /**
   * 检查容器是否包含visit count标记
   */
  private _hasVisitCountFlags(container: any[]): boolean {
    if (!Array.isArray(container)) return false;
    
    const lastItem = container[container.length - 1];
    return lastItem && typeof lastItem === 'object' && lastItem['#f'];
  }

  /**
   * 推断当前knot名称
   * 结合enhanced API和fallback逻辑，改进连续跳转检测
   */
  public inferCurrentKnot(story: Story): string {
    const pointer = (story as any).state?.currentPointer;
    console.log(`🎯 KnotTracker DEBUG: currentKnot=${this.currentKnot}, pointer exists=${!!pointer}`);
    if (pointer) {
      console.log(`🎯 KnotTracker DEBUG: path="${pointer.container?.path}", name="${pointer.container?.name}"`);
    }
    // 方法1: 尝试使用enhanced API
    try {
      const knotInfo = (story as any).getCurrentKnotInfo?.();
      if (knotInfo && knotInfo.name && knotInfo.name !== 'unknown') {
        this.currentKnot = knotInfo.name;
        this._recordVisit(knotInfo.name);
        return knotInfo.name;
      }
    } catch (e) {
      // Enhanced API失败，继续fallback
    }

    // 方法2: 从story状态和路径推断
    if (pointer && pointer.container && pointer.container.path) {
      const pathStr = pointer.container.path.toString();
      
      // 跳过undefined或空路径
      if (pathStr === 'undefined' || pathStr === 'null' || pathStr === '') {
        console.log(`🎯 KnotTracker: Skipping invalid path: ${pathStr}`);
      } else {
        // 改进的路径匹配：更精确的knot检测
        for (const knotName of Object.keys(this.knotInfo)) {
          // 检查完全匹配或路径开头匹配
          if (pathStr === knotName || pathStr.startsWith(knotName + '.') || pathStr.startsWith(knotName + '/')) {
            // 确认这确实是一个不同的knot
            if (this.currentKnot !== knotName) {
              console.log(`🎯 KnotTracker: Knot transition detected via path: ${this.currentKnot} -> ${knotName}`);
              this.currentKnot = knotName;
              this._recordVisit(knotName);
            }
            return knotName;
          }
        }
        
        // 如果路径存在但没有匹配到knot，可能是在knot内部
        console.log(`🎯 KnotTracker: Path found but no knot match: ${pathStr}, keeping current: ${this.currentKnot}`);
      }
    }

    // 方法2.5: 检查container的name属性
    if (pointer && pointer.container && pointer.container.name) {
      const containerName = pointer.container.name;
      if (this.knotInfo[containerName]) {
        if (this.currentKnot !== containerName) {
          console.log(`🎯 KnotTracker: Knot transition detected via container name: ${this.currentKnot} -> ${containerName}`);
          this.currentKnot = containerName;
          this._recordVisit(containerName);
        }
        return containerName;
      }
    }

    // 方法3: 检查callstack中的knot信息
    try {
      const callStack = (story as any).state?.callStack;
      if (callStack && callStack.elements && callStack.elements.length > 0) {
        const topElement = callStack.elements[callStack.elements.length - 1];
        if (topElement.currentPointer && topElement.currentPointer.container) {
          const containerPath = topElement.currentPointer.container.path?.toString();
          if (containerPath) {
            for (const knotName of Object.keys(this.knotInfo)) {
              if (containerPath === knotName || containerPath.startsWith(knotName + '.')) {
                this.currentKnot = knotName;
                this._recordVisit(knotName);
                return knotName;
              }
            }
          }
        }
      }
    } catch (e) {
      // CallStack检查失败，继续下一种方法
    }

    // 方法4: 保持之前检测到的knot（适用于Continue()后pointer为null的情况）
    return this.currentKnot;
  }

  /**
   * 获取当前knot的详细信息
   */
  public getCurrentKnotInfo(story: Story): KnotInfo {
    const inferredKnot = this.inferCurrentKnot(story);
    const knot = this.knotInfo[inferredKnot];
    
    // 如果推断结果是unknown，使用fallback名称显示，但标记为无效
    const displayName = inferredKnot === 'unknown' ? this.fallbackName : inferredKnot;
    const isValid = inferredKnot !== 'unknown' && !!knot;
    
    return {
      name: displayName,
      visitCount: this.visitCounts.get(inferredKnot) || 0,
      isValid: isValid,
      path: this._getKnotPath(story, inferredKnot),
      hasVisitCount: knot?.hasVisitCount || false
    };
  }

  /**
   * 获取所有可用的knot名称
   */
  public getAllKnotNames(): string[] {
    return Object.keys(this.knotInfo)
      .filter(name => name !== 'global decl') // 过滤全局声明
      .sort();
  }

  /**
   * 预测选择的目标knot
   */
  public predictChoiceTarget(story: Story, choiceIndex: number): { targetKnot: string; confidence: number } {
    if (choiceIndex < 0 || choiceIndex >= story.currentChoices.length) {
      return { targetKnot: 'unknown', confidence: 0 };
    }

    // 这里可以实现更复杂的选择目标预测逻辑
    // 目前返回基本信息
    return { targetKnot: 'unknown', confidence: 0.5 };
  }

  /**
   * 重置visit counts（用于游戏重新开始）
   */
  public resetVisitCounts(): void {
    this.visitCounts.clear();
    this.currentKnot = 'unknown';
  }

  /**
   * 记录knot访问
   */
  private _recordVisit(knotName: string): void {
    const current = this.visitCounts.get(knotName) || 0;
    this.visitCounts.set(knotName, current + 1);
  }

  /**
   * 获取knot的路径信息
   */
  private _getKnotPath(story: Story, knotName: string): string {
    const pointer = (story as any).state?.currentPointer;
    if (pointer && pointer.container && pointer.container.path) {
      return pointer.container.path.toString();
    }
    return knotName;
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo(): any {
    return {
      availableKnots: Object.keys(this.knotInfo),
      currentKnot: this.currentKnot,
      visitCounts: Object.fromEntries(this.visitCounts),
      totalKnots: Object.keys(this.knotInfo).length
    };
  }
}