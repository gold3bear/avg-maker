# InkKnotDetection 工具使用指南

## 概述

`InkKnotDetection` 是一个专门用于解决 Ink 引擎 knot 名称检测问题的工具库。它能够准确区分 Ink 内部容器标识符（如 `c-0`, `b`, `g-1`）和真正的 knot 名称（如 `game_start`, `character_setup`），确保在复杂的交互式小说中正确跟踪故事节点。

## 核心问题

在使用 Ink.js 引擎时，经常会遇到以下问题：
- `getCurrentKnotName()` 返回 `c-0`, `c-1` 等 choice 容器标识符
- `callStack` 中包含 `b` 等分支容器标识符  
- 难以准确确定当前所在的实际故事节点

## 主要特性

### 🎯 智能预测
基于游戏流程预测目标 knot，避免动态检测的时机问题

### 🔍 多层检测
- CallStack 历史分析
- CurrentPointer 检测
- PathString 解析
- 容器标识符过滤

### 📊 流程映射
支持自定义 knot 流程映射，适应不同的游戏结构

### 🐛 调试友好
提供详细的调试日志，帮助诊断检测问题

## 基本使用

### 1. 创建检测器实例

```typescript
import { InkKnotDetector } from '../utils/inkKnotDetection';

// 基础使用
const detector = new InkKnotDetector();

// 启用调试日志
const detector = new InkKnotDetector({ 
  enableDebugLog: true 
});

// 自定义流程映射
const detector = new InkKnotDetector({
  enableDebugLog: true,
  customKnotFlowMap: {
    'my_custom_start': {
      choices: ['option_a', 'option_b'],
      defaultTarget: 'option_a'
    }
  }
});
```

### 2. 检测当前 knot

```typescript
// 基础检测
const currentKnot = detector.getCurrentKnotName(story);

// 带 fallback 的检测
const currentKnot = detector.getCurrentKnotName(story, 'default_knot');
```

### 3. 选择后 knot 检测

```typescript
// 预测选择后的目标 knot
const targetKnot = detector.detectKnotAfterChoice(
  story, 
  'current_knot', 
  choiceIndex
);

// 带验证的检测
const targetKnot = detector.detectKnotAfterChoice(
  story, 
  'current_knot', 
  choiceIndex,
  { verifyAfterContinue: true }
);
```

## 高级使用

### 1. 状态跟踪

```typescript
// 更新最近已知的 knot
detector.updateLastKnownKnot('new_knot');

// 获取最近已知的 knot
const lastKnot = detector.getLastKnownKnot();
```

### 2. 初始 knot 确定

```typescript
// 根据文件路径确定初始 knot
const initialKnot = detector.determineInitialKnot('/path/to/story.ink');
// 返回: 'game_start'

const initialKnot = detector.determineInitialKnot('/path/to/day_1.ink');
// 返回: 'day1_start'
```

### 3. 自定义流程映射

```typescript
// 添加单个映射
detector.addKnotFlowMapping('boss_fight', [
  'attack', 'defend', 'flee'
], 'attack');

// 获取当前映射
const flowMap = detector.getKnotFlowMap();
```

### 4. 容器名称验证

```typescript
// 检查是否为有效的 knot 名称
const isValid = detector.isValidKnotName('game_start'); // true
const isValid = detector.isValidKnotName('c-0'); // false
const isValid = detector.isValidKnotName('b'); // false
```

## 便捷函数

如果不需要持久的检测器实例，可以使用便捷函数：

```typescript
import { quickDetectKnot, detectKnotAfterChoice } from '../utils/inkKnotDetection';

// 快速检测
const knot = quickDetectKnot(story, 'fallback');

// 快速选择检测
const targetKnot = detectKnotAfterChoice(story, 'current', 0, {
  enableDebugLog: true
});
```

## 在 React 组件中使用

```typescript
import React, { useRef } from 'react';
import { InkKnotDetector } from '../utils/inkKnotDetection';

function GameComponent() {
  // 创建持久的检测器实例
  const knotDetector = useRef(new InkKnotDetector({ 
    enableDebugLog: process.env.NODE_ENV === 'development'
  }));

  const handleChoice = (story: Story, choiceIndex: number) => {
    const currentKnot = knotDetector.current.getLastKnownKnot();
    const targetKnot = knotDetector.current.detectKnotAfterChoice(
      story, currentKnot, choiceIndex
    );
    
    // 执行选择...
    story.ChooseChoiceIndex(choiceIndex);
    
    // 消费输出...
    while (story.canContinue) {
      story.Continue();
    }
    
    // 记录到历史...
    addHistoryEntry(targetKnot, /* ... */);
  };

  return (
    // JSX...
  );
}
```

## 默认流程映射

工具内置了常见 AVG 游戏的流程映射：

```typescript
{
  'game_start': {
    choices: ['character_setup', 'background_info'],
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
  // ... 更多映射
}
```

## 调试模式

启用调试模式后，控制台会输出详细信息：

```
🔮 Predicting target knot from current: game_start choice index: 0
✅ Predicted from flow map: character_setup
📍 Updated lastKnownKnot to: character_setup
🔍 Analyzing callStack with 3 elements
  [2]: container="character_setup", valid="true"
✅ Found valid knot from callStack: character_setup
```

## 最佳实践

### 1. 实例管理
```typescript
// ✅ 推荐：使用 useRef 创建持久实例
const detector = useRef(new InkKnotDetector());

// ❌ 避免：每次渲染都创建新实例
const detector = new InkKnotDetector();
```

### 2. 调试配置
```typescript
// ✅ 推荐：仅在开发环境启用调试
const detector = new InkKnotDetector({ 
  enableDebugLog: process.env.NODE_ENV === 'development'
});
```

### 3. 自定义映射
```typescript
// ✅ 推荐：为复杂游戏添加自定义映射
detector.addKnotFlowMapping('complex_scene', [
  'path_a', 'path_b', 'path_c'
]);
```

### 4. 错误处理
```typescript
// ✅ 推荐：提供合理的 fallback
const knot = detector.getCurrentKnotName(story, 'safe_fallback');
```

## 故障排除

### 问题：仍然返回 `c-0` 等标识符
**解决方案**：
1. 检查是否正确更新了 `lastKnownKnot`
2. 验证自定义流程映射是否正确
3. 启用调试日志查看检测过程

### 问题：预测的 knot 不准确
**解决方案**：
1. 添加或更新流程映射
2. 使用 `verifyAfterContinue: true` 选项
3. 手动调用 `updateLastKnownKnot()`

### 问题：性能问题
**解决方案**：
1. 在生产环境关闭调试日志
2. 避免频繁创建新的检测器实例
3. 合理使用验证选项

## API 参考

详细的 API 文档请参考 TypeScript 类型定义和源代码注释。主要接口包括：

- `InkKnotDetector` - 主要检测器类
- `KnotDetectionOptions` - 配置选项接口
- `KnotFlowMap` - 流程映射接口
- `quickDetectKnot()` - 便捷检测函数
- `detectKnotAfterChoice()` - 便捷选择检测函数

这个工具解决了 Ink 引擎中 knot 名称检测的核心问题，为构建复杂的交互式小说提供了可靠的基础。