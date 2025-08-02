# Knot名称检测修复验证

## 修复内容

### 问题描述
- 历史记录中第一个step显示正确的knot名称 (如: game_start)
- 后续所有step的knot名称都显示为 "start"
- 但内容和选择项是正确的，只有knot名称不匹配

### 根本原因
`getCurrentKnotName()` 函数在错误的时机被调用：
- **之前**: 在所有 `story.Continue()` 执行完毕后检测knot名称
- **问题**: 此时Ink引擎状态已经处于"等待"状态，不再指向实际的knot

### 修复方案
修改 `handleChoose` 函数中的Continue循环逻辑：
- **现在**: 在第一次 `story.Continue()` 执行后立即检测knot名称
- **优势**: 此时引擎刚进入新knot，状态信息最准确

### 代码修改位置
文件: `src/components/Preview.tsx`
函数: `handleChoose` (约第550-580行)

修改内容:
```typescript
// 之前的逻辑
while (story.canContinue) {
  const line = story.Continue();
  // ...
}
const finalKnotName = getCurrentKnotName(story, 'start'); // ❌ 时机错误

// 修复后的逻辑
let detectedKnotName = 'start';
while (story.canContinue) {
  const line = story.Continue();
  
  // 在第一次Continue后立即检测knot名称 ✅
  if (continueCount === 1) {
    detectedKnotName = getCurrentKnotName(story, 'start');
  }
  // ...
}
const finalKnotName = detectedKnotName; // ✅ 使用正确时机检测的名称
```

## 验证步骤

### 自动测试
使用提供的调试工具验证修复效果:
```javascript
// 在浏览器控制台运行
knotAnalysis.simulateChoiceExecution(0);
```

### 手动测试
1. 启动游戏: `npm run dev`
2. 开始游戏并进行几个选择
3. 查看历史记录面板中的knot名称
4. 验证每个step的knot名称与内容匹配

### 预期结果
- 第1步: 显示实际的初始knot名称 (如: game_start)
- 第2步: 显示选择后跳转到的knot名称 (如: chapter1, ending_a等)
- 第3步及以后: 显示对应的实际knot名称

### 日志验证
修复后的代码会输出详细日志:
```
🎯 Detected knot name after first Continue: [实际knot名称]
```

如果看到这个日志且显示的不是"start"，说明修复成功。

## 测试用例

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

**修复前的结果**:
- 第1步: game_start ✅
- 第2步: start ❌

**修复后的预期结果**:
- 第1步: game_start ✅
- 第2步: knot_a 或 knot_b ✅

### 测试用例2: 复杂嵌套knot
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

**修复后的预期结果**:
- 每一步都显示正确的knot名称而不是"start"

## 注意事项

1. **向后兼容**: 修复不影响现有功能，只是改善了knot名称的检测准确性
2. **性能影响**: 微乎其微，只是调整了检测时机
3. **调试日志**: 新增的日志有助于future debugging，可以在生产环境中移除
4. **错误处理**: 保持了原有的fallback机制，即使检测失败也会fallback到'start'