// electron/main.ts

import { app, BrowserWindow, ipcMain, dialog, session, shell, net } from 'electron';
import { dirname, join, basename } from 'path';
import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import fsExtra from 'fs-extra';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import os from 'node:os';


// 编译结果类型定义
interface CompilationResult {
  'compile-success': boolean;
  inkVersion: number;
  root: string;
  listDefs: any;
  warnings?: string[];
}


// —— 在 ESM（"type":"module"）里手动定义 __dirname/__filename —— 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let previewWindow: BrowserWindow | null = null;

// 安全的日志输出函数，避免EPIPE错误
const safeLog = (message: string, ...args: any[]) => {
  try {
    console.log(message, ...args);
  } catch (error) {
    // 忽略EPIPE等管道错误，避免主进程崩溃
    if (error instanceof Error && !error.message.includes('EPIPE')) {
      // 只有非EPIPE错误才重新抛出
      console.error('Logging error:', error);
    }
  }
};

const safeError = (message: string, ...args: any[]) => {
  try {
    console.error(message, ...args);
  } catch (error) {
    // 忽略EPIPE等管道错误
    if (error instanceof Error && !error.message.includes('EPIPE')) {
      console.error('Error logging error:', error);
    }
  }
};

// 预览服务器相关变量
let previewServer: any = null;
let currentPreviewFile: string | null = null;
let lastRefreshTime: number = Date.now();

