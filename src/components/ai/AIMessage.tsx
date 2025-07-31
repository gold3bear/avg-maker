import React, { useState } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Wand2, 
  Code, 
  Sparkles, 
  MessageSquare, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';

export interface AIMessageData {
  id: number;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  actions?: string[];
}

interface AIMessageProps {
  message: AIMessageData;
  onToggleSettings?: () => void;
  onActionClick?: (action: string) => void;
}

const formatTime = (date: Date | string): string => {
  // 如果传入的是字符串，尝试将其转换为 Date 对象
  const validDate = typeof date === 'string' ? new Date(date) : date;

  if (!(validDate instanceof Date) || isNaN(validDate.getTime())) {
    console.error('Invalid date provided:', date);
    return 'Invalid Date';
  }

  const now = new Date();
  const diff = now.getTime() - validDate.getTime();
  
  if (diff < 60000) return '刚才';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  return validDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const CodeBlock = ({ language, code, onCopy, copied }: { 
  language: string; 
  code: string; 
  onCopy: () => void; 
  copied: boolean;
}) => (
  <div className="bg-gray-900 rounded-lg my-3 border border-gray-600">
    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-600">
      <span className="text-xs text-gray-400 font-mono">{language}</span>
      <button
        onClick={onCopy}
        className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        <span>{copied ? '已复制' : '复制'}</span>
      </button>
    </div>
    <pre className="p-3 text-sm text-gray-100 font-mono overflow-x-auto">
      <code>{code}</code>
    </pre>
  </div>
);

const ActionButton = ({ action, onClick }: { action: string; onClick: (action: string) => void }) => {
  const actionConfig: Record<string, { text: string; icon: React.ReactNode }> = {
    'generate-character': { text: '生成角色', icon: <User size={12} /> },
    'create-scene': { text: '创建场景', icon: <Wand2 size={12} /> },
    'fix-code': { text: '修复代码', icon: <Code size={12} /> },
    'refine-character': { text: '完善角色', icon: <Sparkles size={12} /> },
    'add-dialogue': { text: '添加对话', icon: <MessageSquare size={12} /> },
    'apply-fix': { text: '应用修复', icon: <CheckCircle size={12} /> },
    'continue-chat': { text: '继续对话', icon: <ChevronRight size={12} /> },
    'analyze-flow': { text: '分析流程', icon: <AlertCircle size={12} /> },
    'generate-ink-code': { text: '生成Ink代码', icon: <Code size={12} /> },
    'generate-more': { text: '生成更多', icon: <Wand2 size={12} /> },
    'start-over': { text: '重新开始', icon: <AlertCircle size={12} /> }
  };

  const config = actionConfig[action] || { text: action, icon: <Wand2 size={12} /> };

  return (
    <button 
      onClick={() => onClick(action)}
      className="flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-gray-200 transition-colors"
    >
      {config.icon}
      <span>{config.text}</span>
    </button>
  );
};

const AIThinkingIndicator = () => (
  <div className="flex justify-start">
    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
      <Bot size={16} className="text-white" />
    </div>
    <div className="bg-gray-700 rounded-2xl rounded-tl-none px-4 py-3">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-gray-300">AI正在思考...</span>
      </div>
    </div>
  </div>
);

export const AIMessage: React.FC<AIMessageProps> = ({ message, onActionClick, onToggleSettings }) => {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const isAI = message.type === 'ai';
  const isUser = message.type === 'user';

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderContent = (content: string) => {
    // 处理代码块
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // 添加代码块前的文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      // 添加代码块
      const language = match[1] || 'text';
      const code = match[2];
      parts.push(
        <CodeBlock
          key={`code-${match.index}`}
          language={language}
          code={code}
          onCopy={() => handleCopyCode(code, match!.index)}
          copied={copiedCode === match.index}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余文本
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span>{content}</span>;
  };

  if (!message.content) {
    return <AIThinkingIndicator />;
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isAI && (
        <div 
          className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3 cursor-pointer"
          onClick={() => onToggleSettings?.()}
        >
          <Bot size={16} className="text-white" />
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`
          rounded-2xl px-4 py-3 text-sm
          ${isAI ? 'bg-gray-700 text-gray-100' : 'bg-purple-600 text-white'}
          ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}
        `}>
          <div className="whitespace-pre-wrap leading-relaxed">
            {renderContent(message.content)}
          </div>
          
          {/* AI消息的操作按钮 */}
          {isAI && message.actions && message.actions.length > 0 && onActionClick && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-600">
              {message.actions.map((action) => (
                <ActionButton key={action} action={action} onClick={onActionClick} />
              ))}
            </div>
          )}
        </div>
        
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>

    </div>
  );
};

export default AIMessage;