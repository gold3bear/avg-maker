# 混合Knot检测方案使用指南

## 概述

混合Knot检测方案结合了 `buildInkAdjacency` (静态分析) 和 `inkKnotDetection` (运行时检测) 的优势，提供了最可靠和完整的knot管理解决方案。

## 核心优势

### 🎯 **双重验证机制**
- 运行时检测提供当前位置
- 静态分析验证结果有效性
- 自动修正和fallback机制

### 📊 **完整的故事分析**
- 所有knot的完整列表
- 不可达knot的识别
- 死胡同检测
- 路径查找功能

### 🛡️ **强大的错误处理**
- 多层验证和修正
- 智能缓存管理
- 优雅的降级处理

## 基本使用

### 1. 创建混合检测器

```typescript
import { createHybridKnotDetector } from '../utils/hybridKnotDetection';

// 方法1: 带初始数据创建
const detector = createHybridKnotDetector(compiledJSON, {
  enableDebugLog: true,
  enableStaticValidation: true
});

// 方法2: 先创建后设置
const detector = createHybridKnotDetector();
detector.setStoryStructure(compiledJSON);
```

### 2. 在React组件中使用

```typescript
import React, { useRef, useEffect } from 'react';
import { HybridKnotDetector } from '../utils/hybridKnotDetection';

function GameComponent({ compiledData }) {
  const hybridDetector = useRef<HybridKnotDetector>();

  useEffect(() => {
    hybridDetector.current = new HybridKnotDetector({
      enableDebugLog: process.env.NODE_ENV === 'development',
      enableStaticValidation: true,
      staticCacheTimeout: 10 * 60 * 1000 // 10分钟缓存
    });
    
    if (compiledData) {
      hybridDetector.current.setStoryStructure(compiledData);
    }
  }, [compiledData]);

  const handleChoice = (story: Story, choiceIndex: number) => {
    if (!hybridDetector.current) return;
    
    // 获取当前knot (带验证)
    const currentKnot = hybridDetector.current.getCurrentKnotName(story);
    
    // 预测目标knot (带验证)  
    const targetKnot = hybridDetector.current.detectKnotAfterChoice(
      story, currentKnot, choiceIndex
    );
    
    console.log(`选择 ${choiceIndex}: ${currentKnot} → ${targetKnot}`);
    
    // 执行选择...
    story.ChooseChoiceIndex(choiceIndex);
    
    // 创建历史记录
    const historyEntry = {
      knotName: targetKnot, // 使用验证过的knot名称
      content: collectStoryOutput(story),
      timestamp: Date.now()
    };
    
    addToHistory(historyEntry);
  };

  return (
    // JSX...
  );
}
```

## 高级功能

### 1. 故事结构分析

```typescript
// 获取完整的故事分析
const analysis = detector.getStoryAnalysis();
if (analysis) {
  console.log('故事统计:', {
    总knot数: analysis.allKnots.length,
    不可达knot: analysis.unreachableKnots,
    死胡同: analysis.deadEnds,
    连接数: analysis.links.length
  });
}

// 检查特定knot的属性
const isReachable = detector.isKnotReachable('secret_ending');
const isDeadEnd = detector.isDeadEnd('game_over');
const targets = detector.getKnotTargets('game_start');
const sources = detector.getKnotSources('final_boss');
```

### 2. 路径查找

```typescript
// 查找从起点到终点的路径
const path = detector.findPath('game_start', 'secret_ending');
if (path) {
  console.log('到达秘密结局的路径:', path);
  // 输出: ['game_start', 'character_setup', 'special_choice', 'secret_ending']
} else {
  console.log('无法到达秘密结局');
}

// 验证玩家的游戏路径
const playerPath = ['game_start', 'character_setup', 'profession_choice'];
const isValidPath = playerPath.every((knot, index) => {
  if (index === 0) return true;
  const sources = detector.getKnotSources(knot);
  return sources.includes(playerPath[index - 1]);
});
```

### 3. 开发调试工具

```typescript
// 故事完整性检查
function validateStoryIntegrity(detector: HybridKnotDetector) {
  const analysis = detector.getStoryAnalysis();
  if (!analysis) return;

  const issues = [];

  // 检查不可达的knot
  if (analysis.unreachableKnots.length > 0) {
    issues.push(`发现 ${analysis.unreachableKnots.length} 个不可达knot: ${analysis.unreachableKnots.join(', ')}`);
  }

  // 检查死胡同 (除了明确的结局)
  const unexpectedDeadEnds = analysis.deadEnds.filter(knot => 
    !knot.includes('ending') && !knot.includes('end') && knot !== 'END'
  );
  if (unexpectedDeadEnds.length > 0) {
    issues.push(`发现意外的死胡同: ${unexpectedDeadEnds.join(', ')}`);
  }

  // 检查孤立的knot (既不可达又无出口)
  const isolatedKnots = analysis.allKnots.filter(knot =>
    analysis.unreachableKnots.includes(knot) && analysis.deadEnds.includes(knot)
  );
  if (isolatedKnots.length > 0) {
    issues.push(`发现孤立的knot: ${isolatedKnots.join(', ')}`);
  }

  return issues;
}

// 性能监控
function monitorKnotDetection(detector: HybridKnotDetector) {
  const originalGetCurrentKnot = detector.getCurrentKnotName;
  const stats = { calls: 0, totalTime: 0, errors: 0 };

  detector.getCurrentKnotName = function(story, fallback) {
    const start = performance.now();
    stats.calls++;
    
    try {
      const result = originalGetCurrentKnot.call(this, story, fallback);
      stats.totalTime += performance.now() - start;
      return result;
    } catch (error) {
      stats.errors++;
      throw error;
    }
  };

  // 定期输出统计信息
  setInterval(() => {
    if (stats.calls > 0) {
      console.log('Knot检测性能统计:', {
        调用次数: stats.calls,
        平均耗时: `${(stats.totalTime / stats.calls).toFixed(2)}ms`,
        错误次数: stats.errors
      });
    }
  }, 30000); // 每30秒
}
```

