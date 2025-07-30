# AVG Maker 统一API抽象层

## 概述

统一API抽象层为AVG Maker提供了跨平台的API访问接口，让组件层面无需关心底层是Electron IPC还是HTTP请求。

## 特性

- 🔄 **平台自适应**: 自动检测运行环境（Electron/Browser）
- 🛡️ **类型安全**: 完整的TypeScript类型定义
- ⚡ **统一接口**: 相同的API调用方式，不同的底层实现
- 🔧 **功能检测**: 运行时检查功能可用性
- 🎯 **错误处理**: 统一的错误处理和超时机制
- 📱 **响应式**: 提供React Hook支持

## 架构设计

```
组件层 (React Components)
    ↓
统一API接口 (IInkAPI)
    ↓
平台适配器 (Electron/Browser Adapter)
    ↓
底层实现 (IPC/HTTP)
```

## 使用方法

### 1. 基础使用

```typescript
import { api } from '@/api';

// 读取文件
const content = await api.readFile('/path/to/file.ink');

// 编译Ink
const result = await api.compileInk(content, false, '/path/to/file.ink');

// 加载插件
const plugins = await api.loadPlugins();
```

### 2. React Hook使用

```typescript
import { useInkAPI } from '@/api';

function MyComponent() {
  const { api, isReady, platform, safeCall, isFeatureAvailable } = useInkAPI();

  const handleCompile = async () => {
    if (!isFeatureAvailable('compileInk')) {
      console.warn('编译功能在当前平台不可用');
      return;
    }

    const result = await safeCall('compileInk', source, false, filePath);
    if (result.success) {
      console.log('编译成功:', result.data);
    } else {
      console.error('编译失败:', result.error);
    }
  };

  return (
    <div>
      <p>平台: {platform}</p>
      <p>状态: {isReady ? '就绪' : '加载中'}</p>
      <button onClick={handleCompile}>编译</button>
    </div>
  );
}
```

### 3. 功能检测

```typescript
import { isFeatureAvailable } from '@/api';

// 检查特定功能是否可用
if (isFeatureAvailable('openProject', 'electron')) {
  // 只在Electron环境中显示"打开项目"按钮
  showOpenProjectButton();
}

if (isFeatureAvailable('getCurrentFile', 'browser')) {
  // 只在浏览器环境中启动文件轮询
  startFilePolling();
}
```

### 4. 平台特定功能

```typescript
import { detectPlatform, api } from '@/api';

const platform = detectPlatform();

if (platform === 'electron') {
  // Electron特有功能
  await api.openPreviewWindow('/path/to/file.ink');
  await api.minimizeWindow();
} else if (platform === 'browser') {
  // 浏览器特有功能
  const currentFile = await api.getCurrentFile();
  await api.setCurrentFile('/path/to/file.ink');
}
```

### 5. 错误处理

```typescript
import { inkAPI } from '@/api';

// 使用safeCall进行安全调用
const result = await inkAPI.safeCall('compileInk', source, false, filePath);

if (result.success) {
  console.log('编译结果:', result.data);
} else {
  console.error('编译错误:', result.error);
  // 显示用户友好的错误信息
  showErrorMessage(result.error);
}
```

## 平台差异

### Electron平台
- ✅ 完整的文件系统访问
- ✅ 项目管理功能
- ✅ 窗口控制
- ✅ 本地编译
- ✅ 游戏导出
- ✅ 系统对话框

### 浏览器平台
- ❌ 文件系统访问受限
- ❌ 项目管理不可用
- ❌ 窗口控制不可用
- ✅ 远程编译（通过HTTP API）
- ❌ 游戏导出不可用
- ⚠️ 简化的对话框

## API参考

### 核心接口

```typescript
interface IInkAPI {
  // 项目管理
  openProject(): Promise<string | null>;
  loadProjectPath(projectPath: string): Promise<string | null>;
  
  // 文件操作
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<boolean>;
  readDir(dirPath: string): Promise<FileNode[]>;
  
  // Ink编译
  compileInk(source: string, lintOnly?: boolean, sourceFilePath?: string): Promise<CompilationResult>;
  
  // 插件系统
  loadPlugins(): Promise<PluginManifest[]>;
  
  // 更多API...
}
```

### 类型定义

```typescript
interface CompilationResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}
```

## 最佳实践

1. **功能检测优先**: 始终检查功能可用性再调用
2. **错误处理**: 使用safeCall或try-catch处理错误
3. **平台适配**: 根据平台提供不同的用户体验
4. **性能考虑**: 浏览器模式下避免频繁的API调用
5. **类型安全**: 充分利用TypeScript类型系统

## 扩展新平台

要添加新平台支持：

1. 在`types.ts`中添加新的平台类型
2. 创建新的适配器类实现`IInkAPI`接口
3. 在`factory.ts`中添加平台检测和创建逻辑
4. 更新`platform.ts`中的功能可用性映射

## 测试

```typescript
// 测试API功能
import { APIFactory, detectPlatform } from '@/api';

const api = APIFactory.createAPI();
const platform = detectPlatform();

console.log('当前平台:', platform);
console.log('API实例:', api);
```