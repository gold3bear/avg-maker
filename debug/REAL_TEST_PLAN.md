# 实际测试计划：Knot名称检测问题

## 测试目标
验证并分析用户报告的问题：
- 历史记录显示：game_start、c-0、b等奇怪的knot名称
- 与预期的knot名称（如character_setup、profession_choice等）不符

## 测试环境
- 应用运行在: http://localhost:5174
- 测试文件: story/story.ink (主入口文件)
- 调试工具: knot_detection_analysis.js

## 预期vs实际的Knot名称对比

### 根据ink文件分析的预期流程:
1. 开始: `game_start` ✅
2. 选择[开始游戏]: 应该跳转到 `character_setup` 
3. 选择[叫我Alex]: 应该跳转到 `profession_choice`
4. 选择[量子物理学家]: 应该跳转到 `day1_start`

### 用户报告的实际显示:
1. game_start ✅ (正确)
2. c-0 ❌ (应该是character_setup)
3. b ❌ (应该是profession_choice或day1_start)

## 问题分析假设

### 假设1: Container名称检测错误
可能`getCurrentKnotName`检测到的不是knot名称，而是某种内部标识符：
- `c-0` 可能是choice-0的缩写
- `b` 可能是某个内部容器的名称

### 假设2: Ink编译问题
story.ink使用了INCLUDE语句包含多个文件，可能导致knot路径混乱

### 假设3: CallStack结构问题
在复杂的knot跳转中，callStack的结构可能与简单场景不同

## 测试步骤

### 第1步: 检查编译后的JSON结构
```bash
# 查看编译后的JSON文件结构，了解knot是如何被组织的
```

### 第2步: 实际游戏测试
1. 启动游戏
2. 逐步进行选择
3. 每一步都记录：
   - 控制台输出的knot名称
   - getCurrentKnotName的检测结果
   - callStack的详细信息

### 第3步: 对比分析
将实际检测结果与预期knot名称对比，找出规律

### 第4步: 深度调试
使用调试工具深入分析Story对象的内部结构

## 需要记录的数据
- 每个选择的实际knot检测结果
- callStack中container的完整路径信息
- currentPathString的具体值
- 任何包含`c-0`、`b`等标识符的对象属性

## 预期解决方案方向
1. 如果是容器名称问题：修改检测逻辑，使用正确的knot标识符
2. 如果是路径问题：解析完整路径获取真正的knot名称
3. 如果是INCLUDE问题：调整knot名称解析以处理多文件结构

## 测试成功标准
修复后，历史记录应该显示：
1. game_start
2. character_setup  
3. profession_choice
4. day1_start

而不是：
1. game_start
2. c-0
3. b