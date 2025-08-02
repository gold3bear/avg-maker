# InkJS Fork Implementation Plan

基于对inkjs源码的深入分析，我制定了以下具体的增强实施方案：

## 🎯 核心问题分析

通过分析源码，我发现了当前knot检测困难的根本原因：
1. `currentPointer` 指向的是容器中的具体位置，而不是knot名称
2. `callStack` 中的容器路径包含内部标识符，需要解析才能获得真实knot名称
3. Story类缺少直接暴露当前knot信息的API

## 🔧 具体增强方案

### 阶段1：核心API增强（最小改动，最大收益）

#### 1.1 在Story类中添加knot检测方法

```typescript
// 在 src/engine/Story.ts 中添加以下方法：

export class Story extends InkObject {
  // ... 现有代码 ...

  /**
   * 获取当前knot的名称
   * 这是我们最需要的核心功能
   */
  public getCurrentKnotName(): string {
    const pointer = this.state.currentPointer;
    if (pointer.isNull || !pointer.container) {
      return 'unknown';
    }

    // 从容器路径中提取knot名称
    const path = pointer.container.path;
    if (!path || path.length === 0) {
      return 'unknown';
    }

    // 遍历路径，寻找第一个非内部容器名称
    for (const component of path.components) {
      const name = component.toString();
      // 过滤掉内部容器标识符（c-0, c-1, b, g-0等）
      if (name && !this._isInternalContainerName(name)) {
        return name;
      }
    }

    // 如果没有找到有效的knot名称，尝试从父容器获取
    return this._extractKnotFromContainer(pointer.container);
  }

  /**
   * 获取当前knot的详细信息
   */
  public getCurrentKnotInfo(): KnotInfo {
    const knotName = this.getCurrentKnotName();
    const pointer = this.state.currentPointer;
    
    return {
      name: knotName,
      container: pointer.container,
      path: pointer.container?.path?.toString() || '',
      visitCount: this.state.VisitCountForContainer(pointer.container),
      tags: this._getCurrentKnotTags(),
      isValid: !this._isInternalContainerName(knotName)
    };
  }

  /**
   * 预测选择的目标knot
   */
  public predictChoiceTarget(choiceIndex: number): ChoicePrediction {
    if (choiceIndex < 0 || choiceIndex >= this.currentChoices.length) {
      return {
        targetKnot: 'unknown',
        confidence: 0,
        valid: false
      };
    }

    const choice = this.currentChoices[choiceIndex];
    const targetPath = choice.targetPath;
    
    if (!targetPath) {
      return {
        targetKnot: 'unknown',
        confidence: 0,
        valid: false
      };
    }

    // 分析目标路径，预测knot名称
    const predictedKnot = this._extractKnotFromPath(targetPath);
    const confidence = this._calculatePredictionConfidence(targetPath);

    return {
      targetKnot: predictedKnot,
      confidence: confidence,
      valid: confidence > 0.5,
      path: targetPath.toString()
    };
  }

  /**
   * 获取所有可用的knot名称
   */
  public getAllKnotNames(): string[] {
    const knots: string[] = [];
    const namedContent = this.mainContentContainer.namedContent;
    
    for (const [name, container] of namedContent.entries()) {
      if (container instanceof Container && !this._isInternalContainerName(name)) {
        knots.push(name);
      }
    }
    
    return knots.sort();
  }

  /**
   * 获取knot的详细信息
   */
  public getKnotInfo(knotName: string): KnotInfo | null {
    const container = this.KnotContainerWithName(knotName);
    if (!container) {
      return null;
    }

    return {
      name: knotName,
      container: container,
      path: container.path.toString(),
      visitCount: this.state.VisitCountForContainer(container),
      tags: this._getKnotTags(container),
      isValid: true
    };
  }

  // === 私有辅助方法 ===

  /**
   * 判断是否为内部容器名称
   */
  private _isInternalContainerName(name: string): boolean {
    if (!name) return true;
    
    // 过滤Ink引擎内部使用的容器标识符
    const internalPatterns = [
      /^c-\d+$/, // c-0, c-1, c-2...
      /^g-\d+$/, // g-0, g-1, g-2...
      /^b$/,     // b
      /^[0-9]+$/ // 纯数字
    ];
    
    return internalPatterns.some(pattern => pattern.test(name));
  }

  /**
   * 从容器中提取knot名称
   */
  private _extractKnotFromContainer(container: Container | null): string {
    if (!container) return 'unknown';
    
    // 尝试从容器名称获取
    if (container.name && !this._isInternalContainerName(container.name)) {
      return container.name;
    }
    
    // 尝试从路径获取
    const path = container.path;
    if (path && path.length > 0) {
      for (const component of path.components) {
        const name = component.toString();
        if (!this._isInternalContainerName(name)) {
          return name;
        }
      }
    }
    
    // 尝试从父容器获取
    let parent = container.parent;
    while (parent) {
      if (parent.name && !this._isInternalContainerName(parent.name)) {
        return parent.name;
      }
      parent = parent.parent;
    }
    
    return 'unknown';
  }

  /**
   * 从路径中提取knot名称
   */
  private _extractKnotFromPath(path: Path): string {
    if (!path || path.length === 0) return 'unknown';
    
    for (const component of path.components) {
      const name = component.toString();
      if (!this._isInternalContainerName(name)) {
        return name;
      }
    }
    
    return 'unknown';
  }

  /**
   * 获取当前knot的标签
   */
  private _getCurrentKnotTags(): string[] {
    // 实现标签提取逻辑
    return [];
  }

  /**
   * 获取指定容器的标签
   */
  private _getKnotTags(container: Container): string[] {
    // 实现标签提取逻辑
    return [];
  }

  /**
   * 计算预测的置信度
   */
  private _calculatePredictionConfidence(path: Path): number {
    // 根据路径复杂度和已知信息计算置信度
    if (!path || path.length === 0) return 0;
    
    // 简单的置信度计算：路径越简单，置信度越高
    const complexity = path.components.length;
    return Math.max(0.1, 1.0 - (complexity * 0.1));
  }
}

// 新增类型定义
export interface KnotInfo {
  name: string;
  container: Container | null;
  path: string;
  visitCount: number;
  tags: string[];
  isValid: boolean;
}

export interface ChoicePrediction {
  targetKnot: string;
  confidence: number;
  valid: boolean;
  path?: string;
}
```

