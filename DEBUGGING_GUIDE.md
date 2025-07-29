# 调试指南：交通灯关闭和强制刷新数据恢复

## 🚨 当前问题

1. **交通灯关闭按钮无响应**：点击红色关闭按钮无法正常关闭程序
2. **强制刷新数据丢失**：即使有VS Code风格的数据恢复，强制刷新后数据仍被清空

## 🔍 调试工具

我已经在代码中添加了详细的调试日志，现在可以通过控制台追踪问题。

### 启动调试模式

```bash
npm run dev
```

然后打开开发者工具（F12），观察控制台输出。

## 🎯 测试场景和预期日志

### 场景1：测试交通灯关闭按钮

**操作步骤**：
1. 启动应用
2. 点击左上角红色交通灯（关闭按钮）
3. 观察控制台输出

**预期的调试日志序列**：
```
🔴 TitleBar: 关闭按钮被点击
🔴 TitleBar: 调用closeWindow API
🔴 Main: 收到关闭窗口请求
🔴 Main: 调用mainWindow.close()
🚪 Main: 窗口关闭事件触发, isQuitting = false
🚪 Main: 阻止默认关闭，通知渲染进程检查未保存文件...
🚪 Main: 发送app-will-close事件到渲染进程
🚪 App: 收到应用即将关闭通知，检查未保存的文件...
🚪 App: 未保存文件检查结果: false
✅ App: 没有未保存文件，直接关闭
🚪 App: 通知主进程确认关闭
🚪 Main: 渲染进程确认关闭窗口
🚪 Main: 窗口关闭事件触发, isQuitting = true
🚪 Main: 已确认关闭，允许关闭
```

**如果日志中断，说明问题出现在那个步骤**。

### 场景2：测试强制刷新数据恢复

**操作步骤**：
1. 启动应用并进行一些操作：
   - 打开项目
   - 切换视图模式
   - 调整侧边栏
2. 等待2-3秒（确保数据被保存）
3. 按Cmd+R强制刷新
4. 观察页面重新加载后的控制台输出

**预期的调试日志序列**：
```
💾 工作区状态已保存
💾 编辑器状态已保存
🔍 恢复检测: 查找状态快照... 找到
🔍 恢复检测: 快照数据 {
  savedSessionId: "session_1234...",
  currentSessionId: "session_5678...",
  timeDiff: 1234,
  timestamp: "2025-01-28 10:30:45"
}
🔍 恢复检测: 判断结果 {
  recentlySaved: true,
  differentSession: true,
  shouldRestore: true
}
🔄 VS Code风格恢复：检测到需要恢复的状态
🎨 恢复UI状态: {view: "preview", activeTab: "explorer", sidebarVisible: true}
📝 恢复编辑器状态: {...}
📁 恢复工作区状态: {...}
```

## 🛠️ 故障排除

### 问题1：交通灯按钮点击无响应

**可能原因**：
- TitleBar组件中的事件处理器未绑定
- inkAPI不可用
- IPC通信失败

**检查步骤**：
1. 看是否有 `🔴 TitleBar: 关闭按钮被点击` 日志
2. 如果没有，检查按钮的onClick绑定
3. 如果有但后续中断，检查inkAPI可用性

### 问题2：窗口关闭流程中断

**可能原因**：
- 主进程IPC处理器未正确注册
- 渲染进程监听器未绑定
- 确认关闭逻辑有问题

**检查步骤**：
1. 确认是否收到 `🚪 Main: 收到关闭窗口请求`
2. 检查是否有 `🚪 App: 收到应用即将关闭通知`
3. 验证confirmClose是否被调用

### 问题3：强制刷新后数据不恢复

**可能原因**：
- 数据保存频率不够
- 恢复检测逻辑错误
- localStorage被清空
- sessionId判断问题

**检查步骤**：
1. 刷新前检查localStorage中是否有数据：
   ```javascript
   console.log(Object.keys(localStorage).filter(k => k.startsWith('avg-master')));
   ```
2. 查看恢复检测日志中的时间差和sessionId
3. 确认 `shouldRestore()` 返回值

## 🔧 手动调试命令

在控制台中运行这些命令来手动检查状态：

### 检查存储的数据
```javascript
// 查看所有相关存储
Object.keys(localStorage).filter(k => k.startsWith('avg-master')).forEach(key => {
  console.log(key + ':', localStorage.getItem(key));
});

// 查看状态快照
console.log('Snapshot:', localStorage.getItem('avg-master-state-snapshot'));
```

### 手动触发恢复检测
```javascript
// 如果crashRecovery实例可访问
console.log('Should restore:', crashRecovery.shouldRestore());
console.log('Workspace state:', crashRecovery.restoreWorkspaceState());
console.log('Editor state:', crashRecovery.restoreEditorState());
console.log('UI state:', crashRecovery.restoreUIState());
```

### 测试API可用性
```javascript
// 检查inkAPI
console.log('inkAPI available:', !!window.inkAPI);
console.log('closeWindow available:', !!window.inkAPI?.closeWindow);
console.log('onAppWillClose available:', !!window.inkAPI?.onAppWillClose);
```

## 📊 预期结果

### 正常工作的迹象
- [ ] 点击交通灯后看到完整的关闭日志序列
- [ ] 窗口能正常关闭
- [ ] 强制刷新后看到恢复检测日志
- [ ] UI状态完全恢复（视图、侧边栏等）
- [ ] localStorage中有持续更新的数据

### 异常情况
- [ ] 日志序列中断
- [ ] 错误日志出现
- [ ] 恢复检测返回false
- [ ] localStorage为空或过期

## 🎯 下一步行动

根据控制台输出的调试日志，我们可以精确定位问题所在：

1. **如果交通灯日志正常但窗口不关闭**：检查主进程的窗口关闭逻辑
2. **如果没有恢复检测日志**：检查useEffect依赖和执行时机
3. **如果恢复检测为false**：检查时间窗口和sessionId逻辑
4. **如果有恢复日志但状态没恢复**：检查状态设置逻辑

现在请运行 `npm run dev` 并按照上述场景进行测试，然后告诉我控制台的具体输出！