// 全局异常处理，防止主进程崩溃
process.on('uncaughtException', (error) => {
  if (error.message.includes('EPIPE') || error.message.includes('ECONNRESET')) {
    // 忽略管道相关的错误，这些通常是日志输出或网络连接问题
    safeLog('🔧 Main: Ignoring EPIPE/ECONNRESET error:', error.message);
    return;
  }
  
  safeError('🚨 Main: Uncaught Exception:', error);
  
  // 对于其他严重错误，记录日志但不退出应用
  if (!app.isPackaged) {
    // 开发环境下可以选择退出
    safeError('🚨 Main: Development mode - not exiting due to uncaught exception');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  safeError('🚨 Main: Unhandled Rejection at:', promise, 'reason:', reason);
  // 不退出应用，只记录日志
});

// SSR预览页面生成函数
async function generateSSRPreviewPage(): Promise<string> {
  let storyJson = null;
  let fileName = '未选择文件';
  let errorMessage = null;
  
  if (currentPreviewFile) {
    try {
      console.log('🔄 SSR: Compiling story for preview:', currentPreviewFile);
      fileName = basename(currentPreviewFile);
      
      // 读取文件内容
      const source = fs.readFileSync(currentPreviewFile, 'utf8');
      
      // 编译故事
      const inklecatePath = app.isPackaged
        ? join(process.resourcesPath, 'bin/inklecate')
        : join(__dirname, '../../bin/inklecate');
      
      const os = await import('os');
      const originalDir = dirname(currentPreviewFile);
      const tempRoot = join(os.tmpdir(), 'ssr-compilation');
      const workingDir = join(tempRoot, 'project');
      
      if (!fs.existsSync(workingDir)) {
        fs.mkdirSync(workingDir, { recursive: true });
      }
      
      const inkFileName = basename(currentPreviewFile);
      const tempInkPath = join(workingDir, inkFileName);
      fs.writeFileSync(tempInkPath, source, 'utf-8');
      
      // 复制同目录下的其他ink文件
      try {
        const siblingFiles = fs.readdirSync(originalDir);
        for (const file of siblingFiles) {
          if (file.endsWith('.ink') && file !== inkFileName) {
            const srcPath = join(originalDir, file);
            const destPath = join(workingDir, file);
            if (fs.existsSync(srcPath)) {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        }
      } catch (err) {
        console.warn('SSR: Warning - could not copy sibling ink files:', err);
      }
      
      const outputJsonName = inkFileName.replace('.ink', '.json');
      const outputJsonPath = join(workingDir, outputJsonName);
      
      // 编译
      const args = ['-o', outputJsonName, inkFileName];
      
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(inklecatePath, args, { cwd: workingDir });
        let stderr = '';
        
        proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
        proc.on('close', (code) => {
          if (code === 0 && fs.existsSync(outputJsonPath)) {
            const compiledContent = fs.readFileSync(outputJsonPath, 'utf8');
            storyJson = JSON.parse(compiledContent);
            console.log('✅ SSR: Story compiled successfully');
            
            // 清理临时文件
            try {
              if (fs.existsSync(tempInkPath)) fs.unlinkSync(tempInkPath);
              if (fs.existsSync(outputJsonPath)) fs.unlinkSync(outputJsonPath);
            } catch (cleanupError) {
              console.warn('SSR: Cleanup warning:', cleanupError);
            }
            
            resolve();
          } else {
            errorMessage = stderr || 'Compilation failed';
            console.error('❌ SSR: Compilation failed:', errorMessage);
            reject(new Error(errorMessage));
          }
        });
      });
      
    } catch (error) {
      console.error('❌ SSR: Error compiling story:', error);
      errorMessage = error instanceof Error ? error.message : String(error);
    }
  }
  
  // 生成HTML页面
  return generatePreviewHTML(storyJson, fileName, errorMessage);
}

// 生成预览HTML
function generatePreviewHTML(storyJson: any, fileName: string, errorMessage: string | null): string {
  const storyData = storyJson ? JSON.stringify(storyJson) : 'null';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AVG Maker - ${fileName}</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            margin: 0; padding: 0; background: #1e1e1e; color: white; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            height: 100vh; overflow: hidden;
        }
        .app-container { height: 100vh; display: flex; flex-direction: column; }
        .header {
            background: #2d2d2d; padding: 12px 20px; border-bottom: 1px solid #444;
            display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
        }
        .title { margin: 0; font-size: 18px; font-weight: 600; }
        .status { font-size: 12px; color: #888; background: #333; padding: 4px 8px; border-radius: 4px; }
        .preview-container { flex: 1; padding: 20px; overflow-y: auto; background: #1e1e1e; }
        .story-content { max-width: 800px; margin: 0 auto; line-height: 1.6; }
        .story-text { margin-bottom: 16px; font-size: 16px; color: #f0f0f0; white-space: pre-wrap; }
        .choices { margin-top: 24px; }
        .choice-button {
            display: block; width: 100%; padding: 12px 16px; margin-bottom: 8px;
            background: #3d3d3d; border: 1px solid #555; color: white; border-radius: 6px;
            cursor: pointer; text-align: left; font-size: 14px; transition: all 0.2s ease; font-family: inherit;
        }
        .choice-button:hover { background: #4d4d4d; border-color: #666; transform: translateY(-1px); }
        .choice-button:active { transform: translateY(0); }
        .error { color: #ff6b6b; text-align: center; margin-top: 60px; }
        .refresh-hint { margin-top: 20px; font-size: 14px; color: #888; text-align: center; }
        @media (max-width: 768px) {
            .header { padding: 10px 15px; }
            .preview-container { padding: 15px; }
            .story-text { font-size: 15px; }
            .choice-button { font-size: 13px; padding: 10px 14px; }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="header">
            <h1 class="title">AVG Maker - 浏览器预览</h1>
            <div class="status">${fileName}</div>
        </div>
        <div class="preview-container">
            <div class="story-content" id="story-content">
                ${errorMessage ? 
                    `<div class="error">❌ 加载故事失败<br><small>${errorMessage}</small></div>` :
                    '<div>正在加载故事...</div>'
                }
            </div>
            <div class="refresh-hint">
                <small>💡 在主应用中选择其他文件后，刷新此页面查看新内容</small>
            </div>
        </div>
    </div>
    
    <script src="https://unpkg.com/inkjs@2.3.2/dist/ink.js"></script>
    <script>
        // 嵌入的故事数据
        window.STORY_DATA = ${storyData};
        window.FILE_NAME = '${fileName}';
        window.ERROR_MESSAGE = ${errorMessage ? `'${errorMessage}'` : 'null'};
        
        const contentEl = document.getElementById('story-content');
        let currentStory = null;
        
        // HTML转义
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // 解析HTML内容（保留HTML标签，只转义不需要的字符）
        function parseHtmlContent(text) {
            // 基本的HTML标签白名单
            const allowedTags = ['<b>', '</b>', '<i>', '</i>', '<em>', '</em>', '<strong>', '</strong>', 
                               '<u>', '</u>', '<s>', '</s>', '<br>', '<br/>', '<br />', 
                               '<p>', '</p>', '<div>', '</div>', '<span>', '</span>',
                               '<h1>', '</h1>', '<h2>', '</h2>', '<h3>', '</h3>',
                               '<ul>', '</ul>', '<ol>', '</ol>', '<li>', '</li>'];
            
            // 简单的HTML标签解析 - 保留允许的标签，转义其他内容
            let result = text;
            
            // 首先保护已有的HTML标签
            const tagProtection = {};
            let tagCounter = 0;
            
            // 匹配所有HTML标签
            result = result.replace(/<[^>]+>/g, (match) => {
                const lowerMatch = match.toLowerCase();
                // 检查是否是允许的标签
                if (allowedTags.some(tag => lowerMatch === tag.toLowerCase() || 
                    (lowerMatch.startsWith('<') && lowerMatch.includes(' ') && 
                     allowedTags.some(allowedTag => lowerMatch.startsWith(allowedTag.toLowerCase().split('>')[0]))))) {
                    const placeholder = \`__HTML_TAG_\${tagCounter}__\`;
                    tagProtection[placeholder] = match;
                    tagCounter++;
                    return placeholder;
                }
                // 不允许的标签，转义显示
                return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            });
            
            // 转义其他特殊字符，但保留换行
            result = result.replace(/&/g, '&amp;')
                          .replace(/"/g, '&quot;')
                          .replace(/'/g, '&#39;');
            
            // 恢复保护的HTML标签
            Object.keys(tagProtection).forEach(placeholder => {
                result = result.replace(placeholder, tagProtection[placeholder]);
            });
            
            // 将换行符转换为<br>标签
            result = result.replace(/\\n/g, '<br>');
            
            return result;
        }
        
        // 渲染故事内容
        function renderStory(story) {
            try {
                const output = [];
                while (story.canContinue) {
                    const line = story.Continue();
                    if (line && line.trim()) {
                        output.push(line.trim());
                    }
                }
                
                let html = '';
                
                // 渲染文本 - 支持HTML标签
                if (output.length > 0) {
                    html += output.map(line => 
                        \`<div class="story-text">\${parseHtmlContent(line)}</div>\`
                    ).join('');
                }
                
                // 渲染选择 - 选择文本也支持HTML
                if (story.currentChoices && story.currentChoices.length > 0) {
                    html += '<div class="choices">';
                    story.currentChoices.forEach((choice, index) => {
                        html += \`<button class="choice-button" onclick="makeChoice(\${index})">\${parseHtmlContent(choice.text)}</button>\`;
                    });
                    html += '</div>';
                } else if (output.length === 0) {
                    html = '<div class="story-text">📖 故事结束</div>';
                }
                
                if (html === '') {
                    html = '<div class="story-text">暂无内容</div>';
                }
                
                contentEl.innerHTML = html;
            } catch (error) {
                console.error('Error rendering story:', error);
                contentEl.innerHTML = \`<div class="error">渲染错误: \${error.message}</div>\`;
            }
        }
        
        // 处理选择
        window.makeChoice = function(index) {
            if (!currentStory || !currentStory.currentChoices || !currentStory.currentChoices[index]) {
                console.error('Invalid choice:', index);
                return;
            }
            
            try {
                currentStory.ChooseChoiceIndex(index);
                renderStory(currentStory);
            } catch (error) {
                console.error('Error making choice:', error);
                contentEl.innerHTML = \`<div class="error">选择处理错误: \${error.message}</div>\`;
            }
        };
        
        // 初始化游戏
        function initGame() {
            if (window.ERROR_MESSAGE) {
                // 已经显示错误信息，无需处理
                return;
            }
            
            if (!window.STORY_DATA) {
                contentEl.innerHTML = '<div class="error">没有故事数据可显示<br><small>请在主应用中选择一个.ink文件</small></div>';
                return;
            }
            
            try {
                console.log('🎮 SSR: Starting story with embedded data');
                currentStory = new window.inkjs.Story(window.STORY_DATA);
                renderStory(currentStory);
            } catch (error) {
                console.error('Error initializing story:', error);
                contentEl.innerHTML = \`<div class="error">故事初始化失败: \${error.message}</div>\`;
            }
        }
        
        // 自动刷新检测
        let lastKnownRefreshTime = ${lastRefreshTime};
        
        function checkForRefresh() {
            fetch('/api/refresh-time')
                .then(response => response.json())
                .then(data => {
                    if (data.refreshTime > lastKnownRefreshTime) {
                        console.log('🔄 Content refresh detected, reloading page...');
                        window.location.reload();
                    }
                })
                .catch(error => {
                    console.warn('Refresh check failed:', error);
                });
        }
        
        // 每2秒检查一次是否需要刷新
        setInterval(checkForRefresh, 2000);
        
        // 等待inkjs加载完成后初始化
        if (window.inkjs) {
            initGame();
        } else {
            window.addEventListener('load', () => {
                setTimeout(initGame, 100); // 确保inkjs完全加载
            });
        }
    </script>
</body>
</html>`;
}

// 启动预览服务器
async function startPreviewServer() {
  const http = await import('http');
  const url = await import('url');
  
  console.log('🌐 Starting preview server on port 3001...');
  
  previewServer = http.createServer(async (req, res) => {
    const reqUrl = url.parse(req.url || '', true);
    const pathname = reqUrl.pathname;
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // SSR预览页面
    if (pathname === '/' || pathname === '/preview') {
      try {
        const htmlContent = await generateSSRPreviewPage();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.writeHead(200);
        res.end(htmlContent);
        return;
      } catch (error) {
        console.error('❌ Preview server: Error generating SSR page:', error);
        res.writeHead(500);
        res.end(`Error generating preview: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }
    }
    
    // 刷新时间戳API
    if (pathname === '/api/refresh-time') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ refreshTime: lastRefreshTime }));
      return;
    }
    
    // 404处理
    res.writeHead(404);
    res.end('Not Found');
  });
  
  previewServer.listen(3001, () => {
    console.log('✅ Preview server started: http://localhost:3001/preview');
  });
  
  previewServer.on('error', (error: any) => {
    console.error('❌ Preview server error:', error);
  });
}

// 停止预览服务器
function stopPreviewServer() {
  if (previewServer) {
    previewServer.close();
    previewServer = null;
    console.log('🛑 Preview server stopped');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined, // macOS 隐藏标题栏但保留traffic lights
    frame: process.platform !== 'darwin', // 非 macOS 显示窗口框架
    backgroundColor: '#1e1e1e', // 设置窗口背景色为深色，避免白屏闪烁
    show: false, // 初始不显示窗口，等待ready-to-show事件
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !app.isPackaged, // 仅在开发环境禁用webSecurity
      devTools: !app.isPackaged, // 仅在开发环境允许DevTools
    },
  });

  // 禁用刷新快捷键，防止意外数据丢失
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // 禁用 Cmd+R (macOS) 和 Ctrl+R (Windows/Linux)
    if ((input.meta && input.key === 'r') || (input.control && input.key === 'r')) {
      event.preventDefault();
    }
    // 禁用 F5
    if (input.key === 'F5') {
      event.preventDefault();
    }
    // 禁用 Cmd+Shift+R (macOS) 和 Ctrl+Shift+R (Windows/Linux) - 强制刷新
    if ((input.meta && input.shift && input.key === 'R') || (input.control && input.shift && input.key === 'R')) {
      event.preventDefault();
    }
  });

  // 监听ready-to-show事件，在页面准备好后再显示窗口
  mainWindow.once('ready-to-show', () => {
    safeLog('🚪 Main: 窗口准备完成，显示窗口');
    if (mainWindow && !mainWindow.isDestroyed()) {
      // 可选：添加淡入效果（仅macOS）
      if (process.platform === 'darwin') {
        mainWindow.setOpacity(0);
        mainWindow.show();
        // 快速淡入动画
        let opacity = 0;
        const fadeIn = setInterval(() => {
          opacity += 0.05; // 稍微慢一点的淡入
          if (opacity >= 1) {
            mainWindow?.setOpacity(1);
            clearInterval(fadeIn);
          } else {
            mainWindow?.setOpacity(opacity);
          }
        }, 16); // ~60fps
      } else {
        // 其他平台直接显示
        mainWindow.show();
      }
    }
  });

  if (app.isPackaged) {
    // 生产环境加载打包后的静态文件
    mainWindow.loadFile(join(__dirname, '../../public/index.html'));
  } else {
    // 开发环境加载 Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    
    // 等待页面加载完成后设置DevTools
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('🔧 Page finished loading, setting up DevTools...');
      
      // 等待更长时间确保React完全加载，然后进行DevTools设置
      setTimeout(() => {
        mainWindow?.webContents.executeJavaScript(`
          console.log('🔧 Setting up React DevTools integration...');
          
          // 检查我们的hook是否存在
          const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (hook) {
            console.log('✅ React DevTools hook found:', hook.__electronDevTools ? 'Electron hook' : 'Real DevTools');
            
            // 如果是我们的hook，确保它能正确工作
            if (hook.__electronDevTools) {
              console.log('🔧 Using enhanced Electron DevTools hook');
              
              // 确保hook处于激活状态
              hook.isDisabled = false;
              
              // 通知React我们已经准备好
              if (hook.emit) {
                hook.emit('ready', { version: '6.0.0' });
              }
            }
          } else {
            console.log('❌ React DevTools hook not found on window');
            console.log('Available on globalThis:', !!globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__);
          }
          
          // 检查React是否已加载
          if (typeof React !== 'undefined') {
            console.log('✅ React is loaded, version:', React.version);
            
            // 尝试触发React检查DevTools
            if (React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
              console.log('🔧 React internals available for DevTools detection');
            }
          } else {
            console.log('❌ React not found on window - checking global scope...');
            console.log('React on globalThis:', typeof globalThis.React);
          }
          
          // 最后检查 - 强制告诉React我们有DevTools
          if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            window.__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = false;
            console.log('🔧 Explicitly enabled React DevTools hook');
          }
        `);
        
        // 打开DevTools
        mainWindow?.webContents.openDevTools({ mode: 'detach' });
      }, 2000);
      
      // 检查扩展状态
      setTimeout(() => {
        const extensions = session.defaultSession.extensions ? 
          session.defaultSession.extensions.getAllExtensions() :
          session.defaultSession.getAllExtensions();
        const reactExt = Object.values(extensions).find(ext => ext.name.includes('React'));
        console.log('🔍 React DevTools extension:', reactExt ? reactExt.name : 'Not found');
      }, 1500);
    });
    
    // 监听DevTools打开事件
    mainWindow.webContents.on('devtools-opened', () => {
      console.log('🔧 DevTools window opened');
      console.log('💡 To activate React DevTools panels (⚛️ Components & ⚛️ Profiler):');
      console.log('   1. Click on the DevTools window');
      console.log('   2. Press Cmd+R (Mac) or Ctrl+R (Windows) to refresh DevTools');
      console.log('   3. React tabs should appear next to Console, Elements, etc.');
    });
    
    // 添加快捷键支持：Cmd+Shift+R 刷新DevTools
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'R' && (input.meta || input.control) && input.shift) {
        console.log('🔄 Manual DevTools refresh triggered by keyboard shortcut');
        if (mainWindow?.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
          setTimeout(() => {
            mainWindow?.webContents.openDevTools({ mode: 'detach' });
          }, 100);
        }
      }
    });
  }

  // 处理窗口关闭事件
  let isQuitting = false;
  let isHandlingClose = false; // 防止重复处理关闭事件
  
  mainWindow.on('close', (event) => {
    safeLog('🚪 Main: 窗口关闭事件触发, isQuitting =', isQuitting, ', isHandlingClose =', isHandlingClose);
    
    if (isQuitting) {
      safeLog('🚪 Main: 已确认关闭，允许关闭');
      return; // 已经确认关闭，允许关闭
    }
    
    if (isHandlingClose) {
      safeLog('🚪 Main: 已经在处理关闭事件，阻止重复处理');
      event.preventDefault();
      return;
    }
    
    safeLog('🚪 Main: 阻止默认关闭，通知渲染进程检查未保存文件...');
    isHandlingClose = true;
    
    // 阻止默认关闭行为
    event.preventDefault();
    
    // 通知渲染进程检查未保存的文件
    try {
      safeLog('🚪 Main: 发送app-will-close事件到渲染进程');
      mainWindow?.webContents.send('app-will-close');
    } catch (error) {
      safeLog('🚪 Main: 发送关闭通知失败:', error);
      // 如果发送失败，直接关闭
      isHandlingClose = false;
      isQuitting = true;
      mainWindow?.close();
    }
  });

  // 添加 IPC 处理程序，允许渲染进程确认关闭
  ipcMain.handle('confirm-close', () => {
    console.log('🚪 Main: 渲染进程确认关闭窗口');
    isHandlingClose = false; // 重置处理状态
    isQuitting = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('🚪 Main: 直接销毁窗口避免重复关闭事件');
      mainWindow.destroy(); // 使用 destroy() 而不是 close() 避免触发关闭事件
    }
  });

  // 添加 IPC 处理程序，允许渲染进程取消关闭
  ipcMain.handle('cancel-close', () => {
    console.log('🚪 Main: 渲染进程取消关闭窗口');
    isHandlingClose = false; // 重置处理状态
    isQuitting = false; // 确保不会意外关闭
  });

  // 防止重复显示保存对话框
  let isShowingDialog = false;

  // 显示系统级别的保存确认对话框
  ipcMain.handle('show-save-dialog', async (_, unsavedFiles: string[]) => {
    if (!mainWindow) {
      console.log('🚪 Main: mainWindow不存在，无法显示对话框');
      return null;
    }

    if (isShowingDialog) {
      console.log('🚪 Main: 已经在显示对话框，忽略重复请求');
      return null;
    }

    console.log('🚪 Main: 显示保存确认对话框，文件数量:', unsavedFiles.length);
    isShowingDialog = true;

    try {
      const fileList = unsavedFiles.map(file => `• ${file.split('/').pop()}`).join('\n');
      const message = `你有未保存的更改：\n\n${fileList}\n\n你想要保存这些更改吗？`;

      const result = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['保存', '不保存', '取消'],
        defaultId: 0,
        cancelId: 2,
        message: '你有未保存的更改',
        detail: message,
        icon: undefined // 使用系统默认图标
      });

      console.log('🚪 Main: 系统对话框结果:', result);
      console.log('🚪 Main: 即将返回给渲染进程的值:', result.response);

      // 返回用户选择: 0=保存, 1=不保存, 2=取消
      return result.response;
    } catch (error) {
      console.error('🚪 Main: 显示对话框时出错:', error);
      return null;
    } finally {
      isShowingDialog = false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createPreviewWindow(filePath: string) {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.focus();
    previewWindow.webContents.send('set-active-file', filePath);
    return;
  }

  previewWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Preview',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !app.isPackaged,
      devTools: !app.isPackaged,
    },
  });

  previewWindow.on('closed', () => {
    previewWindow = null;
  });

  if (app.isPackaged) {
    previewWindow.loadFile(join(__dirname, '../../public/index.html'), {
      search: 'mode=preview',
    });
  } else {
    previewWindow.loadURL('http://localhost:5173/?mode=preview');
  }

  previewWindow.webContents.once('did-finish-load', () => {
    previewWindow?.webContents.send('set-active-file', filePath);
  });
}

app.whenReady().then(async () => {
  // 在开发环境中安装React DevTools
  if (!app.isPackaged) {
    try {
      const { installExtension, REACT_DEVELOPER_TOOLS } = await import('electron-devtools-installer');

      console.log('🔧 Installing React DevTools...');
      const extensionInfo = await installExtension(REACT_DEVELOPER_TOOLS);
      console.log('✅ React DevTools installed:', extensionInfo.name, 'v' + extensionInfo.version);
      
      // 等待一小段时间确保扩展完全加载
      // await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.error('❌ Failed to install React DevTools:', e);
      console.log('🔄 Continuing without React DevTools...');
    }
  }

  createWindow();
  
  // 启动预览服务器
  try {
    await startPreviewServer();
  } catch (error) {
    console.error('❌ Failed to start preview server:', error);
  }
});

app.on('window-all-closed', () => {
  // 当所有窗口关闭时，退出应用（在所有平台上）
  console.log('🚪 Main: 所有窗口已关闭，退出应用');
  stopPreviewServer(); // 停止预览服务器
  app.quit();
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

// 直接加载指定路径的项目（用于恢复）
ipcMain.handle('load-project-path', async (_, projectPath: string) => {
  try {
    // 检查路径是否存在且是目录
    const stat = fs.statSync(projectPath);
    if (!stat.isDirectory()) {
      console.error('❌ 指定路径不是目录:', projectPath);
      return null;
    }
    console.log('✅ 直接加载项目路径:', projectPath);
    return projectPath;
  } catch (error) {
    console.error('❌ 加载项目路径失败:', error);
    return null;
  }
});

// 更新SSR预览文件（用于浏览器SSR预览）
ipcMain.handle('update-ssr-preview-file', async (_, filePath: string) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      currentPreviewFile = filePath;
      console.log('📋 Updated SSR preview file:', filePath);
      return true;
    } else {
      console.warn('⚠️ SSR preview file not found:', filePath);
      currentPreviewFile = null;
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating SSR preview file:', error);
    currentPreviewFile = null;
    return false;
  }
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

ipcMain.handle('rename-file', (_, filePath: string, newName: string) => {
  const dir = dirname(filePath);
  const newPath = join(dir, newName);
  fs.renameSync(filePath, newPath);
  return true;
});

ipcMain.handle('copy-file', (_, sourcePath: string, targetPath: string) => {
  try {
    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      // 复制目录
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    } else {
      // 复制文件
      fs.copyFileSync(sourcePath, targetPath);
    }
    return true;
  } catch (error) {
    console.error('复制文件失败:', error);
    return false;
  }
});

ipcMain.handle('delete-file', (_, filePath: string) => {
  fs.rmSync(filePath, { recursive: true, force: true });
  return true;
});

ipcMain.handle('move-file', (_, src: string, dest: string) => {
  fs.renameSync(src, dest);
  return true;
});

ipcMain.handle('create-directory', (_, dirPath: string) => {
  fs.mkdirSync(dirPath, { recursive: true });
  return true;
});

// 监听指定文件列表的变更，发送 'file-changed' 通知
ipcMain.handle('watch-files', (_, paths: string[]) => {
  const watcher = chokidar.watch(paths, { ignoreInitial: true });
  watcher.on('change', changedPath => {
    mainWindow?.webContents.send('file-changed', changedPath);
    previewWindow?.webContents.send('file-changed', changedPath);
  });
  return true;
});

// 编译或 lint Ink 源码
ipcMain.handle('compile-ink', async (_, inkText: string, lintOnly: boolean, sourceFilePath?: string) => {
  let workingDir: string;
  let inkFileName: string;

  if (sourceFilePath) {
    // 如果提供了源文件路径，在临时目录中模拟原目录结构以支持INCLUDE语法
    const os = await import('os');
    const originalDir = dirname(sourceFilePath);
    const tempRoot = join(os.tmpdir(), 'ink-editor-compilation');

    // 创建临时目录结构，模拟项目结构
    workingDir = join(tempRoot, 'project');
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
    }

    inkFileName = basename(sourceFilePath);
    const tempInkPath = join(workingDir, inkFileName);
    fs.writeFileSync(tempInkPath, inkText, 'utf-8');

    // 复制同目录下的其他ink文件到临时目录以支持INCLUDE
    try {
      const siblingFiles = fs.readdirSync(originalDir);
      for (const file of siblingFiles) {
        if (file.endsWith('.ink') && file !== inkFileName) {
          const srcPath = join(originalDir, file);
          const destPath = join(workingDir, file);
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
    } catch (err) {
      console.log('Main: Warning - could not copy sibling ink files:', err);
    }
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
        // 清理临时目录中生成的JSON文件
        if (fs.existsSync(outputJsonPath)) {
          try {
            fs.unlinkSync(outputJsonPath);
          } catch (e) {
            console.log('Main: Could not clean up output JSON file:', e);
          }
        }
      };

      if (code === 0) {
        // 编译成功
        try {
          if (fs.existsSync(outputJsonPath) && !lintOnly) {
            // 读取生成的JSON文件（非lint模式）
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
            // lint模式或编译成功但没有生成JSON文件
            console.log('Main: Compilation succeeded (lint mode or no JSON generated)');

            // 返回基本结构，包含警告信息
            const result: CompilationResult = {
              'compile-success': true,
              inkVersion: 20,
              root: 'start',
              listDefs: {}
            };

            if (stderr.trim()) {
              console.log('Main: Compilation successful with warnings:', stderr);
              result.warnings = stderr.trim().split('\n').filter(line => line.trim());
            }

            cleanup();
            return resolve(result);
          }
        } catch (e) {
          console.error('Main: Failed to read or parse generated JSON:', e);
          // 即使解析失败，但编译成功，仍返回基本结构
          const result: CompilationResult = {
            'compile-success': true,
            inkVersion: 20,
            root: 'start',
            listDefs: {}
          };

          if (stderr.trim()) {
            result.warnings = stderr.trim().split('\n').filter(line => line.trim());
          }

          cleanup();
          return resolve(result);
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

ipcMain.handle('compile-project', async (_, root: string) => {
  try {
    const files = fs.readdirSync(root).filter(f => f.endsWith('.ink'));
    if (files.length === 0) return { success: false, error: 'no ink files' };
    const mainFile = join(root, files[0]);
    const inklecatePath = app.isPackaged
      ? join(process.resourcesPath, 'bin/inklecate')
      : join(__dirname, '../../bin/inklecate');
    return await new Promise((resolve, reject) => {
      const args = [mainFile];
      const proc = spawn(inklecatePath, args, { cwd: root });
      let stderr = '';
      proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
      proc.on('close', code => {
        if (code === 0) {
          resolve({ success: true, warnings: stderr.trim() ? stderr.trim().split('\n') : [] });
        } else {
          reject(new Error(stderr));
        }
      });
    });
  } catch (e: any) {
    return { success: false, error: e.message };
  }
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

  // 递归读取目录结构
  const readDirRecursive = (path: string): any[] => {
    try {
      const items = fs.readdirSync(path, { withFileTypes: true });
      
      // 过滤隐藏文件和系统文件
      const filteredItems = items.filter(item => {
        return !item.name.startsWith('.') && 
               item.name !== 'Thumbs.db' && 
               item.name !== 'desktop.ini';
      });
      
      const nodes = filteredItems.map(item => {
        const fullPath = join(path, item.name);
        const node = {
          name: item.name,
          path: fullPath,
          isDirectory: item.isDirectory(),
          children: undefined as any
        };
        
        // 如果是目录，递归读取子内容
        if (item.isDirectory()) {
          try {
            node.children = readDirRecursive(fullPath);
          } catch (error) {
            console.warn('read-dir: Cannot read subdirectory:', fullPath, error);
            node.children = [];
          }
        }
        
        return node;
      });
      
      // Sort directories first, then files
      return nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('read-dir: Error reading directory:', path, error);
      return [];
    }
  };

  try {
    return readDirRecursive(dirPath);
  } catch (error) {
    console.error('read-dir: Error reading root directory:', dirPath, error);
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

// 窗口控制 IPC 处理程序
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  console.log('🔴 Main: 收到关闭窗口请求');
  if (mainWindow) {
    console.log('🔴 Main: 调用mainWindow.close()');
    mainWindow.close();
  } else {
    console.error('🔴 Main: mainWindow不存在');
  }
});

// 设置窗口标题
ipcMain.handle('set-window-title', (_, title: string) => {
  if (mainWindow) {
    mainWindow.setTitle(title);
  }
});

// 渲染进程日志转发
ipcMain.handle('log-to-main', (_, message: string) => {
  console.log('[Renderer]', message);
});

ipcMain.handle('open-preview-window', (_, filePath: string) => {
  createPreviewWindow(filePath);
});

ipcMain.handle('update-preview-file', (_, filePath: string) => {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.webContents.send('set-active-file', filePath);
  }
});

// 在文件管理器中显示文件
ipcMain.handle('show-in-explorer', async (_, filePath: string) => {
  try {
    await shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error('show-in-explorer: Error showing item:', filePath, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 在系统默认浏览器中打开URL
ipcMain.handle('open-external-url', async (_, url: string) => {
  try {
    console.log('🌐 Opening external URL:', url);
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('open-external-url: Error opening URL:', url, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// 触发预览刷新
ipcMain.handle('trigger-preview-refresh', async () => {
  try {
    lastRefreshTime = Date.now();
    console.log('🔄 Preview refresh triggered at:', lastRefreshTime);
    return { success: true, refreshTime: lastRefreshTime };
  } catch (error) {
    console.error('trigger-preview-refresh: Error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// AI模型配置存储管理
const getProjectAIConfigPath = () => {
  // 项目目录的 .ai-config 文件夹（优先级最高）
  const projectRoot = app.getAppPath();
  const projectConfigDir = join(projectRoot, '.ai-config');
  return {
    dir: projectConfigDir,
    models: join(projectConfigDir, 'ai-models.json'),
    selectedModel: join(projectConfigDir, 'selected-ai-model.txt'),
    storageConfig: join(projectConfigDir, 'storage-config.json')
  };
};

const getAIConfigPath = () => {
  if (!app.isPackaged) {
    // 开发环境：使用项目根目录的 .ai-config 文件夹
    const projectRoot = app.getAppPath();
    const devConfigDir = join(projectRoot, '.ai-config');
    if (!fs.existsSync(devConfigDir)) {
      fs.mkdirSync(devConfigDir, { recursive: true });
    }
    return join(devConfigDir, 'ai-models.json');
  } else {
    // 生产环境：使用用户数据目录
    return join(app.getPath('userData'), 'ai-models.json');
  }
};

const getSelectedModelPath = () => {
  if (!app.isPackaged) {
    // 开发环境：使用项目根目录的 .ai-config 文件夹
    const projectRoot = app.getAppPath();
    const devConfigDir = join(projectRoot, '.ai-config');
    if (!fs.existsSync(devConfigDir)) {
      fs.mkdirSync(devConfigDir, { recursive: true });
    }
    return join(devConfigDir, 'selected-ai-model.txt');
  } else {
    // 生产环境：使用用户数据目录
    return join(app.getPath('userData'), 'selected-ai-model.txt');
  }
};

// 保存AI模型配置
ipcMain.handle('save-ai-models', async (_, models: any[]) => {
  try {
    const configPath = getAIConfigPath();
    await fs.promises.writeFile(configPath, JSON.stringify(models, null, 2), 'utf-8');
    safeLog('💾 AI models saved to:', configPath);
    return { success: true };
  } catch (error) {
    safeError('💾 Failed to save AI models:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// 读取AI模型配置（优先级加载）
ipcMain.handle('load-ai-models', async () => {
  try {
    const projectPaths = getProjectAIConfigPath();
    
    // 1. 优先尝试从项目 .ai-config 目录加载
    if (fs.existsSync(projectPaths.models)) {
      try {
        const content = await fs.promises.readFile(projectPaths.models, 'utf-8');
        const models = JSON.parse(content);
        safeLog('💾 AI models loaded from project .ai-config:', projectPaths.models, `(${models.length} models)`);
        return { success: true, data: models, source: 'project' };
      } catch (error) {
        safeError('💾 Failed to parse project AI models config:', error);
      }
    }
    
    // 2. 回退到默认路径（用户数据目录）
    const fallbackPath = getAIConfigPath();
    if (fs.existsSync(fallbackPath)) {
      try {
        const content = await fs.promises.readFile(fallbackPath, 'utf-8');
        const models = JSON.parse(content);
        safeLog('💾 AI models loaded from fallback path:', fallbackPath, `(${models.length} models)`);
        return { success: true, data: models, source: 'fallback' };
      } catch (error) {
        safeError('💾 Failed to parse fallback AI models config:', error);
      }
    }
    
    safeLog('💾 No AI models config file found, returning empty array');
    return { success: true, data: [], source: 'none' };
  } catch (error) {
    safeError('💾 Failed to load AI models:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      data: [] 
    };
  }
});

// 保存选中的AI模型ID
ipcMain.handle('save-selected-ai-model', async (_, modelId: string) => {
  try {
    const modelPath = getSelectedModelPath();
    await fs.promises.writeFile(modelPath, modelId, 'utf-8');
    safeLog('💾 Selected AI model saved:', modelId);
    return { success: true };
  } catch (error) {
    safeError('💾 Failed to save selected AI model:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// 读取选中的AI模型ID（优先级加载）
ipcMain.handle('load-selected-ai-model', async () => {
  try {
    const projectPaths = getProjectAIConfigPath();
    
    // 1. 优先尝试从项目 .ai-config 目录加载
    if (fs.existsSync(projectPaths.selectedModel)) {
      try {
        const modelId = await fs.promises.readFile(projectPaths.selectedModel, 'utf-8');
        safeLog('💾 Selected AI model loaded from project .ai-config:', modelId.trim());
        return { success: true, data: modelId.trim(), source: 'project' };
      } catch (error) {
        safeError('💾 Failed to read project selected AI model:', error);
      }
    }
    
    // 2. 回退到默认路径
    const fallbackPath = getSelectedModelPath();
    if (fs.existsSync(fallbackPath)) {
      try {
        const modelId = await fs.promises.readFile(fallbackPath, 'utf-8');
        safeLog('💾 Selected AI model loaded from fallback path:', modelId.trim());
        return { success: true, data: modelId.trim(), source: 'fallback' };
      } catch (error) {
        safeError('💾 Failed to read fallback selected AI model:', error);
      }
    }
    
    safeLog('💾 No selected AI model file found');
    return { success: true, data: '', source: 'none' };
  } catch (error) {
    safeError('💾 Failed to load selected AI model:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      data: '' 
    };
  }
});

// 存储方案配置管理
const getStorageConfigPath = () => {
  if (!app.isPackaged) {
    const projectRoot = app.getAppPath();
    const devConfigDir = join(projectRoot, '.ai-config');
    if (!fs.existsSync(devConfigDir)) {
      fs.mkdirSync(devConfigDir, { recursive: true });
    }
    return join(devConfigDir, 'storage-config.json');
  } else {
    return join(app.getPath('userData'), 'storage-config.json');
  }
};

// 获取存储配置
ipcMain.handle('get-storage-config', async () => {
  try {
    const configPath = getStorageConfigPath();
    if (!fs.existsSync(configPath)) {
      // 默认配置：开发环境使用localStorage + 文件双存储，生产环境使用文件存储
      const defaultConfig = {
        storageType: !app.isPackaged ? 'hybrid' : 'file', // 'localStorage', 'file', 'hybrid'
        enableLocalStorageSync: !app.isPackaged, // 是否同步到localStorage（用于开发者工具查看）
      };
      await fs.promises.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      safeLog('💾 Created default storage config:', defaultConfig);
      return { success: true, data: defaultConfig };
    }
    
    const content = await fs.promises.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    safeLog('💾 Loaded storage config:', config);
    return { success: true, data: config };
  } catch (error) {
    safeError('💾 Failed to get storage config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: { storageType: 'file', enableLocalStorageSync: false }
    };
  }
});

// 保存存储配置
ipcMain.handle('save-storage-config', async (_, config: any) => {
  try {
    const configPath = getStorageConfigPath();
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    safeLog('💾 Storage config saved:', config);
    return { success: true };
  } catch (error) {
    safeError('💾 Failed to save storage config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// AI配置验证和调试工具
ipcMain.handle('verify-ai-storage', async () => {
  try {
    const configPath = getAIConfigPath();
    const selectedModelPath = getSelectedModelPath();
    
    const verification = {
      timestamp: new Date().toISOString(),
      configFile: {
        path: configPath,
        exists: fs.existsSync(configPath),
        readable: false,
        content: null as any,
        size: 0
      },
      selectedModelFile: {
        path: selectedModelPath,
        exists: fs.existsSync(selectedModelPath),
        readable: false,
        content: null as any,
        size: 0
      },
      userDataPath: app.getPath('userData'),
      appName: app.getName(),
      isPackaged: app.isPackaged
    };

    // 检查配置文件
    if (verification.configFile.exists) {
      try {
        const content = await fs.promises.readFile(configPath, 'utf-8');
        verification.configFile.readable = true;
        verification.configFile.content = JSON.parse(content);
        verification.configFile.size = content.length;
      } catch (error) {
        verification.configFile.readable = false;
        verification.configFile.content = `Error reading file: ${error}`;
      }
    }

    // 检查选中模型文件
    if (verification.selectedModelFile.exists) {
      try {
        const content = await fs.promises.readFile(selectedModelPath, 'utf-8');
        verification.selectedModelFile.readable = true;
        verification.selectedModelFile.content = content.trim();
        verification.selectedModelFile.size = content.length;
      } catch (error) {
        verification.selectedModelFile.readable = false;
        verification.selectedModelFile.content = `Error reading file: ${error}`;
      }
    }

    safeLog('🔍 AI Storage Verification:', JSON.stringify(verification, null, 2));
    
    return {
      success: true,
      data: verification
    };
  } catch (error) {
    safeError('🔍 AI storage verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// 清除AI配置数据（用于测试）
ipcMain.handle('clear-ai-storage', async () => {
  try {
    const configPath = getAIConfigPath();
    const selectedModelPath = getSelectedModelPath();
    
    const results = {
      configFile: { deleted: false, error: null as string | null },
      selectedModelFile: { deleted: false, error: null as string | null }
    };

    // 删除配置文件
    if (fs.existsSync(configPath)) {
      try {
        await fs.promises.unlink(configPath);
        results.configFile.deleted = true;
        safeLog('🗑️ Deleted AI config file:', configPath);
      } catch (error) {
        results.configFile.error = error instanceof Error ? error.message : String(error);
      }
    }

    // 删除选中模型文件
    if (fs.existsSync(selectedModelPath)) {
      try {
        await fs.promises.unlink(selectedModelPath);
        results.selectedModelFile.deleted = true;
        safeLog('🗑️ Deleted selected model file:', selectedModelPath);
      } catch (error) {
        results.selectedModelFile.error = error instanceof Error ? error.message : String(error);
      }
    }

    return {
      success: true,
      data: results
    };
  } catch (error) {
    safeError('🗑️ Failed to clear AI storage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// 会话历史管理
const getChatSessionsPath = () => {
  const projectPaths = getProjectAIConfigPath();
  // 优先使用项目配置目录
  if (fs.existsSync(projectPaths.dir)) {
    return join(projectPaths.dir, 'chat-sessions.json');
  } else {
    // 回退到用户数据目录
    return join(app.getPath('userData'), 'chat-sessions.json');
  }
};

// 保存会话
ipcMain.handle('save-chat-session', async (_, session: any) => {
  try {
    const sessionsPath = getChatSessionsPath();
    let sessions: any[] = [];
    
    // 确保目录存在
    const dir = dirname(sessionsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 读取现有会话
    if (fs.existsSync(sessionsPath)) {
      const content = await fs.promises.readFile(sessionsPath, 'utf-8');
      sessions = JSON.parse(content);
    }
    
    // 更新或添加会话
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session); // 新会话放在前面
    }
    
    // 限制保存的会话数量（最多100个）
    if (sessions.length > 100) {
      sessions = sessions.slice(0, 100);
    }
    
    // 保存到文件
    await fs.promises.writeFile(sessionsPath, JSON.stringify(sessions, null, 2), 'utf-8');
    safeLog('💬 Chat session saved:', session.id);
    return { success: true };
  } catch (error) {
    safeError('💬 Failed to save chat session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// 加载所有会话
ipcMain.handle('load-chat-sessions', async () => {
  try {
    const sessionsPath = getChatSessionsPath();
    if (!fs.existsSync(sessionsPath)) {
      return { success: true, data: [] };
    }
    
    const content = await fs.promises.readFile(sessionsPath, 'utf-8');
    const sessions = JSON.parse(content);
    
    // 按更新时间排序（最新的在前面）
    sessions.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    safeLog('💬 Loaded', sessions.length, 'chat sessions');
    return { success: true, data: sessions };
  } catch (error) {
    safeError('💬 Failed to load chat sessions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      data: [] 
    };
  }
});

// 删除会话
ipcMain.handle('delete-chat-session', async (_, sessionId: string) => {
  try {
    const sessionsPath = getChatSessionsPath();
    if (!fs.existsSync(sessionsPath)) {
      return { success: true };
    }
    
    const content = await fs.promises.readFile(sessionsPath, 'utf-8');
    let sessions = JSON.parse(content);
    
    // 删除指定会话
    sessions = sessions.filter((s: any) => s.id !== sessionId);
    
    // 保存更新后的会话列表
    await fs.promises.writeFile(sessionsPath, JSON.stringify(sessions, null, 2), 'utf-8');
    safeLog('💬 Chat session deleted:', sessionId);
    return { success: true };
  } catch (error) {
    safeError('💬 Failed to delete chat session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// 检查代理设置（用于调试）
ipcMain.handle('get-proxy-info', async () => {
  try {
    // 获取当前session的代理设置
    const proxyInfo = await session.defaultSession.resolveProxy('https://www.google.com');
    safeLog('🌐 Current proxy settings:', proxyInfo);
    
    return {
      success: true,
      proxyInfo: proxyInfo
    };
  } catch (error) {
    safeError('🌐 Failed to get proxy info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// AI API流式请求代理 - 支持SSE流式响应
ipcMain.handle('ai-api-stream-request', async (event, config: {
  url: string;
  headers: Record<string, string>;
  body: any;
}) => {
  try {
    const { url, headers, body } = config;
    
    safeLog('🌊 Main: Starting AI API stream request to:', url);
    
    // 创建流式请求
    const request = net.request({
      method: 'POST',
      url: url
    });
    
    // 设置请求头，启用流式响应
    Object.entries(headers).forEach(([key, value]) => {
      request.setHeader(key, value);
    });
    request.setHeader('Content-Type', 'application/json');
    
    // 修改body以启用流式响应（针对OpenAI和兼容API）
    const streamBody = { ...body, stream: true };
    
    request.on('response', (response) => {
      const statusCode = response.statusCode || 0;
      safeLog('🌊 Main: Stream response status:', statusCode);
      
      if (statusCode >= 200 && statusCode < 300) {
        // 处理流式数据
        response.on('data', (chunk) => {
          const chunkStr = chunk.toString();
          const lines = chunkStr.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // 移除 "data: " 前缀
              
              if (data === '[DONE]') {
                // 流结束
                event.sender.send('ai-stream-end');
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                // 提取增量内容
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  event.sender.send('ai-stream-data', delta);
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理下一行
              }
            }
          }
        });
        
        response.on('end', () => {
          event.sender.send('ai-stream-end');
        });
        
        response.on('error', (error) => {
          safeError('🌊 Main: Stream response error:', error);
          event.sender.send('ai-stream-error', error.message);
        });
      } else {
        let errorData = '';
        response.on('data', (chunk) => {
          errorData += chunk.toString();
        });
        response.on('end', () => {
          event.sender.send('ai-stream-error', `HTTP ${statusCode}: ${errorData}`);
        });
      }
    });
    
    request.on('error', (error) => {
      safeError('🌊 Main: Stream request error:', error);
      event.sender.send('ai-stream-error', error.message);
    });
    
    // 发送请求数据
    request.write(JSON.stringify(streamBody));
    request.end();
    
    return { success: true, message: 'Stream started' };
  } catch (error) {
    safeError('🌊 Main: Failed to start stream:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// AI API请求代理 - 解决CORS问题，支持系统代理
ipcMain.handle('ai-api-request', async (_, config: {
  url: string;
  headers: Record<string, string>;
  body: any;
}) => {
  try {
    const { url, headers, body } = config;
    
    safeLog('🤖 Main: Proxying AI API request to:', url);
    safeLog('🤖 Main: Using Electron net module (supports system proxy)');
    
    // 使用Electron的net模块，自动支持系统代理设置（包括ClashX等）
    return new Promise((resolve) => {
      const request = net.request({
        method: 'POST',
        url: url
      });
      
      // 设置请求头
      Object.entries(headers).forEach(([key, value]) => {
        request.setHeader(key, value);
      });
      
      // 设置Content-Type
      request.setHeader('Content-Type', 'application/json');
      
      let responseData = '';
      let statusCode = 0;
      
      request.on('response', (response) => {
        statusCode = response.statusCode || 0;
        safeLog('🤖 Main: Response status:', statusCode);
        
        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });
        
        response.on('end', () => {
          try {
            if (statusCode >= 200 && statusCode < 300) {
              const data = JSON.parse(responseData);
              safeLog('🤖 Main: AI API response received via proxy-aware request');
              resolve({
                success: true,
                data: data
              });
            } else {
              safeError('🤖 Main: AI API error:', statusCode, responseData.substring(0, 200) + '...');
              resolve({
                success: false,
                status: statusCode,
                error: responseData
              });
            }
          } catch (parseError) {
            safeError('🤖 Main: Failed to parse response:', parseError);
            resolve({
              success: false,
              status: statusCode,
              error: `Failed to parse response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
            });
          }
        });
      });
      
      request.on('error', (error) => {
        safeError('🤖 Main: Request error:', error);
        resolve({
          success: false,
          error: error.message
        });
      });
      
      // 发送请求体
      try {
        request.write(JSON.stringify(body));
        request.end();
      } catch (writeError) {
        safeError('🤖 Main: Failed to write request body:', writeError);
        resolve({
          success: false,
          error: writeError instanceof Error ? writeError.message : String(writeError)
        });
      }
    });
  } catch (error) {
    safeError('🤖 Main: AI API request setup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});