#### 1.2 在StoryState中添加支持方法

```typescript
// 在 src/engine/StoryState.ts 中添加：

export class StoryState {
  // ... 现有代码 ...

  /**
   * 获取当前执行路径的详细信息
   */
  public getCurrentExecutionPath(): ExecutionPathInfo {
    const callStackElements = this.callStack.elements;
    const path: PathElement[] = [];
    
    for (let i = 0; i < callStackElements.length; i++) {
      const element = callStackElements[i];
      const pointer = element.currentPointer;
      
      if (pointer && pointer.container) {
        path.push({
          containerName: pointer.container.name || 'unnamed',
          containerPath: pointer.container.path.toString(),
          index: pointer.index,
          type: element.type
        });
      }
    }
    
    return {
      elements: path,
      depth: callStackElements.length,
      currentPointer: this.currentPointer.toString()
    };
  }
}

export interface PathElement {
  containerName: string;
  containerPath: string;
  index: number;
  type: PushPopType;
}

export interface ExecutionPathInfo {
  elements: PathElement[];
  depth: number;
  currentPointer: string;
}
```

### 阶段2：AVG特有功能扩展

#### 2.1 游戏状态管理

```typescript
// 在Story类中添加AVG特有功能

export class Story extends InkObject {
  // ... 现有代码 ...

  // 角色状态管理
  private _characterStates: Map<string, any> = new Map();
  
  public setCharacterState(character: string, state: any): void {
    this._characterStates.set(character, state);
    this._triggerEvent('characterStateChanged', { character, state });
  }
  
  public getCharacterState(character: string): any {
    return this._characterStates.get(character) || null;
  }
  
  // 物品系统
  private _inventory: Set<string> = new Set();
  
  public addToInventory(item: string): void {
    this._inventory.add(item);
    this._triggerEvent('inventoryChanged', { action: 'add', item });
  }
  
  public removeFromInventory(item: string): boolean {
    const removed = this._inventory.delete(item);
    if (removed) {
      this._triggerEvent('inventoryChanged', { action: 'remove', item });
    }
    return removed;
  }
  
  public getInventory(): string[] {
    return Array.from(this._inventory);
  }
  
  // 成就系统
  private _achievements: Set<string> = new Set();
  
  public unlockAchievement(id: string): void {
    if (!this._achievements.has(id)) {
      this._achievements.add(id);
      this._triggerEvent('achievementUnlocked', { achievement: id });
    }
  }
  
  public getAchievements(): string[] {
    return Array.from(this._achievements);
  }
  
  // 事件系统
  private _eventListeners: Map<string, Function[]> = new Map();
  
  public addEventListener(event: string, listener: Function): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event)!.push(listener);
  }
  
  public removeEventListener(event: string, listener: Function): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  private _triggerEvent(event: string, data: any): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }
}
```

