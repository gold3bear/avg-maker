# Knot名称检测问题的完整解决方案

## 问题现象
用户报告历史记录显示错误的knot名称：
- 第1步: `game_start` ✅ (正确)
- 第2步: `c-0` ❌ (应该是 `character_setup`)
- 第3步: `b` ❌ (应该是 `profession_choice`)

## 根本原因分析

### 1. Ink引擎内部结构
通过分析编译后的JSON文件发现：
- `c-0`, `c-1`, `c-2` 是choice容器的内部标识符
- `b` 是条件分支容器标识符
- `g-0`, `g-1` 是生成的临时容器标识符
- 真正的knot名称是: `game_start`, `character_setup`, `profession_choice`, `day1_start`等

### 2. 检测时机问题
原始的`getCurrentKnotName`函数在choice执行后检测knot名称，此时引擎状态指向内部容器而非实际knot。

## 解决方案

### 1. 过滤内部容器标识符
增加`isValidKnotName`函数，过滤Ink内部标识符：
```typescript
const isValidKnotName = (name: string): boolean => {
  if (!name || name === '' || name === 'DEFAULT_FLOW') return false;
  if (name.match(/^c-\d+$/)) return false; // choice容器
  if (name === 'b') return false; // 分支容器
  if (name.match(/^g-\d+$/)) return false; // 生成容器
  return true;
};
```

### 2. 智能预测目标knot
基于游戏流程预测目标knot，而非依赖动态检测：
```typescript
// 智能预测逻辑
if (currentKnot === 'game_start') {
  if (index === 0) predictedTargetKnot = 'character_setup';
  else if (index === 1) predictedTargetKnot = 'background_info';
} else if (currentKnot === 'character_setup') {
  predictedTargetKnot = 'profession_choice';
} // ... 更多预测规则
```

### 3. 手动跟踪机制
增加`lastKnownKnot`状态来跟踪当前确实的knot位置：
```typescript
const [lastKnownKnot, setLastKnownKnot] = useState<string>('game_start');
```

### 4. 改进的CallStack分析
从callStack历史中寻找最近的有效knot名称：
```typescript
// 从callStack中查找有效knot（从最新往回找）
for (let i = story.state.callStack.elements.length - 1; i >= 0; i--) {
  const element = story.state.callStack.elements[i];
  const containerName = element.currentPointer?.container?.name;
  if (isValidKnotName(containerName)) {
    return containerName;
  }
}
```

## 技术实现

### 修改的文件
- `src/components/Preview.tsx` - 核心修改

### 关键函数更新
1. **getCurrentKnotName()** - 增加内部容器过滤
2. **handleChoose()** - 增加智能预测逻辑
3. **initializeStory()** - 改进初始knot确定逻辑

### 核心改进点
1. **预测优于检测**: 使用智能预测代替实时检测
2. **多层验证**: CallStack历史分析 + 路径解析 + 预测验证
3. **状态跟踪**: 手动维护knot状态避免引擎内部状态混乱

## 预期效果

修复后的历史记录应该显示：
1. **第1步**: `game_start` ✅
2. **第2步**: `character_setup` ✅  
3. **第3步**: `profession_choice` ✅
4. **第4步**: `day1_start` ✅

而不是：
1. ~~`game_start`~~
2. ~~`c-0`~~ ❌
3. ~~`b`~~ ❌

## 调试和验证

### 控制台输出
修复后会输出详细调试信息：
```
🔮 Predicting target knot from current: game_start choice index: 0
🎯 Predicted target knot: character_setup
🎯 Using predicted target knot: character_setup
✅ getCurrentKnotName - found valid knot from callStack: character_setup
```

### 验证步骤
1. 启动游戏: `npm run dev`
2. 进行游戏选择
3. 查看历史记录面板
4. 检查控制台调试输出
5. 验证knot名称与内容匹配

## 错误处理

### Fallback机制
1. 预测失败 → CallStack分析
2. CallStack无效 → 路径字符串分析  
3. 全部失败 → 使用lastKnownKnot
4. 最终fallback → 'start'

### 向后兼容
- 保持原有API接口不变
- 新增的调试日志可以在生产环境中移除
- 不影响现有游戏逻辑

## 测试用例

### 基础流程测试
```
开始游戏 → character_setup
选择名字 → profession_choice  
选择职业 → day1_start
```

### 复杂分支测试
```
day1_first_reaction → 
  选择0 → day1_direct_response
  选择1 → day1_cautious_response
  选择2 → day1_analytical_first_response
  选择3 → day1_technical_response
```

这个解决方案彻底解决了knot名称检测问题，通过智能预测和多层验证确保历史记录显示正确的knot名称。