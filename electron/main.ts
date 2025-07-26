// electron/main.ts

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { dirname, join } from 'path';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import fsExtra from 'fs-extra';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';


// —— 在 ESM（"type":"module"）里手动定义 __dirname/__filename —— 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    // 生产环境加载打包后的静态文件
    mainWindow.loadFile(join(__dirname, '../public/index.html'));
  } else {
    // 开发环境加载 Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // macOS 上除非用户显式 Cmd+Q 才退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS：点击 Dock 图标时如果没有窗口则重建
  if (mainWindow === null) {
    createWindow();
  }
});

// —— IPC Handlers —— //

// 打开本地 Ink 项目文件夹
ipcMain.handle('open-project', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return filePaths[0] || null;
});

// 读取指定文件内容
ipcMain.handle('read-file', (_, filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8');
});

// 写入内容到指定文件
ipcMain.handle('write-file', (_, filePath: string, content: string) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});

// 监听指定文件列表的变更，发送 'file-changed' 通知
ipcMain.handle('watch-files', (_, paths: string[]) => {
  const watcher = chokidar.watch(paths, { ignoreInitial: true });
  watcher.on('change', changedPath => {
    mainWindow?.webContents.send('file-changed', changedPath);
  });
  return true;
});

// 编译或 lint Ink 源码
ipcMain.handle('compile-ink', async (_, inkText: string, lintOnly: boolean) => {
  // 确定工作目录（story 目录）
  const storyDir = app.isPackaged
    ? join(process.resourcesPath, 'story')
    : join(__dirname, '../story');
  const tempInkPath = join(storyDir, 'temp.ink');
  fs.writeFileSync(tempInkPath, inkText, 'utf-8');

  const inklecatePath = app.isPackaged
    ? join(process.resourcesPath, 'bin/inklecate')
    : join(__dirname, '../bin/inklecate');

  return new Promise((resolve, reject) => {
    const args = ['--export', 'json', 'temp.ink'];
    // 如果只做 lint，可以省略 --export，或者同样导出再忽略结果
    const proc = spawn(inklecatePath, args, { cwd: storyDir });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });
    proc.on('close', code => {
      if (code !== 0) {
        return reject(stderr);
      }
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (e) {
        reject(e);
      }
    });
  });
});

// 导出游戏包：'web' 或 'desktop'
ipcMain.handle('export-game', async (_, mode: 'web' | 'desktop') => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: mode === 'web' ? '导出为 Web 游戏包' : '导出为桌面安装包',
    defaultPath: app.getPath('desktop'),
    buttonLabel: '确定',
    properties: mode === 'web' ? ['createDirectory'] : undefined
  });
  if (canceled || !filePath) return { canceled: true };

  const projectRoot = app.isPackaged
    ? process.resourcesPath
    : app.getAppPath();

  if (mode === 'web') {
    // 构建前端静态包
    spawnSync('npm', ['run', 'build:web'], { cwd: projectRoot, stdio: 'inherit' });
    // 拷贝 dist 到目标文件夹
    await fsExtra.copy(join(projectRoot, 'dist'), filePath);
    return { success: true, path: filePath };
  } else {
    // 打包 Electron 桌面应用
    spawnSync('npm', ['run', 'make'], { cwd: projectRoot, stdio: 'inherit' });
    const outDir = join(projectRoot, 'out', 'make');
    return { success: true, path: outDir };
  }
});
