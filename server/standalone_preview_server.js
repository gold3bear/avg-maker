// 独立的预览服务器，用于测试浏览器预览功能
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const PORT = 3002; // 使用不同的端口避免冲突
let currentPreviewFile = null;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname;

    console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API: 获取当前文件
    if (pathname === '/api/current-file') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({ 
            filePath: currentPreviewFile,
            timestamp: Date.now(),
            server: 'standalone'
        }));
        return;
    }

    // API: 设置当前文件
    if (pathname === '/api/set-file' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { filePath } = JSON.parse(body);
                currentPreviewFile = filePath;
                console.log('Set current file to:', filePath);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, filePath }));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // 预览页面
    if (pathname === '/' || pathname === '/preview') {
        const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AVG Maker - 独立预览服务器</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            margin: 0; padding: 0; background: #1e1e1e; color: white; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            height: 100vh;
        }
        .header {
            background: #2d2d2d; padding: 12px 20px; border-bottom: 1px solid #444;
            display: flex; justify-content: space-between; align-items: center;
        }
        .container { padding: 20px; max-width: 800px; margin: 0 auto; }
        .status { background: #333; padding: 8px 12px; border-radius: 4px; font-size: 12px; }
        .success { background: #2d5016; }
        .error { background: #5d1a1a; }
        .test-section { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; }
        button { 
            background: #0066cc; color: white; border: none; padding: 10px 20px; 
            border-radius: 4px; cursor: pointer; margin: 5px; 
        }
        button:hover { background: #0080ff; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 18px;">AVG Maker - 独立预览服务器</h1>
        <div class="status" id="status">运行在端口 ${PORT}</div>
    </div>
    <div class="container">
        <div class="test-section">
            <h2>🔧 服务器状态</h2>
            <p>✅ 独立预览服务器正在运行</p>
            <p>📍 地址: <code>http://localhost:${PORT}</code></p>
            <p>🔄 当前文件: <span id="current-file">无</span></p>
            
            <button onclick="checkStatus()">刷新状态</button>
            <button onclick="testSetFile()">测试设置文件</button>
        </div>
        
        <div class="test-section">
            <h2>📝 使用说明</h2>
            <p>1. 这是一个独立的预览服务器，用于测试浏览器预览功能</p>
            <p>2. 在主应用中可以通过以下方式设置预览文件：</p>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px;">
fetch('http://localhost:${PORT}/api/set-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath: '/path/to/story.ink' })
});</pre>
            <p>3. 预览页面会自动检测文件变化并更新显示</p>
        </div>
    </div>
    
    <script>
        async function checkStatus() {
            try {
                const response = await fetch('/api/current-file');
                const data = await response.json();
                document.getElementById('current-file').textContent = data.filePath || '无';
                document.getElementById('status').textContent = \`运行正常 - \${new Date().toLocaleTimeString()}\`;
                document.getElementById('status').className = 'status success';
            } catch (error) {
                document.getElementById('status').textContent = '状态检查失败';
                document.getElementById('status').className = 'status error';
            }
        }
        
        async function testSetFile() {
            try {
                const testPath = '/test/sample.ink';
                const response = await fetch('/api/set-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filePath: testPath })
                });
                const result = await response.json();
                alert(\`设置测试文件成功: \${result.filePath}\`);
                checkStatus();
            } catch (error) {
                alert(\`设置文件失败: \${error.message}\`);
            }
        }
        
        // 页面加载时检查状态
        document.addEventListener('DOMContentLoaded', checkStatus);
        
        // 每5秒自动刷新状态
        setInterval(checkStatus, 5000);
    </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(htmlContent);
        return;
    }

    // 404处理
    res.writeHead(404);
    res.end('Not Found');
});

// 启动服务器
server.listen(PORT, '127.0.0.1', () => {
    console.log(`🌐 独立预览服务器启动成功!`);
    console.log(`📱 预览地址: http://localhost:${PORT}/preview`);
    console.log(`🔍 API地址: http://localhost:${PORT}/api/current-file`);
    console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
});

server.on('error', (error) => {
    console.error('❌ 服务器错误:', error);
    if (error.code === 'EADDRINUSE') {
        console.log(`端口 ${PORT} 已被占用，请尝试其他端口`);
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

console.log('🚀 正在启动独立预览服务器...');