# VS Code风格的数据恢复测试指南

## 🎯 实现的核心改进

我们参考VS Code的实现方式，重新设计了数据恢复系统：

### 核心理念转变
- **从"防止刷新"到"无惧刷新"**：不再依赖拦截快捷键，而是让数据刷新后能可靠恢复
- **多层次持久化**：使用localStorage、sessionStorage、IndexedDB三重保障
- **智能恢复检测**：基于时间戳和会话ID的智能判断
- **分层状态管理**：工作区、编辑器、UI状态分别管理

### 🔧 技术实现

#### 1. VS Code风格的状态分层
```typescript
interface WorkspaceState {
  projectPath: string | null;
  recentProjects: string[];
  lastAccessed: number;
}

interface EditorState {
  activeFile: string | null;
  openFiles: string[];
  fileStates: Record<string, FileState>;
}

interface UIState {
  view: 'preview' | 'graph';
  activeTab: SidebarTab;
  sidebarVisible: boolean;
}
```

#### 2. 多重持久化机制
- **实时保存**：每5秒自动保存状态快照
- **状态变化保存**：每次状态变化100ms后保存
- **事件触发保存**：beforeunload、pagehide、visibilitychange事件
- **三重存储**：localStorage、sessionStorage、IndexedDB

#### 3. 智能恢复检测
- **时间窗口检测**：5分钟内的状态变化被视为有效
- **会话ID比较**：不同sessionId表示可能的页面刷新
- **多源恢复**：优先级为 VS Code风格 > 紧急备份 > 崩溃恢复

## 🧪 测试场景

### 场景1：开发者工具关闭时的Cmd+R
1. **操作**：正常使用应用，然后按Cmd+R
2. **预期**：页面刷新后状态完全恢复
3. **测试要点**：UI状态、打开的文件、项目路径

### 场景2：开发者工具打开时的Cmd+R（关键场景）
1. **操作**：
   - 打开开发者工具 (F12)
   - 进行一些操作（切换视图、打开文件等）
   - 按Cmd+R强制刷新
2. **预期**：刷新后所有状态都能恢复
3. **测试要点**：这是VS Code能做到但我们之前做不到的场景

### 场景3：浏览器崩溃恢复
1. **操作**：
   - 进行一些操作
   - 强制关闭浏览器标签页
   - 重新打开应用
2. **预期**：能检测到崩溃并提供恢复选项

### 场景4：长时间无操作后刷新
1. **操作**：
   - 打开应用并进行操作
   - 等待超过5分钟
   - 刷新页面
2. **预期**：状态数据过期，不提供恢复

## 📋 详细测试步骤

### 准备工作
1. 启动应用：`npm run dev`
2. 打开项目并进行一些操作：
   - 选择项目文件夹
   - 打开几个.ink文件
   - 切换视图模式（预览/图表）
   - 切换侧边栏标签
   - 调整界面布局

### 测试执行

#### 测试1：基础刷新恢复
```bash
# 1. 进行上述准备工作
# 2. 按Cmd+R刷新页面
# 3. 观察控制台输出
```

**预期的控制台输出**：
```
🔄 VS Code风格恢复：检测到需要恢复的状态
🎨 恢复UI状态: {view: "preview", activeTab: "explorer", sidebarVisible: true}
📝 恢复编辑器状态: {activeFile: "/path/to/file.ink", ...}
📁 恢复工作区状态: {projectPath: "/path/to/project", ...}
```

#### 测试2：开发者工具刷新测试
```bash
# 1. 按F12打开开发者工具
# 2. 进行操作（这是关键！）
# 3. 在开发者工具打开的状态下按Cmd+R
# 4. 查看是否能恢复状态
```

#### 测试3：存储机制验证
在控制台中运行：
```javascript
// 查看当前存储的状态
console.log('localStorage:', localStorage.getItem('avg-master-workspace-state'));
console.log('sessionStorage:', sessionStorage.getItem('avg-master-workspace-state'));

// 查看状态快照
console.log('Snapshot:', localStorage.getItem('avg-master-state-snapshot'));
```

### 测试指标

#### ✅ 成功指标
- [ ] 页面刷新后UI状态完全恢复
- [ ] 开发者工具打开时刷新也能恢复
- [ ] 控制台显示正确的恢复日志
- [ ] 不同存储机制都有数据备份
- [ ] 文件编辑状态得到保持

#### ❌ 失败情况处理
1. **状态没有恢复**：检查控制台是否有`VS Code风格恢复`的日志
2. **部分状态丢失**：检查具体哪个层级的状态未恢复
3. **控制台报错**：查看存储权限或数据格式问题

## 🔍 调试工具

### 控制台命令
```javascript
// 手动触发状态保存
window.__DEV_TESTING__.crashRecovery.forceBackup('/path/to/file.ink', 'content');

// 查看恢复数据
window.__DEV_TESTING__.crashRecovery.showRecoveryData();

// 清除所有数据
window.__DEV_TESTING__.crashRecovery.clearAllData();
```

### 查看存储状态
```javascript
// 检查所有相关的localStorage项目
Object.keys(localStorage).filter(key => key.startsWith('avg-master')).forEach(key => {
  console.log(key, localStorage.getItem(key));
});
```

## 🎯 VS Code对比测试

为了验证我们的实现确实达到了VS Code的水平：

1. **打开VS Code**
2. **打开开发者工具** (Help > Toggle Developer Tools)
3. **进行一些操作**（打开文件、修改设置等）
4. **按Cmd+R刷新**
5. **观察VS Code是否能恢复状态**

我们的应用应该表现出相同的恢复能力。

## 📈 性能考虑

- **存储频率**：每5秒 + 状态变化时
- **存储大小**：每个状态包约1-5KB
- **清理机制**：超过24小时的数据自动清理
- **错误处理**：存储失败不影响正常功能

## 🚨 已知限制

1. **IndexedDB支持**：某些隐私模式可能不支持
2. **存储配额**：大量数据可能达到浏览器限制
3. **跨域限制**：不同域名间不共享恢复数据

现在可以按照这个指南进行全面测试，验证我们的VS Code风格数据恢复是否真正有效！