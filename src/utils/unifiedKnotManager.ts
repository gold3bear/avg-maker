// src/utils/unifiedKnotManager.ts
// 统一Knot管理器 - 整合所有knot获取方案的优势

import { InkKnotDetector, type KnotDetectionOptions } from './inkKnotDetection';
import { buildStoryGraph, type GraphNode, type GraphLink } from './storyGraph';
import { extractKnots, extractVariables } from './inkLanguage';
import { Story } from 'inkjs';

export interface KnotInfo {
  /** knot名称 */
  name: string;
  /** 定义该knot的文件路径 */
  filePath?: string;
  /** 在文件中的行号 */
  lineNumber?: number;
  /** 是否为当前活跃的knot */
  isCurrent?: boolean;
  /** 是否可达 */
  isReachable?: boolean;
  /** 连接到此knot的其他knot */
  sources?: string[];
  /** 此knot连接到的其他knot */
  targets?: string[];
}

export interface SourceFileInfo {
  filePath: string;
  content: string;
  knots: string[];
  variables: string[];
  lastModified?: number;
}

export interface CompiledStoryInfo {
  compiledData: any;
  allKnots: string[];
  structure: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  lastCompiled?: number;
}

export interface UnifiedKnotManagerOptions extends KnotDetectionOptions {
  /** 是否启用源文件缓存 */
  enableSourceCache?: boolean;
  /** 源文件缓存超时时间 (ms) */
  sourceCacheTimeout?: number;
  /** 是否启用编译数据缓存 */
  enableCompiledCache?: boolean;
  /** 编译数据缓存超时时间 (ms) */
  compiledCacheTimeout?: number;
}

/**
 * 统一Knot管理器
 * 集成所有knot获取方案，提供统一的API接口
 */
export class UnifiedKnotManager {
  private runtimeDetector: InkKnotDetector;
  private sourceCache = new Map<string, SourceFileInfo>();
  private compiledCache: CompiledStoryInfo | null = null;
  private options: UnifiedKnotManagerOptions;

  constructor(options: UnifiedKnotManagerOptions = {}) {
    this.options = {
      enableSourceCache: true,
      sourceCacheTimeout: 5 * 60 * 1000, // 5分钟
      enableCompiledCache: true,
      compiledCacheTimeout: 10 * 60 * 1000, // 10分钟
      ...options
    };

    this.runtimeDetector = new InkKnotDetector(options);
  }

  /**
   * 添加源文件信息到缓存
   */
  addSourceFile(filePath: string, content: string): SourceFileInfo {
    const knots = extractKnots(content);
    const variables = extractVariables(content);
    
    const sourceInfo: SourceFileInfo = {
      filePath,
      content,
      knots,
      variables,
      lastModified: Date.now()
    };

    if (this.options.enableSourceCache) {
      this.sourceCache.set(filePath, sourceInfo);
    }

    return sourceInfo;
  }

  /**
   * 设置编译后的故事数据
   */
  setCompiledStory(compiledData: any): CompiledStoryInfo {
    try {
      const structure = buildStoryGraph(compiledData);
      const allKnots = structure.nodes.map(n => n.id);

      const compiledInfo: CompiledStoryInfo = {
        compiledData,
        allKnots,
        structure,
        lastCompiled: Date.now()
      };

      if (this.options.enableCompiledCache) {
        this.compiledCache = compiledInfo;
      }

      // 更新运行时检测器的流程映射
      this.updateRuntimeDetectorMapping(structure.links);

      return compiledInfo;
    } catch (error) {
      console.error('Failed to process compiled story data:', error);
      throw error;
    }
  }

  /**
   * 基于编译结构更新运行时检测器的流程映射
   */
  private updateRuntimeDetectorMapping(links: GraphLink[]): void {
    const linksBySource = new Map<string, string[]>();
    
    links.forEach(link => {
      if (!linksBySource.has(link.source)) {
        linksBySource.set(link.source, []);
      }
      linksBySource.get(link.source)!.push(link.target);
    });

    linksBySource.forEach((targets, source) => {
      this.runtimeDetector.addKnotFlowMapping(source, targets, targets[0]);
    });
  }

