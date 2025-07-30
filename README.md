# AVG Maker - AI时代的文字互动游戏引擎

> **AVG版的** - 专为AI时代设计的低门槛文字互动游戏创作工具

基于AI Native的AVG文字游戏开发引擎，使用强大的Ink脚本语言，让普通人也能够轻松制作精彩的互动小说和AVG游戏，一键打包成STEAM游戏。

![功能演示](./AVG_MAKER.gif)
## 🎯 产品定位

**AVG Maker** 是专为AI时代打造的文字互动游戏引擎，旨在降低游戏创作门槛，让每个人都能轻松创作出色的互动体验：

- 🤖 **AI友好设计**：和AI边聊边写边玩的游戏开发模式
- 📝 **低门槛创作**：直观的可视化界面，无需复杂编程知识
- 🎮 **专业级功能**：支持复杂分支剧情、角色系统、存档机制
- 🚀 **现代化体验**：类似Cursor的专业开发环境
- 📱 **跨平台发布**：一键导出Web版本和桌面应用

## ✨ 核心特性

### 🎨 现代化AVG游戏创作体验
- **AI助理**:  设计角色、构思剧本、调整结构、添加素材
- **智能编辑器**：专业级代码编辑体验，语法高亮、智能补全
- **实时预览**：边写边看，即时查看游戏效果
- **剧情蓝图**：直观展示剧情分支和故事流程，编写更清晰
- **项目管理**：完整的工程化项目结构
- **Ink脚本语言**：强大的分支叙事脚本系统
- **插件系统**：H5插件扩展，支持小游戏和交互组件

### 🛡️ 可靠性保障
- **崩溃恢复**：自动备份工作状态，意外关闭后智能恢复
- **版本管理**：完整的Git集成支持
- **自动保存**：智能防丢失机制

### 📦 发布与分发
- **Web导出**：一键生成可部署的网页版游戏
- **桌面应用**：Electron打包，支持Windows/macOS/Linux
- **资源优化**：自动压缩和优化游戏资源

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 20.0.0
- **npm** 或 **yarn**
- 支持的操作系统：Windows 10+, macOS 10.15+, Ubuntu 18.04+

### 安装与启动

```bash
# 克隆项目
git clone https://github.com/gold3bear/avg-master.git
cd avg-master

# 安装依赖
npm install

# 启动开发环境
npm run dev
```

### 创建你的第一个游戏

1. **启动应用**：运行 `npm run dev`
2. **创建项目**：点击欢迎页面的"创建新项目"
3. **开始创作**：在编辑器中编写你的故事
4. **实时预览**：右侧面板实时显示游戏效果
5. **发布游戏**：完成后一键导出分发

## 📁 项目结构

```
avg-master/
├── 🔧 开发工具
│   ├── bin/                    # Ink编译器 (inklecate)
│   ├── scripts/                # 构建和监控脚本
│   └── electron/               # Electron主进程
├── 🎮 游戏内容
│   ├── story/                  # 示例游戏项目
│   ├── plugins/                # H5插件扩展
│   └── public/                 # 静态资源
├── 💻 前端应用
│   ├── src/
│   │   ├── components/         # UI组件
│   │   │   ├── WelcomeScreen.tsx    # 欢迎页面
│   │   │   ├── Editor.tsx           # 代码编辑器
│   │   │   ├── Preview.tsx          # 游戏预览
│   │   │   ├── NodeGraph.tsx        # 节点可视化
│   │   │   └── ProjectExplorer/     # 项目资源管理器模块
│   │   ├── context/            # 状态管理
│   │   ├── utils/              # 工具函数
│   │   │   ├── AppStartupManager.ts    # 启动管理
│   │   │   ├── crashRecovery.ts        # 崩溃恢复
│   │   │   └── StateManager.ts         # 状态管理
│   │   └── hooks/              # React Hooks
└── 📋 配置文件
    ├── package.json            # 项目配置
    ├── tailwind.config.js      # 样式配置
    └── forge.config.js         # 打包配置
```

## 🎯 使用指南

### 基础创作流程

1. **项目管理**
   - 创建新项目或打开现有项目
   - 支持多文件工程管理
   - 自动保存和版本控制

2. **脚本编写**
   - 使用Ink语言编写互动剧情
   - 实时语法检查和错误提示
   - 智能代码补全和语法高亮

3. **预览测试**
   - 实时预览游戏效果
   - 可视化节点图查看剧情流程
   - 支持断点调试和变量跟踪

### 项目资源管理器

项目侧边栏提供类似VS Code的资源管理体验：

- **文件操作**：创建、重命名、删除与拖拽移动文件
- **Knot树**：自动解析每个`.ink`文件中的Knot并展示
- **变量面板**：汇总项目中的`VAR`/`LIST`声明，方便统一管理
- **一键编译**：可从侧边栏触发全项目编译并查看输出

4. **插件扩展**
   - 开发H5插件增强游戏体验
   - 支持小游戏、动画、音效等
   - 通过简单API集成到主游戏中

5. **发布分发**
   - Web版：生成可直接部署的网页
   - 桌面版：打包为exe/app/deb安装包
   - 自动优化资源和性能

### 高级功能

