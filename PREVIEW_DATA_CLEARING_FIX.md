# Preview组件数据清空问题修复

## 🔍 问题根本原因

发现了导致"前台数据瞬间清空"的真正原因：

### 问题1: Preview组件的错误逻辑
**Preview.tsx中的问题**：
```typescript
useEffect(() => {
  if (!filePath) return;

  // ❌ 问题：立即清空所有状态
  setStory(null);
  setOutput([]);
  setChoices([]);
  setError(null);
  setPluginCtx(null);

  const init = async () => {
    // 如果这里编译失败，数据已经被清空了！
    const json = await window.inkAPI.compileInk(source, false, filePath);
    // ...
  }
})
```

### 问题2: Ink文件中的语法错误
**day_2.ink第362行**：
```ink
-> day2_demand_details  // ❌ 这个knot不存在
```

## ✅ 修复方案

### 修复1: 改进Preview组件的状态管理
**修改前**：立即清空状态，然后尝试编译
**修改后**：保留现有内容直到新内容准备好

```typescript
useEffect(() => {
  if (!filePath) {
    // 只有没有文件时才清空
    setStory(null);
    setOutput([]);
    setChoices([]);
    setError(null);
    setPluginCtx(null);
    return;
  }

  const init = async () => {
    // 开始编译时，只清除错误状态，保留现有内容
    setError(null);
    
    try {
      // 编译成功后才更新状态
      const json = await window.inkAPI.compileInk(source, false, filePath);
      const s = new Story(json);
      // ... 处理成功逻辑
      
      // 只有编译成功后才更新状态
      setStory(s);
      setOutput(newOutput);
      setChoices(s.currentChoices);
      setPluginCtx(null);
    } catch (err) {
      // 编译失败时，保留现有内容，只显示错误
      setError(err instanceof Error ? err.message : String(err));
    }
  };
})
```

### 修复2: 修复Ink语法错误
**day_2.ink第362行**：
```ink
// 修复前
-> day2_demand_details  // 不存在的knot

// 修复后  
-> day2_doomed_revelation  // 存在的knot
```

## 🎯 修复效果

### Before（问题状态）
1. 用户点击项目内的ink文件
2. Preview组件立即清空所有内容
3. 尝试编译day_2.ink
4. 编译失败（因为语法错误）
5. 用户看到空白界面（数据已被清空）

### After（修复后）
1. 用户点击项目内的ink文件
2. Preview组件保留当前内容
3. 开始编译新文件
4. 如果编译成功：显示新内容
5. 如果编译失败：显示错误信息，保留旧内容

## 🔧 技术改进

### 用户体验提升
- ✅ **避免数据闪烁**：编译期间保留现有内容
- ✅ **优雅错误处理**：编译失败时显示错误而不是空白
- ✅ **状态连续性**：切换文件时提供更好的视觉连续性

### 错误处理强化
- ✅ **语法错误修复**：修复了day_2.ink中的跳转错误
- ✅ **错误显示**：编译错误会正确显示在界面上
- ✅ **状态保护**：避免错误导致的数据丢失

### 代码质量
- ✅ **逻辑优化**：改进了组件状态更新逻辑
- ✅ **错误预防**：减少了由于时序问题导致的状态异常
- ✅ **调试能力**：保留了错误信息的完整显示

## 🧪 测试验证

### 测试步骤
1. **基本切换测试**：
   - 在Preview面板中打开一个正常的ink文件
   - 切换到story文件夹中的其他文件
   - 验证内容正常切换，无闪烁

2. **错误文件测试**：
   - 打开包含语法错误的ink文件
   - 验证显示错误信息而不是空白页面
   - 验证之前的内容不会被意外清空

3. **状态恢复测试**：
   - 从错误文件切换到正常文件
   - 验证能正常恢复显示

### 预期结果
- ✅ 项目内文件切换流畅，无数据清空
- ✅ 编译错误正确显示，不影响用户体验
- ✅ 错误修复后能正常工作

现在应该可以安全地在项目内文件间切换，不再出现数据清空的问题！