### 4. 自定义验证规则

```typescript
class CustomHybridDetector extends HybridKnotDetector {
  // 自定义knot名称验证规则
  protected validateKnotName(knotName: string): boolean {
    // 基础验证
    if (!super.getRuntimeDetector().isValidKnotName(knotName)) {
      return false;
    }
    
    // 自定义规则: 拒绝测试knot在生产环境
    if (process.env.NODE_ENV === 'production' && knotName.startsWith('test_')) {
      return false;
    }
    
    // 自定义规则: 验证knot命名规范
    if (!/^[a-z][a-z0-9_]*$/.test(knotName)) {
      console.warn('Knot名称不符合命名规范:', knotName);
      return false;
    }
    
    return true;
  }
  
  // 自定义选择验证
  detectKnotAfterChoice(story: Story, currentKnot: string, choiceIndex: number, options = {}) {
    // 预检查: 验证选择索引
    if (choiceIndex < 0 || choiceIndex >= story.currentChoices.length) {
      console.error('无效的选择索引:', choiceIndex);
      return currentKnot; // 保持当前knot
    }
    
    // 预检查: 验证当前knot状态
    if (!this.validateKnotName(currentKnot)) {
      console.error('当前knot名称无效:', currentKnot);
      currentKnot = this.getRuntimeDetector().getLastKnownKnot();
    }
    
    return super.detectKnotAfterChoice(story, currentKnot, choiceIndex, options);
  }
}
```

## 最佳实践

### 1. 初始化策略

```typescript
// ✅ 推荐: 延迟初始化，避免阻塞主线程
async function initializeGameDetector(compiledDataPromise: Promise<any>) {
  const detector = new HybridKnotDetector({
    enableDebugLog: false, // 生产环境关闭
    enableStaticValidation: true,
    staticCacheTimeout: 15 * 60 * 1000 // 15分钟缓存
  });
  
  try {
    const compiledData = await compiledDataPromise;
    detector.setStoryStructure(compiledData);
    return detector;
  } catch (error) {
    console.error('Failed to initialize story structure:', error);
    // 返回仅运行时检测的版本
    return detector;
  }
}
```

### 2. 错误恢复策略

```typescript
function safeGetCurrentKnot(detector: HybridKnotDetector, story: Story): string {
  try {
    return detector.getCurrentKnotName(story);
  } catch (error) {
    console.error('Knot detection failed:', error);
    
    // 尝试从story的基础属性获取
    try {
      const basicKnot = story.state.currentPathString?.split('.')[0];
      if (basicKnot && detector.getRuntimeDetector().isValidKnotName(basicKnot)) {
        return basicKnot;
      }
    } catch (basicError) {
      console.error('Basic knot detection also failed:', basicError);
    }
    
    // 最终fallback
    return 'game_start';
  }
}
```

### 3. 性能优化策略

```typescript
// 缓存频繁查询的结果
class CachedHybridDetector extends HybridKnotDetector {
  private knotCache = new Map<string, { result: string; timestamp: number }>();
  private cacheTimeout = 5000; // 5秒缓存
  
  getCurrentKnotName(story: Story, fallbackKnot?: string): string {
    const cacheKey = `${story.state.currentPathString}-${Date.now() % 1000}`;
    const cached = this.knotCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    
    const result = super.getCurrentKnotName(story, fallbackKnot);
    this.knotCache.set(cacheKey, { result, timestamp: Date.now() });
    
    // 清理过期缓存
    if (this.knotCache.size > 100) {
      const cutoff = Date.now() - this.cacheTimeout;
      for (const [key, value] of this.knotCache.entries()) {
        if (value.timestamp < cutoff) {
          this.knotCache.delete(key);
        }
      }
    }
    
    return result;
  }
}
```

## 总结

混合Knot检测方案提供了：

1. **最高的可靠性** - 双重验证确保结果准确
2. **完整的功能** - 结合了静态分析和动态检测的所有优势  
3. **强大的扩展性** - 支持自定义规则和验证逻辑
4. **优秀的性能** - 智能缓存和优化策略
5. **丰富的分析能力** - 故事结构分析和路径查找

这是处理复杂交互式小说knot管理的最佳解决方案，特别适合需要高可靠性和完整功能的生产环境。