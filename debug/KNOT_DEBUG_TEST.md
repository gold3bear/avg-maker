# Knot名称检测问题调试指南

## 问题描述
- 第一个历史记录step显示正确的knot名称 (如: game_start)
- 后续所有step的knot名称都显示为 "start"
- 但内容和选择项是正确的，只有knot名称不匹配

## 测试步骤

### 1. 准备测试环境
1. 启动开发服务器: `npm run dev`  
2. 打开浏览器开发者工具
3. 在控制台加载调试脚本:
   ```javascript
   // 复制 debug_knot_detection.js 的内容到控制台
   ```

### 2. 基础测试
1. 开始游戏，进入Preview模式
2. 查看第一个step是否正确显示knot名称
3. 在控制台运行: `debugKnotDetection.debugCurrent()`
4. 记录输出结果

### 3. 选择执行测试
1. 进行第一个选择前，运行: `debugKnotDetection.debugCurrent()`
2. 执行一个选择
3. 观察控制台的详细日志输出
4. 检查历史记录面板中的knot名称

### 4. 关键观察点

#### A. 初始状态检查
- `story.state.currentPathString` 的值
- `story.state.callStack.elements` 的内容  
- `getCurrentKnotName()` 函数的返回值

#### B. 选择执行过程
- `ChooseChoiceIndex()` 执行前后的状态变化
- 每次 `Continue()` 后的状态变化
- 最终knot名称的检测结果

#### C. 历史记录创建
- `createHistoryEntry()` 接收的knot名称参数
- 历史记录面板显示的knot名称

## 预期发现的问题

### 假设1: getCurrentKnotName函数逻辑问题
如果所有检测方法都返回空值，会fallback到'start'

### 假设2: Story状态在Continue后被重置
可能在执行Continue时，Ink引擎重置了某些状态

### 假设3: callStack信息不准确
可能callStack中的container信息不是我们想要的knot名称

## 测试用例样本

### 测试用例1: 简单knot跳转
```ink
=== game_start ===
这是开始。
+ [选择1] -> knot_a
+ [选择2] -> knot_b

=== knot_a ===
这是knot A的内容。
-> END

=== knot_b ===  
这是knot B的内容。
-> END
```

期望结果:
- 第1步: game_start (正确)
- 第2步: knot_a 或 knot_b (当前显示为start)

### 测试用例2: 嵌套knot
```ink
=== main ===
+ [进入子流程] -> sub_flow

=== sub_flow ===
子流程内容
+ [返回] -> main
+ [继续] -> another_knot

=== another_knot ===
另一个knot
-> END
```

## 调试命令快速参考

```javascript
// 查看当前状态
debugKnotDetection.debugCurrent()

// 模拟执行选择0
debugKnotDetection.debugChoiceExecution(0)

// 手动检查story状态
console.log('Story state:', window.currentStoryForDebug.state)
console.log('Current path:', window.currentStoryForDebug.state.currentPathString)
console.log('CallStack:', window.currentStoryForDebug.state.callStack)
```

## 修复方向

根据测试结果，可能的修复方向:
1. 改进knot名称检测算法
2. 调整检测时机
3. 使用其他Ink.js API
4. 实现手动knot名称跟踪