  /**
   * 检查缓存是否有效
   */
  private isSourceCacheValid(filePath: string): boolean {
    if (!this.options.enableSourceCache) return false;
    
    const cached = this.sourceCache.get(filePath);
    if (!cached) return false;

    const age = Date.now() - (cached.lastModified || 0);
    return age < (this.options.sourceCacheTimeout || 300000);
  }

  private isCompiledCacheValid(): boolean {
    if (!this.options.enableCompiledCache || !this.compiledCache) return false;

    const age = Date.now() - (this.compiledCache.lastCompiled || 0);
    return age < (this.options.compiledCacheTimeout || 600000);
  }

  /**
   * 获取所有可用的knot名称
   * 优先级: 编译数据 > 源文件缓存
   */
  getAllKnots(): string[] {
    // 优先使用编译数据
    if (this.isCompiledCacheValid()) {
      return [...this.compiledCache!.allKnots];
    }

    // 回退到源文件缓存
    const allKnots = new Set<string>();
    this.sourceCache.forEach(sourceInfo => {
      sourceInfo.knots.forEach(knot => allKnots.add(knot));
    });

    return Array.from(allKnots).sort();
  }

  /**
   * 获取指定文件中的knot列表
   */
  getKnotsInFile(filePath: string): string[] {
    if (this.isSourceCacheValid(filePath)) {
      return [...this.sourceCache.get(filePath)!.knots];
    }
    return [];
  }

  /**
   * 获取详细的knot信息
   */
  getKnotInfo(knotName: string): KnotInfo {
    const info: KnotInfo = { name: knotName };

    // 从源文件缓存获取定义信息
    for (const [filePath, sourceInfo] of this.sourceCache.entries()) {
      if (sourceInfo.knots.includes(knotName)) {
        info.filePath = filePath;
        // 计算行号
        const lines = sourceInfo.content.split('\n');
        const lineIndex = lines.findIndex(line => 
          line.includes(`=== ${knotName} ===`)
        );
        if (lineIndex >= 0) {
          info.lineNumber = lineIndex + 1;
        }
        break;
      }
    }

    // 从编译数据获取结构信息
    if (this.isCompiledCacheValid()) {
      const { structure } = this.compiledCache!;
      
      info.isReachable = structure.nodes.some(node => node.id === knotName);
      info.sources = structure.links
        .filter(link => link.target === knotName)
        .map(link => link.source);
      info.targets = structure.links
        .filter(link => link.source === knotName)
        .map(link => link.target);
    }

    return info;
  }

  /**
   * 获取当前运行时的knot名称
   * 使用多策略检测和验证
   */
  getCurrentKnot(story: Story): KnotInfo {
    const currentName = this.runtimeDetector.getCurrentKnotName(story);
    const info = this.getKnotInfo(currentName);
    info.isCurrent = true;

    // 验证当前knot是否在有效列表中
    const allKnots = this.getAllKnots();
    if (allKnots.length > 0 && !allKnots.includes(currentName)) {
      console.warn(`Current knot "${currentName}" not found in valid knots list`);
      info.name = this.runtimeDetector.getLastKnownKnot();
    }

    return info;
  }

  /**
   * 预测选择后的目标knot
   */
  predictKnotAfterChoice(
    story: Story, 
    currentKnot: string, 
    choiceIndex: number
  ): KnotInfo {
    const targetName = this.runtimeDetector.detectKnotAfterChoice(
      story, currentKnot, choiceIndex
    );
    
    const info = this.getKnotInfo(targetName);
    
    // 验证预测结果
    const allKnots = this.getAllKnots();
    if (allKnots.length > 0 && !allKnots.includes(targetName)) {
      console.warn(`Predicted target "${targetName}" not found in valid knots list`);
    }

    return info;
  }