#### 2.2 调试和开发工具

```typescript
export class Story extends InkObject {
  // ... 现有代码 ...
  
  private _debugMode: boolean = false;
  private _executionLog: ExecutionLogEntry[] = [];
  
  public enableDebugMode(): void {
    this._debugMode = true;
    console.log('InkJS Debug mode enabled');
  }
  
  public getDebugInfo(): DebugInfo {
    return {
      currentKnot: this.getCurrentKnotName(),
      currentPath: this.state.currentPathString,
      callStack: this.state.callStack.elements.map(e => ({
        type: e.type,
        container: e.currentPointer.container?.name || 'unknown',
        index: e.currentPointer.index
      })),
      executionLog: this._debugMode ? this._executionLog.slice(-50) : [], // 最近50条
      performance: this._getPerformanceMetrics()
    };
  }
  
  private _getPerformanceMetrics(): PerformanceMetrics {
    return {
      totalContinueCalls: this._continueCalls || 0,
      averageContinueTime: this._avgContinueTime || 0,
      totalChoiceCalls: this._choiceCalls || 0,
      averageChoiceTime: this._avgChoiceTime || 0
    };
  }
}

export interface ExecutionLogEntry {
  timestamp: number;
  action: string;
  knot: string;
  details: any;
}

export interface DebugInfo {
  currentKnot: string;
  currentPath: string | null;
  callStack: any[];
  executionLog: ExecutionLogEntry[];
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  totalContinueCalls: number;
  averageContinueTime: number;
  totalChoiceCalls: number;
  averageChoiceTime: number;
}
```

## 🚀 集成到AVG Maker的方案

### 1. 更新package.json依赖
```json
{
  "dependencies": {
    "inkjs": "file:./inkjs-fork"
  }
}
```

### 2. 更新Preview组件
```typescript
// 替换现有的复杂knot检测逻辑
const getCurrentKnotName = useCallback((story: Story): string => {
  // 直接使用增强的API
  return story.getCurrentKnotName();
}, []);

const predictChoiceTarget = useCallback((story: Story, choiceIndex: number): string => {
  const prediction = story.predictChoiceTarget(choiceIndex);
  return prediction.valid ? prediction.targetKnot : 'unknown';
}, []);
```

### 3. 利用新功能增强用户体验
```typescript
// 利用新的调试API
const getStoryDebugInfo = useCallback(() => {
  if (story && process.env.NODE_ENV === 'development') {
    return story.getDebugInfo();
  }
  return null;
}, [story]);

// 利用knot信息API
const getAllKnots = useCallback(() => {
  return story ? story.getAllKnotNames() : [];
}, [story]);
```

## 📊 预期收益

### 功能收益
- **100%准确**的knot名称检测
- **实时预测**选择目标
- **丰富的调试信息**
- **AVG特有功能**（角色、物品、成就）

### 性能收益
- 消除复杂的多层检测逻辑
- 减少运行时计算开销
- 提高应用响应速度

### 开发收益
- 更简洁的代码逻辑
- 更强的功能扩展能力
- 更好的维护性

## ⚠️ 实施注意事项

1. **渐进式迁移**：先实现核心功能，验证无误后再添加高级功能
2. **兼容性保持**：确保与现有inkjs代码的兼容性
3. **测试覆盖**：为新增功能编写完整的测试用例
4. **文档更新**：更新相关文档和使用示例

## 🎯 结论

Fork inkjs并进行针对性增强是解决当前knot检测问题的**最优方案**。它不仅能够根本性地解决现有问题，还能为AVG Maker提供独有的竞争优势，使其成为最专业的Ink AVG开发工具。

建议立即开始实施阶段1的核心增强，这将立刻解决历史记录knot名称显示问题，并为后续功能扩展奠定坚实基础。