import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, X, Settings
} from 'lucide-react';
import AIMessage, { type AIMessageData } from './AIMessage';
import QuickActions from './QuickActions';

interface AIChatPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  projectContext: { currentFile: string | null; projectName?: string | null };
  apiUrl?: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isOpen = true,
  onToggle = () => {},
  projectContext: _projectContext,
  apiUrl: initialApiUrl = '',
}) => {
  const [messages, setMessages] = useState<AIMessageData[]>([
    {
      id: 1,
      type: 'ai',
      content: '你好！我是AVG Maker的AI助手。我可以帮你：\n\n• 生成剧情和角色\n• 优化Ink代码\n• 修复语法错误\n• 提供创作建议\n\n现在想做什么？',
      timestamp: new Date(),
      actions: ['generate-character', 'create-scene', 'fix-code']
    }
  ]);
  const [input, setInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [_suggestions] = useState([
    '帮我创建一个神秘角色',
    '优化当前的代码结构',
    '生成一个转折剧情'
  ]);
  const [apiUrl, setApiUrl] = useState(initialApiUrl);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessageData = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsAiThinking(true);

    // 模拟AI响应
    setTimeout(() => {
      const aiResponse: AIMessageData = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(input),
        timestamp: new Date(),
        actions: getRelevantActions(input)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsAiThinking(false);
    }, 2000);
  };

  const generateAIResponse = (userInput: string): string => {
    if (userInput.includes('角色') || userInput.includes('character')) {
      return `好的！我来为你创建一个角色：

**角色名称：** 艾莉娅·格雷
**职业：** 图书管理员 / 秘密调查员
**性格特点：**

- 表面温和内敛，实际敏锐机智
- 对古籍和历史有深入了解
- 隐藏着不为人知的过去

**代码建议：**
\`\`\`ink
VAR aria_trust = 0
VAR aria_secret_revealed = false

=== meet_aria ===
你在图书馆遇到了艾莉娅。
她正在整理一些古老的手稿。

- [主动打招呼] -> greet_aria
- [观察她的工作] -> observe_aria
\`\`\`

要我继续完善这个角色吗？`;
    }

    if (userInput.includes('代码') || userInput.includes('优化')) {
      return `我分析了你的代码，发现几个可以优化的地方：

**问题1：** 变量命名不够清晰
**建议：** \`trust_level\` 改为 \`player_trust_level\`

**问题2：** 缺少错误处理
**建议：** 添加默认分支处理

**优化后的代码：**
\`\`\`ink
VAR player_trust_level = 0
VAR story_progress = "beginning"

=== scene_start ===
{player_trust_level > 5:
  -> trusted_path
- player_trust_level < 0:
  -> suspicious_path
- else:
  -> neutral_path
}
\`\`\`

需要我应用这些修改吗？`;
    }

    return `我理解你的需求。让我为你提供一些建议...

这是一个很有趣的想法！我可以帮你：

1. 深入分析你的需求
2. 提供具体的实现方案
3. 生成相应的代码

你希望我从哪个方面开始？`;
  };

  const getRelevantActions = (input: string): string[] => {
    if (input.includes('角色')) return ['refine-character', 'add-dialogue', 'create-backstory'];
    if (input.includes('代码')) return ['apply-fix', 'review-code', 'add-comments'];
    return ['continue-chat', 'generate-more', 'start-over'];
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
      {/* 面板头部 */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot size={20} className="text-purple-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
          </div>
          <div>
            <div className="font-semibold text-white">AI 创作助手</div>
            <div className="text-xs text-gray-400">在线 • 响应中</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowApiConfig(v => !v)}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={onToggle}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {showApiConfig && (
        <div className="p-4 border-b border-gray-700">
          <input
            className="w-full text-xs p-2 rounded border bg-gray-700 border-gray-600 text-white"
            placeholder="自定义 API 地址"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <AIMessage key={message.id} message={message} />
        ))}
        
        {isAiThinking && <AIMessage message={{ id: 0, type: 'ai' as const, content: '', timestamp: new Date() }} />}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷建议 */}
      <div className="px-4 py-2 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">快捷提问：</div>
        <div className="flex flex-wrap gap-2">
          {_suggestions.map((suggestion: string, index: number) => (
            <button
              key={index}
              onClick={() => setInput(suggestion)}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-full text-gray-300"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="向AI助手提问..."
            className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-purple-500 focus:outline-none text-white placeholder-gray-400"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isAiThinking}
            className="p-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        
        <QuickActions onAction={(action) => {
          // 根据操作类型生成相应的输入
          const actionPrompts: Record<string, string> = {
            'generate-character': '帮我创建一个新角色',
            'create-scene': '帮我创建一个新的场景',
            'add-dialogue': '帮我生成一段角色对话',
            'plot-twist': '帮我设计一个剧情转折',
            'fix-syntax': '帮我修复代码中的语法错误',
            'optimize-code': '帮我优化当前的Ink代码',
            'add-variables': '帮我添加一些新的变量',
            'format-code': '帮我格式化代码',
            'analyze-flow': '帮我分析故事流程',
            'check-balance': '帮我检查游戏平衡性',
            'review-story': '帮我评估整个故事',
            'suggest-improve': '给我一些改进建议'
          };
          
          const prompt = actionPrompts[action] || '请提供更多帮助';
          setInput(prompt);
        }} />
      </div>
    </div>
  );
};

export default AIChatPanel;