  /**
   * 搜索knot (支持模糊匹配)
   */
  searchKnots(query: string): KnotInfo[] {
    const allKnots = this.getAllKnots();
    const lowerQuery = query.toLowerCase();
    
    return allKnots
      .filter(knot => knot.toLowerCase().includes(lowerQuery))
      .map(knot => this.getKnotInfo(knot))
      .sort((a, b) => {
        // 精确匹配优先
        const aExact = a.name.toLowerCase() === lowerQuery;
        const bExact = b.name.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // 开头匹配优先
        const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
        const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // 字母序
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * 获取故事结构分析
   */
  getStoryStructure(): {
    nodes: GraphNode[];
    links: GraphLink[];
    stats: {
      totalKnots: number;
      totalConnections: number;
      unreachableKnots: string[];
      deadEnds: string[];
      entryPoints: string[];
    };
  } | null {
    if (!this.isCompiledCacheValid()) {
      return null;
    }

    const { structure } = this.compiledCache!;
    const { nodes, links } = structure;

    // 计算统计信息
    const reachableKnots = new Set<string>();
    const sourceKnots = new Set(links.map(l => l.source));
    const targetKnots = new Set(links.map(l => l.target));
    const allKnotNames = nodes.map(n => n.id);

    // 找到入口点（没有源连接的knot）
    const entryPoints = allKnotNames.filter(knot => !targetKnots.has(knot));
    
    // 从入口点开始找所有可达的knot
    const findReachable = (knot: string) => {
      if (reachableKnots.has(knot)) return;
      reachableKnots.add(knot);
      
      links
        .filter(link => link.source === knot)
        .forEach(link => findReachable(link.target));
    };

    entryPoints.forEach(entry => findReachable(entry));

    const unreachableKnots = allKnotNames.filter(knot => !reachableKnots.has(knot));
    const deadEnds = allKnotNames.filter(knot => !sourceKnots.has(knot));

    return {
      nodes,
      links,
      stats: {
        totalKnots: nodes.length,
        totalConnections: links.length,
        unreachableKnots,
        deadEnds,
        entryPoints
      }
    };
  }

  /**
   * 验证故事的完整性
   */
  validateStoryIntegrity(): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const structure = this.getStoryStructure();
    if (!structure) {
      issues.push('No compiled story structure available for validation');
      return { isValid: false, issues, warnings, suggestions };
    }

    const { stats } = structure;

    // 检查入口点
    if (stats.entryPoints.length === 0) {
      issues.push('No entry points found - story may be unreachable');
    } else if (stats.entryPoints.length > 3) {
      warnings.push(`Many entry points (${stats.entryPoints.length}) - consider consolidating`);
    }

    // 检查不可达的knot
    if (stats.unreachableKnots.length > 0) {
      warnings.push(`Found ${stats.unreachableKnots.length} unreachable knots: ${stats.unreachableKnots.join(', ')}`);
      suggestions.push('Review unreachable knots and add connections or remove unused content');
    }

    // 检查死胡同（排除明确的结局knot）
    const unexpectedDeadEnds = stats.deadEnds.filter(knot => 
      !knot.toLowerCase().includes('end') && 
      !knot.toLowerCase().includes('ending') &&
      knot !== 'DONE' && knot !== 'END'
    );
    
    if (unexpectedDeadEnds.length > 0) {
      warnings.push(`Found unexpected dead ends: ${unexpectedDeadEnds.join(', ')}`);
      suggestions.push('Consider adding choices or endings to dead-end knots');
    }

    // 检查连接密度
    const avgConnectionsPerKnot = stats.totalConnections / stats.totalKnots;
    if (avgConnectionsPerKnot < 1.2) {
      warnings.push('Story structure seems linear - consider adding more branching');
    } else if (avgConnectionsPerKnot > 3) {
      warnings.push('Story structure is highly complex - consider simplifying some branches');
    }

    const isValid = issues.length === 0;
    return { isValid, issues, warnings, suggestions };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.sourceCache.clear();
    this.compiledCache = null;
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    sourceFiles: number;
    sourceCacheSize: number;
    hasCompiledCache: boolean;
    compiledCacheAge: number;
  } {
    return {
      sourceFiles: this.sourceCache.size,
      sourceCacheSize: Array.from(this.sourceCache.values())
        .reduce((total, info) => total + info.content.length, 0),
      hasCompiledCache: this.compiledCache !== null,
      compiledCacheAge: this.compiledCache 
        ? Date.now() - (this.compiledCache.lastCompiled || 0)
        : 0
    };
  }

  /**
   * 获取运行时检测器实例（用于高级操作）
   */
  getRuntimeDetector(): InkKnotDetector {
    return this.runtimeDetector;
  }
}

/**
 * 创建统一knot管理器的便捷函数
 */
export function createUnifiedKnotManager(
  options: UnifiedKnotManagerOptions = {}
): UnifiedKnotManager {
  return new UnifiedKnotManager(options);
}