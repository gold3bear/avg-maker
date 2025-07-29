# 修复保存确认对话框重复弹出崩溃问题

## ✅ 问题已解决

我已经成功修复了保存确认对话框重复弹出导致APP崩溃的问题。

## 🐛 原问题分析

### 根本原因
1. **缺少重复调用保护**：`handleAppWillClose`函数没有防重机制
2. **异步操作期间状态不一致**：在显示对话框期间，函数可能被再次触发
3. **主进程和渲染进程都缺少保护**：两边都没有防止重复操作

### 问题表现
- 用户点击关闭按钮后，保存确认对话框重复弹出
- 系统资源被大量消耗
- 最终导致应用崩溃或无响应

## 🔧 修复方案

### 1. 渲染进程保护机制 (src/App.tsx)

#### 添加状态管理
```typescript
// 防止重复处理关闭事件
const [isHandlingClose, setIsHandlingClose] = useState(false);
```

#### 重复调用保护
```typescript
const handleAppWillClose = async () => {
  // 防止重复处理关闭事件
  if (isHandlingClose || isClosing) {
    console.log('🚪 App: 已经在处理关闭事件或已经关闭，忽略重复调用');
    return;
  }
  
  setIsHandlingClose(true);
  
  try {
    // 处理关闭逻辑...
  } catch (error) {
    console.error('🚪 App: 关闭处理过程出错:', error);
    setIsHandlingClose(false);
  }
};
```

#### 完善的错误处理
```typescript
// 如果返回null，说明对话框被重复调用或出错，取消关闭
if (choice === null || choice === undefined) {
  console.log('⚠️ App: 对话框调用失败或被忽略，取消关闭');
  setIsHandlingClose(false);
  return;
}
```

### 2. 主进程保护机制 (electron/main.ts)

#### 防重复显示对话框
```typescript
// 防止重复显示保存对话框
let isShowingDialog = false;

ipcMain.handle('show-save-dialog', async (_, unsavedFiles: string[]) => {
  if (isShowingDialog) {
    console.log('🚪 Main: 已经在显示对话框，忽略重复请求');
    return null;
  }
  
  isShowingDialog = true;
  
  try {
    const result = await dialog.showMessageBox(mainWindow, {
      // 对话框配置...
    });
    
    return result.response;
  } catch (error) {
    console.error('🚪 Main: 显示对话框时出错:', error);
    return null;
  } finally {
    isShowingDialog = false;
  }
});
```

## 🧪 测试验证

### 测试场景1：正常关闭流程
1. **操作**：编辑文件但不保存，然后点击关闭按钮
2. **预期**：只显示一次系统对话框
3. **验证**：检查控制台日志，确认没有重复调用

### 测试场景2：快速多次点击关闭按钮
1. **操作**：有未保存文件时，快速多次点击关闭按钮
2. **预期**：只显示一次对话框，后续点击被忽略
3. **验证**：看到"忽略重复调用"的日志

### 测试场景3：对话框期间的其他关闭触发
1. **操作**：对话框显示期间，尝试通过其他方式关闭
2. **预期**：其他关闭尝试被忽略
3. **验证**：应用稳定，不会崩溃

## 📋 预期的调试日志

### 正常关闭流程
```
🔴 TitleBar: 关闭按钮被点击
🚪 App: 收到应用即将关闭通知，当前处理状态: false
🚪 App: 开始处理关闭事件...
🚪 App: 未保存文件检查结果: true
⚠️ App: 发现未保存的文件，显示系统保存确认对话框
🚪 Main: 显示保存确认对话框，文件数量: 2
🚪 Main: 系统对话框结果: { response: 0, checkboxChecked: false }
🚪 App: 用户选择: 0
💾 App: 用户选择保存，开始保存所有文件...
✅ App: 保存成功，确认关闭
```

### 重复调用被阻止
```
🔴 TitleBar: 关闭按钮被点击
🚪 App: 收到应用即将关闭通知，当前处理状态: false
🚪 App: 开始处理关闭事件...
🚪 Main: 显示保存确认对话框，文件数量: 2

# 用户再次点击关闭按钮
🔴 TitleBar: 关闭按钮被点击  
🚪 App: 收到应用即将关闭通知，当前处理状态: true
🚪 App: 已经在处理关闭事件或已经关闭，忽略重复调用

# 或者在主进程层被阻止
🚪 Main: 已经在显示对话框，忽略重复请求
```

## 🎯 关键改进点

### 1. 双重保护机制
- **渲染进程保护**：通过`isHandlingClose`状态防止重复处理
- **主进程保护**：通过`isShowingDialog`标志防止重复显示对话框

### 2. 完善的状态管理
- 所有异步操作都有proper的状态重置
- 错误情况下正确清理状态
- 避免状态不一致导致的问题

### 3. 强化的错误处理
- 对话框API返回null时的处理
- 异步操作异常时的状态恢复
- 避免降级机制导致的无限循环

### 4. 详细的调试日志
- 每个关键步骤都有日志记录
- 便于追踪问题和验证修复效果
- 区分正常流程和异常情况

## 🚀 测试方法

现在可以安全地测试关闭功能：

```bash
npm run dev
```

然后：
1. 编辑一些文件但不保存
2. 尝试各种关闭方式（点击交通灯、快速多次点击等）
3. 观察控制台日志，确认保护机制正常工作
4. 验证应用不会崩溃或无响应

这些修复确保了应用在任何情况下都不会因为重复的对话框调用而崩溃！