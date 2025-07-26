````markdown
# 本地 Ink 编辑器 (my-ink-editor)

一个基于 **React + Tailwind CSS + Electron** 的本地 Ink 剧本编辑与运行工具，支持：

- **多文件工程管理**：打开／浏览本地 `.ink` 项目目录  
- **代码编辑**：Monaco Editor 提供语法高亮、折叠、补全、错误标记  
- **实时预览**：inkjs 运行时渲染文本分支，防抖自动刷新  
- **节点可视化**：力导向／树状图展示剧本节点与跳转关系  
- **语法检测**：依托本地 `inklecate`，将编译错误在编辑区打波浪线  
- **H5 插件**：自定义 H5 小游戏／页面，可在剧本中通过 `~ runPlugin()` 调用  
- **导出打包**：一键生成静态网页包 (ZIP)，或打包成跨平台桌面应用 (Electron)

---

## 🚀 快速上手

### 环境准备

- **Node.js** ≥16  
- **npm** 或 **yarn**  
- TypeScript（全局或项目内）  
- （可选）VSCode + 推荐插件：ESLint、Prettier、Tailwind CSS IntelliSense

### 克隆 & 安装

```bash
git clone https://github.com/your-org/my-ink-editor.git
cd my-ink-editor
npm install
````

### 目录结构

```
my-ink-editor/
├── bin/                   # inklecate、DLL 等本地编译器
├── story/                 # 示例或当前打开的 .ink 项目
│   └── ….ink
├── plugins/               # (可选) 自定义 H5 插件
├── electron/              # Electron 主／预加载脚本
│   ├── main.ts
│   └── preload.ts
├── public/                # Vite 静态资源 & 编译产物 (index.html, story.json)
├── scripts/               # ink 编译 & watch 脚本 (TypeScript)
│   ├── compile-ink.ts
│   └── watch-ink.ts
├── src/                   # 前端源码 (React + Tailwind)
│   ├── components/        # Editor, Preview, NodeGraph, ProjectExplorer…
│   ├── context/           # InkContext, ProjectContext
│   ├── utils/             # fsApi, inkApi, storyGraph, downloadPackage…
│   ├── App.tsx
│   └── index.tsx
├── forge.config.js        # Electron Forge 配置
├── tailwind.config.js     
├── tsconfig.json          
└── package.json           
```

---

## 📦 常用脚本

```bash
# 本地开发模式：同时启动 Vite、Ink Watch、Electron（开发者模式）
npm run dev

# 只监听 story/*.ink 自动编译到 public/story.json
npm run watch:ink

# 生成前端静态包 (dist/)
npm run build:web

# 打包为跨平台桌面应用 (.app/.exe/.deb 等)
npm run make

# 一次性：先构建静态包，再打包 Electron
npm run build

# 代码格式 & 静态检查
npm run lint
```

> **提示**：`npm run dev` 内部使用 [`concurrently`](https://github.com/open-cli-tools/concurrently) 依次启动：
>
> 1. `npm run watch:ink`
> 2. `vite`（开发服务器）
> 3. `npm run electron:dev` （等待 Vite 启动后拉起 Electron）

---

## 🔨 开发 & 调试流程

1. **启动**

   ```bash
   npm run dev
   ```

   * Vite: 监听 `src/`、热更新前端
   * watch-ink: 监听 `story/**/*.ink`，改动后调用 `inklecate` 输出 `public/story.json`
   * Electron: 打开桌面窗口，加载 `http://localhost:5173`

2. **打开本地项目**

   * 点击左上角 “打开项目” 按钮
   * 选中含 `.ink` 文件的目录
   * 左侧文件树自动列出所有 `.ink`，点击即可加载到编辑器

3. **编辑 & 保存**

   * Monaco 编辑器内自动防抖语法检测 & 预览
   * `Ctrl+S` 或 “保存” 按钮：写回对应 `.ink` 文件
   * 外部修改（Git、其他编辑器）会触发文件变更提示

4. **实时预览**

   * 默认防抖 500ms 后用 inkjs 重新渲染
   * 可切换“预览”/“节点图”视图
   * 手动点击 “运行” 强制一次完整编译

5. **插件扩展**

   * 在 `plugins/` 下创建子目录，加入 `manifest.json` + `index.html`
   * Ink 剧本中用 `~ runPlugin("plugin-id", "{\"foo\":\"bar\"}")` 调用
   * 预览区自动弹出 `<iframe>` 运行 H5 小游戏

6. **导出 & 分发**

   * **网页版**：点击“下载游戏包 (ZIP)” → 浏览器自动打包所有静态资源
   * **桌面版**：点击“导出桌面版安装包” → Electron Forge 打包并弹窗提示路径

---

## 🛠 调试技巧

* **前端调试**：Electron 打开后 `Ctrl+Shift+I` 唤出 DevTools
* **主进程调试**：在 VSCode 中添加以下 `.vscode/launch.json`：

  ```jsonc
  {
    "version": "0.2.0",
    "configurations": [
      {
        "type": "pwa-node",
        "request": "launch",
        "name": "Debug Electron Main",
        "program": "${workspaceFolder}/node_modules/.bin/electron",
        "args": ["."],
        "runtimeArgs": ["--inspect=5858"],
        "cwd": "${workspaceFolder}"
      }
    ]
  }
  ```
* **日志**：主进程 `console.log` 输出到终端；Renderer `console.log` 输出到 DevTools
* **语法检测**：修改 `scripts/compile-ink.ts` 里的参数或 `InkContext.lintInk` 的正则，即可自定义错误定位

---

## 📚 参考链接

* [inkjs](https://github.com/y-lohse/inkjs)：Ink 运行时
* [inklecate](https://github.com/inkle/ink)：官方编译器
* [Monaco Editor](https://github.com/microsoft/monaco-editor)
* [react-force-graph-2d](https://github.com/vasturiano/react-force-graph)
* [Electron Forge](https://www.electronforge.io/)
* [Tailwind CSS](https://tailwindcss.com/)

---

> 欢迎 **Issues**／**PR**，一起把本地 Ink 编辑器打造成最强工具！
> © 2025 Your Name / Your Organization

