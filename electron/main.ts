// electron/main.ts

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { dirname, join, basename } from 'path';
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
    mainWindow.loadFile(join(__dirname, '../../public/index.html'));
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
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    throw new Error(`Cannot read directory as file: ${filePath}`);
  }
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
ipcMain.handle('compile-ink', async (_, inkText: string, lintOnly: boolean, sourceFilePath?: string) => {
  let workingDir: string;
  let inkFileName: string;
  let cleanupTempFile = false;
  
  if (sourceFilePath) {
    // 如果提供了源文件路径，在原目录中编译以支持INCLUDE语法
    workingDir = dirname(sourceFilePath);
    inkFileName = basename(sourceFilePath);
    
    // 将当前内容写入原文件（临时保存，编译后不影响实际文件）
    const originalContent = fs.existsSync(sourceFilePath) ? fs.readFileSync(sourceFilePath, 'utf-8') : '';
    fs.writeFileSync(sourceFilePath, inkText, 'utf-8');
    cleanupTempFile = true;
    
    // 恢复原文件内容的清理函数
    var restoreOriginal = () => {
      if (cleanupTempFile && originalContent !== inkText) {
        fs.writeFileSync(sourceFilePath, originalContent, 'utf-8');
      }
    };
  } else {
    // 使用系统临时目录（向后兼容）
    const os = await import('os');
    workingDir = join(os.tmpdir(), 'ink-editor-compilation');
    
    // Ensure temp directory exists
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
    }
    
    inkFileName = 'temp.ink';
    const tempInkPath = join(workingDir, inkFileName);
    fs.writeFileSync(tempInkPath, inkText, 'utf-8');
  }

  const inklecatePath = app.isPackaged
    ? join(process.resourcesPath, 'bin/inklecate')
    : join(__dirname, '../../bin/inklecate');

  return new Promise((resolve, reject) => {
    const outputJsonName = inkFileName.replace('.ink', '.json');
    const outputJsonPath = join(workingDir, outputJsonName);
    const args = ['-o', outputJsonName, inkFileName];
    console.log('Main: Starting inklecate with args:', args, 'in dir:', workingDir);
    
    // 添加超时机制
    const timeout = setTimeout(() => {
      console.log('Main: Inklecate compilation timeout');
      proc.kill('SIGTERM');
      reject(new Error('编译超时（30秒）'));
    }, 30000);
    
    const proc = spawn(inklecatePath, args, { cwd: workingDir });
    let stdout = '';
    let stderr = '';

    proc.on('error', (error) => {
      clearTimeout(timeout);
      console.log('Main: Inklecate process error:', error);
      console.error('Main: Inklecate process error:', error);
      reject(new Error(`启动inklecate失败: ${error.message}`));
    });

    proc.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });
    proc.on('close', code => {
      clearTimeout(timeout);
      console.log('Main: Inklecate finished with code:', code);
      console.log('Main: stdout:', stdout);
      console.log('Main: stderr:', stderr);
      
      // 清理函数
      const cleanup = () => {
        clearTimeout(timeout);
        if (sourceFilePath && typeof restoreOriginal === 'function') {
          restoreOriginal();
        }
        // 清理生成的JSON文件（如果在原目录中）
        if (sourceFilePath && fs.existsSync(outputJsonPath)) {
          try {
            fs.unlinkSync(outputJsonPath);
          } catch (e) {
            console.log('Main: Could not clean up output JSON file:', e);
          }
        }
      };

      if (code === 0) {
        // 编译成功，检查是否生成了JSON文件
        try {
          if (fs.existsSync(outputJsonPath)) {
            // 读取生成的JSON文件
            const jsonContent = fs.readFileSync(outputJsonPath, 'utf-8');
            const storyData = JSON.parse(jsonContent);
            console.log('Main: Compilation successful, JSON file generated');
            
            // 如果有警告信息，添加到结果中
            if (stderr.trim()) {
              console.log('Main: Compilation successful with warnings:', stderr);
              storyData.warnings = stderr.trim().split('\n').filter(line => line.trim());
            }
            
            cleanup();
            return resolve(storyData);
          } else {
            // 编译成功但没有生成JSON文件（可能是空文件或其他问题）
            console.log('Main: Compilation succeeded but no JSON file generated');
            const errorMessage = stderr.trim() || 'Compilation succeeded but no output generated';
            cleanup();
            return reject(new Error(errorMessage));
          }
        } catch (e) {
          console.error('Main: Failed to read or parse generated JSON:', e);
          const errorMessage = stderr.trim() || `Failed to process compilation result: ${e instanceof Error ? e.message : String(e)}`;
          cleanup();
          return reject(new Error(errorMessage));
        }
      } else {
        // 编译失败
        console.log('Main: Compilation failed with exit code:', code);
        const errorMessage = stderr.trim() || stdout.trim() || `编译失败，退出码: ${code}`;
        cleanup();
        return reject(new Error(errorMessage));
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

// 读取目录内容，返回文件树结构
ipcMain.handle('read-dir', async (_, dirPath: string) => {
  // 验证路径参数
  if (!dirPath || typeof dirPath !== 'string') {
    console.error('read-dir: Invalid path received:', dirPath);
    throw new Error('Invalid directory path provided');
  }
  
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const nodes = items.map(item => {
      const fullPath = join(dirPath, item.name);
      return {
        name: item.name,
        path: fullPath,
        isDirectory: item.isDirectory(),
        children: item.isDirectory() ? [] : undefined
      };
    });
    // Sort directories first, then files
    return nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('read-dir: Error reading directory:', dirPath, error);
    throw error;
  }
});

// 加载所有可用的 H5 插件
ipcMain.handle('load-plugins', async () => {
  const pluginsDir = app.isPackaged
    ? join(process.resourcesPath, 'plugins')
    : join(__dirname, '../../plugins');
  
  if (!fs.existsSync(pluginsDir)) {
    return [];
  }
  
  const plugins: { id: string; name: string; version: string; description?: string; main: string; path: string }[] = [];
  const items = fs.readdirSync(pluginsDir, { withFileTypes: true });
  
  for (const item of items) {
    if (item.isDirectory()) {
      const manifestPath = join(pluginsDir, item.name, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          plugins.push({
            ...manifest,
            id: item.name,
            path: join(pluginsDir, item.name)
          });
        } catch (e) {
          console.warn(`Failed to load plugin manifest: ${manifestPath}`, e);
        }
      }
    }
  }
  
  return plugins;
});
