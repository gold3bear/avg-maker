import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as os from 'os';
import { generatePreviewHTML } from './utils';
export class PreviewServer {
    constructor(config) {
        this.server = null;
        this.currentPreviewFile = null;
        this.lastRefreshTime = Date.now();
        this.config = config;
    }
    async start() {
        console.log(`🌐 Starting preview server on port ${this.config.port}...`);
        this.server = http.createServer(async (req, res) => {
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
                    const htmlContent = await this.generateSSRPreviewPage();
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.writeHead(200);
                    res.end(htmlContent);
                    return;
                }
                catch (error) {
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
                res.end(JSON.stringify({ refreshTime: this.lastRefreshTime }));
                return;
            }
            // 404处理
            res.writeHead(404);
            res.end('Not Found');
        });
        this.server.listen(this.config.port, () => {
            console.log(`✅ Preview server started: http://localhost:${this.config.port}/preview`);
            this.config.onStart?.();
        });
        this.server.on('error', (error) => {
            console.error('❌ Preview server error:', error);
            this.config.onError?.(error);
        });
    }
    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log('🛑 Preview server stopped');
        }
    }
    setCurrentFile(filePath) {
        this.currentPreviewFile = filePath;
    }
    triggerRefresh() {
        this.lastRefreshTime = Date.now();
        console.log('🔄 Preview refresh triggered at:', this.lastRefreshTime);
    }
    getRefreshTime() {
        return this.lastRefreshTime;
    }
    async generateSSRPreviewPage() {
        let storyJson = null;
        let fileName = '未选择文件';
        let errorMessage = null;
        if (this.currentPreviewFile) {
            try {
                console.log('🔄 SSR: Compiling story for preview:', this.currentPreviewFile);
                fileName = path.basename(this.currentPreviewFile);
                // 读取文件内容
                const source = fs.readFileSync(this.currentPreviewFile, 'utf8');
                // 编译故事
                const originalDir = path.dirname(this.currentPreviewFile);
                const tempRoot = path.join(os.tmpdir(), 'ssr-compilation');
                const workingDir = path.join(tempRoot, 'project');
                if (!fs.existsSync(workingDir)) {
                    fs.mkdirSync(workingDir, { recursive: true });
                }
                const inkFileName = path.basename(this.currentPreviewFile);
                const tempInkPath = path.join(workingDir, inkFileName);
                fs.writeFileSync(tempInkPath, source, 'utf-8');
                // 复制同目录下的其他ink文件
                try {
                    const siblingFiles = fs.readdirSync(originalDir);
                    for (const file of siblingFiles) {
                        if (file.endsWith('.ink') && file !== inkFileName) {
                            const srcPath = path.join(originalDir, file);
                            const destPath = path.join(workingDir, file);
                            if (fs.existsSync(srcPath)) {
                                fs.copyFileSync(srcPath, destPath);
                            }
                        }
                    }
                }
                catch (err) {
                    console.warn('SSR: Warning - could not copy sibling ink files:', err);
                }
                const outputJsonName = inkFileName.replace('.ink', '.json');
                const outputJsonPath = path.join(workingDir, outputJsonName);
                // 编译 - Add -c flag for countAllVisits support
                const args = ['-c', '-o', outputJsonName, inkFileName];
                await new Promise((resolve, reject) => {
                    const proc = spawn(this.config.inklecatePath, args, { cwd: workingDir });
                    let stderr = '';
                    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
                    proc.on('close', (code) => {
                        if (code === 0 && fs.existsSync(outputJsonPath)) {
                            const compiledContent = fs.readFileSync(outputJsonPath, 'utf8');
                            storyJson = JSON.parse(compiledContent);
                            console.log('✅ SSR: Story compiled successfully');
                            // 清理临时文件
                            try {
                                if (fs.existsSync(tempInkPath))
                                    fs.unlinkSync(tempInkPath);
                                if (fs.existsSync(outputJsonPath))
                                    fs.unlinkSync(outputJsonPath);
                            }
                            catch (cleanupError) {
                                console.warn('SSR: Cleanup warning:', cleanupError);
                            }
                            resolve();
                        }
                        else {
                            errorMessage = stderr || 'Compilation failed';
                            console.error('❌ SSR: Compilation failed:', errorMessage);
                            reject(new Error(errorMessage));
                        }
                    });
                });
            }
            catch (error) {
                console.error('❌ SSR: Error compiling story:', error);
                errorMessage = error instanceof Error ? error.message : String(error);
            }
        }
        // 生成HTML页面
        return generatePreviewHTML(storyJson, fileName, errorMessage, this.lastRefreshTime);
    }
}
//# sourceMappingURL=previewServer.js.map