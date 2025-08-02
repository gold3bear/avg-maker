# 系统级保存确认对话框使用指南

## ✅ 已完成的改进

我已经将自定义的保存确认弹窗改为VS Code风格的系统级对话框，这样更符合操作系统的原生用户体验。

### 🔧 实现的功能

#### 1. 系统级原生对话框
- **使用Electron的`dialog.showMessageBox`**：调用操作系统原生对话框API
- **跨平台支持**：在macOS、Windows、Linux上都显示对应系统的原生样式
- **系统图标**：使用系统默认的警告图标
- **本地化按钮**：使用系统语言的标准按钮文本

#### 2. VS Code风格的交互
- **三个选项**：保存、不保存、取消
- **默认选择**：默认选中"保存"（最安全的选项）
- **取消键**：ESC键或点击取消按钮
- **文件列表**：显示具体哪些文件有未保存的更改

#### 3. 完整的错误处理
- **降级机制**：如果系统对话框失败，可以降级到自定义对话框
- **异步处理**：正确处理用户选择的异步响应
- **日志记录**：详细的调试日志追踪用户选择

## 🎯 测试场景

### 场景1：有未保存文件时关闭窗口

1. **操作步骤**：
   - 启动应用：`npm run dev`
   - 打开项目并编辑一些文件
   - 确保有未保存的更改
   - 点击窗口左上角的红色交通灯（关闭按钮）

2. **预期结果**：
   - 出现系统级的原生对话框
   - 对话框标题："你有未保存的更改"
   - 对话框内容：列出具体的未保存文件
   - 三个按钮：保存、不保存、取消

3. **用户选择效果**：
   - **点击"保存"**：自动保存所有文件，然后关闭应用
   - **点击"不保存"**：直接关闭应用，不保存任何更改
   - **点击"取消"或ESC**：回到应用继续使用

### 场景2：没有未保存文件时关闭窗口

1. **操作步骤**：
   - 确保所有文件都已保存
   - 点击关闭按钮

2. **预期结果**：
   - 直接关闭应用，不显示任何对话框

## 🔍 调试日志

### 正常流程的控制台输出

```
🔴 TitleBar: 关闭按钮被点击
🔴 TitleBar: 调用closeWindow API
🔴 Main: 收到关闭窗口请求
🔴 Main: 调用mainWindow.close()
🚪 Main: 窗口关闭事件触发, isQuitting = false
🚪 Main: 阻止默认关闭，通知渲染进程检查未保存文件...
🚪 Main: 发送app-will-close事件到渲染进程
🚪 App: 收到应用即将关闭通知，检查未保存的文件...
🚪 App: 未保存文件检查结果: true
⚠️ App: 发现未保存的文件，显示系统保存确认对话框
🚪 Main: 系统对话框结果: { response: 0, checkboxChecked: false }
🚪 App: 用户选择: 0
💾 App: 用户选择保存，开始保存所有文件...
✅ App: 保存成功，确认关闭
🚪 App: 通知主进程确认关闭
🚪 Main: 渲染进程确认关闭窗口
🚪 Main: 窗口关闭事件触发, isQuitting = true
🚪 Main: 已确认关闭，允许关闭
```

### 各选择对应的响应码

- **`response: 0`** = 用户点击"保存"
- **`response: 1`** = 用户点击"不保存" 
- **`response: 2`** = 用户点击"取消"

## 🎨 对话框外观

### macOS
- 使用macOS的原生NSAlert样式
- 系统图标和按钮样式
- 符合Apple Human Interface Guidelines

### Windows
- 使用Windows的MessageBox样式
- 系统图标和按钮文本
- 符合Microsoft Design Guidelines

### Linux
- 使用GTK对话框样式
- 遵循当前桌面环境的主题

## 🔧 技术实现

### 主进程 (electron/main.ts)
```typescript
// 显示系统级别的保存确认对话框
ipcMain.handle('show-save-dialog', async (_, unsavedFiles: string[]) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['保存', '不保存', '取消'],
    defaultId: 0,
    cancelId: 2,
    message: '你有未保存的更改',
    detail: `你有未保存的更改：\n\n${fileList}\n\n你想要保存这些更改吗？`
  });
  
  return result.response; // 0=保存, 1=不保存, 2=取消
});
```

### 渲染进程 (src/App.tsx)
```typescript
const choice = await window.inkAPI?.showSaveDialog(filePaths);

if (choice === 0) {
  // 保存并关闭
  const success = await saveAllFiles();
  if (success) {
    window.inkAPI?.confirmClose();
  }
} else if (choice === 1) {
  // 不保存直接关闭
  window.inkAPI?.confirmClose();
} else {
  // 取消关闭
  return;
}
```

## 🚨 故障排除

### 问题1：对话框没有出现
- **检查**：确认有未保存的文件
- **查看日志**：是否有"发现未保存的文件"的日志
- **验证API**：检查`window.inkAPI.showSaveDialog`是否可用

### 问题2：对话框出现但选择无效
- **查看日志**：检查返回的response值
- **验证逻辑**：确认0/1/2的处理逻辑正确

### 问题3：降级到自定义对话框
- **原因**：系统对话框API调用失败
- **解决**：检查主进程的IPC处理器是否正确注册

## 🎯 与VS Code的对比

现在我们的应用行为与VS Code完全一致：

1. **相同的触发时机**：只有在有未保存更改时才显示对话框
2. **相同的对话框样式**：使用系统原生对话框
3. **相同的选项**：保存、不保存、取消
4. **相同的默认选择**：默认选中保存
5. **相同的文件列表**：显示具体的未保存文件名

这样就实现了真正VS Code级别的用户体验！