export function generatePreviewHTML(storyJson, fileName, errorMessage, lastRefreshTime) {
    const storyData = storyJson ? JSON.stringify(storyJson) : 'null';
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName} - AVG Maker 预览</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: #161b22;
            border-bottom: 1px solid #30363d;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }
        
        .header h1 {
            font-size: 16px;
            font-weight: 500;
            margin: 0;
            color: #f0f6fc;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 14px;
            color: #8b949e;
        }
        
        .status-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #238636;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .container {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 800px;
            width: 100%;
            margin: 0 auto;
            padding: 32px 24px;
            overflow-y: auto;
        }
        
        .content {
            background: #0d1117;
            border-radius: 8px;
            padding: 32px;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        
        .story-text {
            font-size: 16px;
            line-height: 1.8;
            color: #c9d1d9;
            margin-bottom: 16px;
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .choices {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 8px;
        }
        
        .choice-button {
            background: #21262d;
            border: 1px solid #30363d;
            color: #58a6ff;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 15px;
            text-align: left;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        
        .choice-button:hover {
            background: #262c35;
            border-color: #58a6ff;
            transform: translateX(4px);
        }
        
        .choice-button:active {
            transform: translateX(2px);
        }
        
        .error {
            background: #161b22;
            border: 1px solid #f85149;
            border-radius: 6px;
            padding: 16px;
            color: #f85149;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            line-height: 1.6;
        }
        
        .error small {
            color: #8b949e;
            font-size: 12px;
            display: block;
            margin-top: 8px;
        }
        
        /* 新增样式：支持富文本内容 */
        .story-text h1, .story-text h2, .story-text h3 {
            margin: 16px 0 8px 0;
            color: #f0f6fc;
        }
        
        .story-text h1 { font-size: 24px; }
        .story-text h2 { font-size: 20px; }
        .story-text h3 { font-size: 18px; }
        
        .story-text p {
            margin: 8px 0;
        }
        
        .story-text em {
            font-style: italic;
            color: #79c0ff;
        }
        
        .story-text strong {
            font-weight: bold;
            color: #f0f6fc;
        }
        
        .story-text code {
            background: #161b22;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
            font-size: 14px;
        }
        
        .story-text blockquote {
            border-left: 3px solid #30363d;
            padding-left: 16px;
            margin: 16px 0;
            color: #8b949e;
            font-style: italic;
        }
        
        .story-text a {
            color: #58a6ff;
            text-decoration: none;
        }
        
        .story-text a:hover {
            text-decoration: underline;
        }
        
        .story-text ul, .story-text ol {
            margin: 8px 0;
            padding-left: 24px;
        }
        
        .story-text li {
            margin: 4px 0;
        }
        
        .story-text img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 16px 0;
        }
        
        .story-text hr {
            border: none;
            border-top: 1px solid #30363d;
            margin: 24px 0;
        }
        
        /* Loading state */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 16px;
            color: #8b949e;
            padding: 48px;
        }
        
        .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #30363d;
            border-top-color: #58a6ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/inkjs@2.2.2/dist/ink.min.js"></script>
</head>
<body>
    <div class="header">
        <h1>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            ${fileName}
        </h1>
        <div class="status">
            <div class="status-item">
                <span class="status-indicator"></span>
                <span>实时预览</span>
            </div>
            <div class="status-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span id="last-update">刚刚更新</span>
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="content" id="story-content">
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>正在加载故事...</span>
            </div>
        </div>
    </div>
    
    <script>
        window.STORY_DATA = ${storyData};
        ${errorMessage ? `window.ERROR_MESSAGE = ${JSON.stringify(errorMessage)};` : ''}
    </script>
    
    <script>
        let currentStory = null;
        const contentEl = document.getElementById('story-content');
        
        // 显示错误信息
        if (window.ERROR_MESSAGE) {
            contentEl.innerHTML = '<div class="error">编译错误:\\n' + window.ERROR_MESSAGE + '</div>';
        }
        
        // HTML内容解析器 - 安全地解析受限的HTML标签
        function parseHtmlContent(text) {
            if (!text) return '';
            
            // 定义允许的标签
            const allowedTags = [
                '<b>', '</b>', '<i>', '</i>', '<em>', '</em>',
                '<strong>', '</strong>', '<u>', '</u>',
                '<br>', '<br/>', '<br />',
                '<p>', '</p>',
                '<h1>', '</h1>', '<h2>', '</h2>', '<h3>', '</h3>',
                '<ul>', '</ul>', '<ol>', '</ol>', '<li>', '</li>',
                '<blockquote>', '</blockquote>',
                '<code>', '</code>', '<pre>', '</pre>',
                '<a href=', '</a>',
                '<img src=', '<img alt=',
                '<hr>', '<hr/>', '<hr />'
            ];
            
            // 保护HTML标签，避免被转义
            let result = text;
            const tagProtection = {};
            let tagCounter = 0;
            
            // 临时替换允许的标签
            result = result.replace(/<[^>]+>/g, match => {
                const lowerMatch = match.toLowerCase();
                if (allowedTags.some(tag => lowerMatch.startsWith(tag)) || 
                    (lowerMatch.startsWith('<') && lowerMatch.includes(' ') && 
                     allowedTags.some(allowedTag => lowerMatch.startsWith(allowedTag.toLowerCase().split('>')[0])))) {
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
//# sourceMappingURL=utils.js.map