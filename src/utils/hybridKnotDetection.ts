// src/utils/hybridKnotDetection.ts
// 混合knot检测方案 - 结合静态分析和运行时检测的优势

import { InkKnotDetector, KnotDetectionOptions } from './inkKnotDetection';
import { buildStoryGraph, type GraphNode, type GraphLink } from './storyGraph';
import { Story } from 'inkjs';

export interface HybridKnotDetectionOptions extends KnotDetectionOptions {
  /** 是否启用静态验证 */
  enableStaticValidation?: boolean;
  /** 静态分析缓存时间 (ms) */
  staticCacheTimeout?: number;
}

export interface StoryStructure {
  nodes: GraphNode[];
  links: GraphLink[];
  allKnots: string[];
  unreachableKnots: string[];
  deadEnds: string[];
}

/**
 * 混合Knot检测器
 * 结合静态分析(buildStoryGraph)和运行时检测(InkKnotDetector)的优势
 */
export class HybridKnotDetector {
  private runtimeDetector: InkKnotDetector;
  private staticStructure: StoryStructure | null = null;
  private staticCacheTime = 0;
  private options: HybridKnotDetectionOptions;

  constructor(options: HybridKnotDetectionOptions = {}) {
    this.options = {
      enableStaticValidation: true,
      staticCacheTimeout: 5 * 60 * 1000, // 5分钟缓存
      ...options
    };
    
    this.runtimeDetector = new InkKnotDetector(options);
  }

  /**
   * 设置静态故事结构
   * @param compiledJSON 编译后的Ink JSON数据
   */
  setStoryStructure(compiledJSON: any): void {
    try {
      const { nodes, links } = buildStoryGraph(compiledJSON);
      const allKnots = nodes.map(n => n.id);
      
      // 分析不可达的knot
      const reachableKnots = new Set<string>();
      const findReachable = (knot: string) => {
        if (reachableKnots.has(knot)) return;
        reachableKnots.add(knot);
        
        links
          .filter(link => link.source === knot)
          .forEach(link => findReachable(link.target));
      };
      
      // 从可能的入口点开始查找
      const entryPoints = ['game_start', 'start', nodes[0]?.id].filter(Boolean);
      entryPoints.forEach(entry => {
        if (allKnots.includes(entry)) {
          findReachable(entry);
        }
      });
      
      const unreachableKnots = allKnots.filter(knot => !reachableKnots.has(knot));
      
      // 找出死胡同 (没有出口的knot)
      const deadEnds = allKnots.filter(knot => 
        !links.some(link => link.source === knot)
      );

      this.staticStructure = {
        nodes,
        links,
        allKnots,
        unreachableKnots,
        deadEnds
      };
      
      this.staticCacheTime = Date.now();
      
      if (this.options.enableDebugLog) {
        console.log('📊 Static story structure updated:', {
          totalKnots: allKnots.length,
          reachableKnots: reachableKnots.size,
          unreachableKnots: unreachableKnots.length,
          deadEnds: deadEnds.length
        });
      }
    } catch (error) {
      console.error('Failed to build static story structure:', error);
      this.staticStructure = null;
    }
  }

  /**
   * 检查静态缓存是否有效
   */
  private isStaticCacheValid(): boolean {
    if (!this.staticStructure) return false;
    
    const cacheAge = Date.now() - this.staticCacheTime;
    return cacheAge < (this.options.staticCacheTimeout || 300000);
  }

  /**
   * 验证knot名称是否在静态结构中存在
   */
  private validateKnotExistence(knotName: string): boolean {
    if (!this.options.enableStaticValidation || !this.isStaticCacheValid()) {
      return true; // 如果没有静态验证或缓存过期，假定有效
    }
    
    return this.staticStructure!.allKnots.includes(knotName);
  }

  /**
   * 获取所有有效的knot名称
   */
  getAllKnots(): string[] {
    if (!this.isStaticCacheValid()) {
      console.warn('Static structure cache is invalid, returning empty array');
      return [];
    }
    
    return [...this.staticStructure!.allKnots];
  }

  /**
   * 获取故事结构分析
   */
  getStoryAnalysis(): StoryStructure | null {
    return this.isStaticCacheValid() ? { ...this.staticStructure! } : null;
  }