#### 🛡️ 崩溃恢复系统
- 自动检测意外关闭
- 智能恢复工作状态
- 保护创作成果不丢失

#### 🎨 欢迎页面
- 类似VSCode的专业体验
- 快速访问最近项目
- 便捷的项目创建和管理

#### 📊 开发者工具
- 内置调试控制台
- 性能监控和分析
- 丰富的测试命令

## 🔧 开发与调试

### 常用命令

```bash
# 开发模式 (Vite + Ink监控 + Electron)
npm run dev

# 构建Web版本
npm run build:web

# 打包桌面应用
npm run make

# 代码检查
npm run lint

# 仅监控Ink文件编译
npm run watch:ink
```

### 调试技巧

```javascript
// 开发者控制台命令
// 检查启动模式
await window.__DEV_TESTING__.startup.checkStartupMode()

// 模拟崩溃恢复
window.__DEV_TESTING__.startup.simulateCrashRecovery()

// 清理所有数据
window.__DEV_TESTING__.startup.forceCleanAndReload()
```

### 架构设计

- **单一职责原则**：清晰的模块分离
- **状态管理**：统一的应用状态管理
- **错误恢复**：完善的容错机制
- **扩展性**：插件化架构设计

## 🎮 Ink脚本语言

Ink是专为互动小说设计的强大脚本语言：

```ink
# 你的第一个互动故事
-> start

== start ==
你站在一个神秘的十字路口。
* [向左走] -> left_path
* [向右走] -> right_path
* [直接前进] -> forward_path

== left_path ==
你选择了左边的小径...
-> DONE

== right_path ==
右边传来奇怪的声音...
-> DONE

== forward_path ==
你勇敢地向前走去...
-> DONE
```

### 高级特性

- **变量系统**：支持数值、字符串、布尔值
- **条件逻辑**：复杂的分支判断
- **函数系统**：可重用的脚本片段
- **存档机制**：玩家进度保存
- **多媒体**：图片、音效、动画支持

## 🚀 案例展示

### 成功案例

- **互动小说**：文字冒险游戏
- **教育游戏**：互动学习体验
- **营销游戏**：品牌互动体验
- **艺术项目**：数字叙事作品

### 社区作品

查看我们的[案例库](https://github.com/gold3bear/avg-master/wiki/showcase)了解更多精彩作品。

## 🤝 参与贡献

我们欢迎社区的每一份贡献：

- 🐛 **报告Bug**：[Issues](https://github.com/gold3bear/avg-master/issues)
- 💡 **功能建议**：[Discussions](https://github.com/gold3bear/avg-master/discussions)
- 🔧 **代码贡献**：[Pull Requests](https://github.com/gold3bear/avg-master/pulls)
- 📖 **文档改进**：帮助完善使用指南

### 开发规范

- 遵循TypeScript严格模式
- 使用ESLint和Prettier
- 编写单元测试
- 保持代码注释

## 📞 技术支持

- **官方文档**：[docs.avgmaster.com](https://docs.avgmaster.com)
- **社区论坛**：[community.avgmaster.com](https://community.avgmaster.com)
- **QQ群**：123456789
- **微信群**：添加小助手 avgmaster-helper

## 📄 许可证协议

本项目采用**双重许可证**模式：

### 🆓 非商用免费
- ✅ 个人学习和爱好项目
- ✅ 教育和学术研究使用  
- ✅ 开源项目和非营利组织
- ✅ 非商业性游戏创作

### 💼 商用付费
- 💰 **Indie开发者** - $99/年（年收入<$100K）
- 💰 **专业开发者** - $299/年（年收入<$1M）  
- 💰 **企业授权** - $999/年（无限制）

📧 商业授权咨询：license@avgmaster.com

详细条款请查看 [LICENSE](LICENSE) 文件。

---

## 🤖 AI 对话模块

* 左侧 ActivityBar 新增 **Bot** 选项，点击后在侧边栏打开 AI 聊天面板
* 面板顶部可填写自定义 API 地址，发送消息时将以 `{ message, context }` POST 请求
* 未填写时默认回显输入内容，可用于离线体验

---

## 🌟 核心技术栈

- **前端框架**：React 19 + TypeScript
- **样式系统**：Tailwind CSS 4
- **编辑器**：Monaco Editor
- **桌面框架**：Electron
- **构建工具**：Vite
- **脚本语言**：Ink + inkjs
- **状态管理**：React Context + Custom Hooks

## 📈 路线图

### v1.0 (当前版本)
- ✅ 基础编辑和预览功能
- ✅ 崩溃恢复系统
- ✅ 欢迎页面体验
- ✅ 项目管理系统

### v1.1 (计划中)
- 🔄 AI辅助创作功能
- 🔄 云端同步支持
- 🔄 模板库系统
- 🔄 协作编辑功能

### v2.0 (远期规划)
- 📋 可视化剧情编辑器
- 📋 角色管理系统
- 📋 资源管理器
- 📋 发布平台集成

---

> **让创作变得简单，让故事触动人心**  
> **AVG Maker - 每个人都是游戏创作者**

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

© 2025 AVG Maker Team. Made with ❤️ for storytellers worldwide.