import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Settings } from 'lucide-react';
import AIMessage, { AIMessageData } from './AIMessage';
import QuickActions from './QuickActions';

interface AIChatPanelProps {
  projectContext: { currentFile: string | null; projectName?: string | null };
  apiUrl?: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  projectContext,
  apiUrl: initialApiUrl = '',
}) => {
  const [messages, setMessages] = useState<AIMessageData[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [apiUrl, setApiUrl] = useState(initialApiUrl);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: AIMessageData = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    let reply = '';
    if (apiUrl) {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input, context: projectContext }),
        });
        const data = await res.json();
        reply = data.reply ?? data.response ?? '';
      } catch {
        reply = '自定义 API 调用失败';
      }
    } else {
      reply = `你说: ${input}`;
    }

    const aiMsg: AIMessageData = {
      id: Date.now() + 1,
      type: 'ai',
      content: reply,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsThinking(false);
  };

  return (
    <div
      className="w-64 flex flex-col"
      style={{
        backgroundColor: 'var(--color-sidebarBackground)',
        borderRight: `1px solid var(--color-sidebarBorder)`,
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--color-sidebarBorder)' }}
      >
        <div className="flex items-center gap-2 text-sm">
          <Bot size={16} />
          <span>AI 聊天</span>
        </div>
        <button
          onClick={() => setShowApiConfig((v) => !v)}
          className="text-gray-400 hover:text-white"
        >
          <Settings size={14} />
        </button>
      </div>
      {showApiConfig && (
        <div className="p-2 border-b" style={{ borderColor: 'var(--color-sidebarBorder)' }}>
          <input
            className="w-full text-xs p-1 rounded border"
            style={{
              backgroundColor: 'var(--color-inputBackground)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-textPrimary)',
            }}
            placeholder="自定义 API 地址"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <AIMessage key={m.id} message={m} />
        ))}
        {isThinking && <div className="text-xs text-gray-400">AI...</div>}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t" style={{ borderColor: 'var(--color-sidebarBorder)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 text-sm px-2 py-1 rounded border"
            style={{
              backgroundColor: 'var(--color-inputBackground)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-textPrimary)',
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="向 AI 提问..."
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2 bg-purple-600 text-white rounded disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
        <QuickActions onAction={(t) => setInput(t)} />
      </div>
    </div>
  );
};

export default AIChatPanel;