  /**
   * 混合检测当前knot名称
   * 结合运行时检测和静态验证
   */
  getCurrentKnotName(story: Story, fallbackKnot?: string): string {
    // 1. 使用运行时检测器获取候选knot
    const runtimeKnot = this.runtimeDetector.getCurrentKnotName(story, fallbackKnot);
    
    // 2. 如果启用静态验证，验证候选knot
    if (this.options.enableStaticValidation && this.isStaticCacheValid()) {
      if (this.validateKnotExistence(runtimeKnot)) {
        if (this.options.enableDebugLog) {
          console.log('✅ Hybrid detection - runtime knot validated:', runtimeKnot);
        }
        return runtimeKnot;
      } else {
        // 运行时检测的结果不在静态结构中，尝试修正
        if (this.options.enableDebugLog) {
          console.warn('⚠️ Runtime knot not found in static structure:', runtimeKnot);
        }
        
        // 尝试使用lastKnownKnot
        const lastKnown = this.runtimeDetector.getLastKnownKnot();
        if (this.validateKnotExistence(lastKnown)) {
          if (this.options.enableDebugLog) {
            console.log('🔄 Using validated lastKnownKnot:', lastKnown);
          }
          return lastKnown;
        }
        
        // 最后使用fallback
        if (fallbackKnot && this.validateKnotExistence(fallbackKnot)) {
          return fallbackKnot;
        }
        
        // 使用静态结构中的第一个knot作为最后手段
        const firstKnot = this.staticStructure!.allKnots[0];
        if (firstKnot) {
          if (this.options.enableDebugLog) {
            console.log('🆘 Using first knot from static structure:', firstKnot);
          }
          return firstKnot;
        }
      }
    }
    
    // 如果没有静态验证或验证失败，返回运行时结果
    return runtimeKnot;
  }

  /**
   * 混合检测选择后的knot
   */
  detectKnotAfterChoice(
    story: Story,
    currentKnot: string,
    choiceIndex: number,
    options: { verifyAfterContinue?: boolean } = {}
  ): string {
    // 1. 验证当前knot的有效性
    if (this.options.enableStaticValidation && !this.validateKnotExistence(currentKnot)) {
      console.warn('Current knot not found in static structure:', currentKnot);
      currentKnot = this.runtimeDetector.getLastKnownKnot();
    }
    
    // 2. 使用运行时检测器预测目标
    const predictedTarget = this.runtimeDetector.detectKnotAfterChoice(
      story, currentKnot, choiceIndex, options
    );
    
    // 3. 验证预测结果
    if (this.options.enableStaticValidation && this.isStaticCacheValid()) {
      if (this.validateKnotExistence(predictedTarget)) {
        return predictedTarget;
      } else {
        console.warn('Predicted target not found in static structure:', predictedTarget);
        
        // 尝试从静态结构中找到当前knot的可能目标
        const possibleTargets = this.staticStructure!.links
          .filter(link => link.source === currentKnot)
          .map(link => link.target);
          
        if (possibleTargets.length > 0) {
          const target = possibleTargets[Math.min(choiceIndex, possibleTargets.length - 1)];
          if (this.options.enableDebugLog) {
            console.log('🔄 Using static structure target:', target);
          }
          return target;
        }
      }
    }
    
    return predictedTarget;
  }

  /**
   * 检查knot是否可达
   */
  isKnotReachable(knotName: string): boolean {
    if (!this.isStaticCacheValid()) return true;
    
    return !this.staticStructure!.unreachableKnots.includes(knotName);
  }

  /**
   * 检查knot是否为死胡同
   */
  isDeadEnd(knotName: string): boolean {
    if (!this.isStaticCacheValid()) return false;
    
    return this.staticStructure!.deadEnds.includes(knotName);
  }

  /**
   * 获取knot的所有可能目标
   */
  getKnotTargets(knotName: string): string[] {
    if (!this.isStaticCacheValid()) return [];
    
    return this.staticStructure!.links
      .filter(link => link.source === knotName)
      .map(link => link.target);
  }

  /**
   * 获取到达某个knot的所有可能来源
   */
  getKnotSources(knotName: string): string[] {
    if (!this.isStaticCacheValid()) return [];
    
    return this.staticStructure!.links
      .filter(link => link.target === knotName)
      .map(link => link.source);
  }

  /**
   * 查找从源knot到目标knot的路径
   */
  findPath(fromKnot: string, toKnot: string): string[] | null {
    if (!this.isStaticCacheValid()) return null;
    
    const visited = new Set<string>();
    const queue: Array<{ knot: string; path: string[] }> = [{ knot: fromKnot, path: [fromKnot] }];
    
    while (queue.length > 0) {
      const { knot, path } = queue.shift()!;
      
      if (knot === toKnot) {
        return path;
      }
      
      if (visited.has(knot)) continue;
      visited.add(knot);
      
      const targets = this.getKnotTargets(knot);
      targets.forEach(target => {
        if (!visited.has(target)) {
          queue.push({ knot: target, path: [...path, target] });
        }
      });
    }
    
    return null; // 未找到路径
  }

  /**
   * 获取运行时检测器的引用（用于高级操作）
   */
  getRuntimeDetector(): InkKnotDetector {
    return this.runtimeDetector;
  }

  /**
   * 重置所有缓存和状态
   */
  reset(): void {
    this.staticStructure = null;
    this.staticCacheTime = 0;
    // 注意：不重置runtimeDetector的状态，因为它可能包含重要的跟踪信息
  }
}

/**
 * 创建混合knot检测器的便捷函数
 */
export function createHybridKnotDetector(
  compiledJSON?: any,
  options: HybridKnotDetectionOptions = {}
): HybridKnotDetector {
  const detector = new HybridKnotDetector(options);
  
  if (compiledJSON) {
    detector.setStoryStructure(compiledJSON);
  }
  
  return detector;
}