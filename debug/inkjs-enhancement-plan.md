# InkJS Enhancement Plan for AVG Maker

## 🎯 目标
Fork inkjs并增强其功能，专门为AVG Maker提供更强大的故事引擎支持。

## 📋 增强功能清单

### 1. 核心Knot管理增强

#### 在Story类中添加：
```typescript
class Story {
  // 直接获取当前knot名称（解决根本问题）
  getCurrentKnotName(): string {
    // 直接从内部状态获取，无需推断
    return this._currentKnot?.name || 'unknown';
  }
  
  // 获取当前knot的详细信息
  getCurrentKnotInfo(): KnotInfo {
    return {
      name: this.getCurrentKnotName(),
      container: this._currentContainer,
      path: this._currentPath,
      tags: this._currentKnot?.tags || [],
      visitCount: this._knotVisitCounts[this.getCurrentKnotName()] || 0
    };
  }
  
  // 获取所有knot的元数据
  getAllKnots(): KnotInfo[] {
    return Object.keys(this._namedContent).map(name => ({
      name,
      container: this._namedContent[name],
      connections: this._getKnotConnections(name),
      tags: this._getKnotTags(name)
    }));
  }
}
```

### 2. 选择系统增强

```typescript
class Story {
  // 预测选择结果
  predictChoice(choiceIndex: number): ChoicePrediction {
    const choice = this.currentChoices[choiceIndex];
    const targetPath = this._analyzeChoiceTarget(choice);
    
    return {
      targetKnot: this._extractKnotFromPath(targetPath),
      confidence: this._calculateConfidence(targetPath),
      pathPreview: this._generatePathPreview(targetPath),
      estimatedContent: this._previewContent(targetPath)
    };
  }
  
  // 获取选择的详细信息
  getChoiceDetails(choiceIndex: number): ChoiceDetails {
    const choice = this.currentChoices[choiceIndex];
    return {
      text: choice.text,
      tags: choice.tags || [],
      conditions: this._getChoiceConditions(choice),
      consequences: this._getChoiceConsequences(choice),
      targetKnot: this.predictChoice(choiceIndex).targetKnot
    };
  }
}
```

### 3. 游戏状态管理增强

```typescript
class Story {
  // 访问统计
  private _knotVisitCounts: Record<string, number> = {};
  private _choiceHistory: ChoiceRecord[] = [];
  private _gameStats: GameStats = { ... };
  
  // 获取游戏统计
  getGameStats(): GameStats {
    return {
      totalKnots: Object.keys(this._namedContent).length,
      visitedKnots: Object.keys(this._knotVisitCounts),
      totalChoicesMade: this._choiceHistory.length,
      currentPath: this._getCurrentPath(),
      playtime: this._calculatePlaytime(),
      branchingFactor: this._calculateBranchingFactor()
    };
  }
  
  // 获取访问历史
  getVisitHistory(): VisitRecord[] {
    return this._choiceHistory.map(record => ({
      knot: record.fromKnot,
      choice: record.choiceText,
      targetKnot: record.toKnot,
      timestamp: record.timestamp
    }));
  }
}
```

### 4. 调试和开发工具

```typescript
class Story {
  // 开发模式标志
  private _devMode: boolean = false;
  
  enableDevMode(): void {
    this._devMode = true;
    this._setupDevTools();
  }
  
  // 获取详细调试信息
  getDebugInfo(): DebugInfo {
    return {
      currentContainer: this._currentContainer?.name,
      callStack: this._state.callStack.elements.map(e => ({
        container: e.currentPointer.container.name,
        index: e.currentPointer.index
      })),
      variables: this._getVariableSnapshot(),
      flowStack: this._getFlowStack(),
      executionLog: this._devMode ? this._executionLog : null
    };
  }
  
  // 性能分析
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      averageContinueTime: this._avgContinueTime,
      averageChoiceTime: this._avgChoiceTime,
      memoryUsage: this._estimateMemoryUsage(),
      cacheHitRate: this._cacheHitRate
    };
  }
}
```

### 5. AVG特有功能扩展

```typescript
class Story {
  // 角色系统
  private _characters: Map<string, CharacterState> = new Map();
  
  setCharacterState(name: string, state: CharacterState): void {
    this._characters.set(name, state);
    this._triggerCharacterEvent(name, 'stateChanged', state);
  }
  
  getCharacterState(name: string): CharacterState | null {
    return this._characters.get(name) || null;
  }
  
  // 物品系统
  private _inventory: Set<string> = new Set();
  
  addToInventory(item: string): void {
    this._inventory.add(item);
    this._triggerInventoryEvent('itemAdded', item);
  }
  
  removeFromInventory(item: string): boolean {
    const removed = this._inventory.delete(item);
    if (removed) {
      this._triggerInventoryEvent('itemRemoved', item);
    }
    return removed;
  }
  
  getInventory(): string[] {
    return Array.from(this._inventory);
  }
  
  // 成就系统
  private _achievements: Set<string> = new Set();
  
  unlockAchievement(id: string): void {
    if (!this._achievements.has(id)) {
      this._achievements.add(id);
      this._triggerAchievementEvent('unlocked', id);
    }
  }
}
```

## 🔧 实施步骤

### Step 1: Fork和基础设置
1. Fork inkjs仓库到 `inkjs-avg`
2. 设置构建环境和测试框架
3. 创建类型定义文件

### Step 2: 核心功能实现
1. 实现 `getCurrentKnotName()` 和相关API
2. 添加knot元数据管理
3. 增强选择预测功能

### Step 3: 高级功能开发
1. 游戏状态管理系统
2. 调试和开发工具
3. AVG特有功能（角色、物品、成就）

### Step 4: 集成到AVG Maker
1. 更新package.json依赖
2. 替换现有的knot检测系统
3. 利用新的API重构相关组件

### Step 5: 测试和优化
1. 全面的功能测试
2. 性能基准测试
3. 与现有项目的兼容性测试

## 📊 预期收益

### 功能方面
- 🎯 **100%准确的knot检测** - 直接从引擎获取，无需推断
- 🚀 **更丰富的游戏功能** - 角色、物品、成就系统
- 🔍 **强大的调试工具** - 专为AVG开发优化
- 📈 **详细的游戏统计** - 帮助创作者优化内容

### 技术方面
- ⚡ **更好的性能** - 减少复杂的检测逻辑
- 🛡️ **更高的可靠性** - 从源头解决问题
- 🔧 **更强的可控性** - 完全定制化的引擎
- 🔄 **更好的维护性** - 统一的API设计

### 生态方面
- 🌟 **技术领先性** - 创建AVG领域最强的Ink引擎
- 🤝 **社区贡献** - 可能贡献回upstream
- 📚 **学习价值** - 深入理解Ink引擎原理
- 🎮 **游戏体验** - 为用户提供更好的创作工具

## ⚠️ 注意事项

### 维护成本
- 需要跟进inkjs的upstream更新
- 需要维护兼容性
- 需要处理可能的冲突

### 开发投入
- 需要深入理解inkjs源码
- 需要编写完整的测试套件
- 需要文档和示例

### 风险控制
- 保持与原版inkjs的最大兼容性
- 渐进式迁移策略
- 完善的回退机制

## 🎯 结论

Fork inkjs是一个技术上可行且收益巨大的方案。它能够：
1. **根本性解决**当前的knot检测问题
2. **显著提升**AVG Maker的功能和体验
3. **建立技术优势**，使AVG Maker成为最专业的Ink AVG开发工具

建议采用渐进式实施策略，先实现核心功能，再逐步添加高级特性。