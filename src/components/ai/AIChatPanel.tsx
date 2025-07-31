import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, X, Settings, Trash2, Plus, Edit3
} from 'lucide-react';
import AIMessage, { type AIMessageData } from './AIMessage';
import QuickActions from './QuickActions';

// 预置系统Prompt模板
const PRESET_SYSTEM_PROMPTS = {
  novelist: `你是一个专业的互动小说创作助手，专门帮助用户创作精彩的AVG游戏剧本。你的任务包括：
1. 帮助设计有深度的角色和世界观
2. 构思引人入胜的剧情和分支
3. 编写自然生动的对话
4. 提供创作建议和灵感
5. 协助优化故事结构和节奏

请以富有创造力和专业性的方式提供帮助，使用中文回复。`,
  
  coder: `你是一个专业的Ink脚本语言编程助手，专门帮助用户编写和优化互动小说的脚本代码。你的任务包括：
1. 解释Ink语法和使用方法
2. 帮助修复语法错误和逻辑问题
3. 优化代码结构和可读性
4. 提供最佳实践建议
5. 生成符合规范的Ink代码

请提供准确、专业的技术指导，代码示例请使用Ink语法格式。`,
  
  analyzer: `你是一个专业的游戏剧情分析师，专门帮助用户分析和改进互动小说。你的任务包括：
1. 分析剧情结构和逻辑
2. 评估角色发展和动机
3. 检查分支选项的平衡性
4. 提供改进建议
5. 识别潜在问题和风险

请以客观、专业的角度提供分析，给出具体可行的建议。`,
  
  teacher: `你是一个耐心的互动小说创作导师，专门帮助初学者学习AVG游戏创作。你的任务包括：
1. 用简单易懂的方式解释概念
2. 提供循序渐进的学习指导
3. 解答创作过程中的疑问
4. 鼓励和激励创作者
5. 分享实用的创作技巧

请保持耐心和鼓励的态度，使用易于理解的语言进行指导。`
};

// AI模型配置接口
interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'qwen' | 'anthropic' | 'custom';
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  headers?: Record<string, string>;
}

// AI提供商配置
interface AIProviderConfig {
  id: 'openai' | 'qwen' | 'anthropic' | 'custom';
  name: string;
  defaultApiUrl: string;
  apiKeyName: string;
  supportsStreaming: boolean;
}

const SUPPORTED_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    defaultApiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKeyName: 'Authorization',
    supportsStreaming: true
  },
  {
    id: 'qwen',
    name: '通义千问',
    defaultApiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    apiKeyName: 'Authorization',
    supportsStreaming: true
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    defaultApiUrl: 'https://api.anthropic.com/v1/messages',
    apiKeyName: 'x-api-key',
    supportsStreaming: true
  },
  {
    id: 'custom',
    name: '自定义',
    defaultApiUrl: '',
    apiKeyName: 'Authorization',
    supportsStreaming: false
  }
];

interface AIChatPanelProps {
  isOpen?: boolean;
  onToggle?: () => void;
  projectContext: { currentFile: string | null; projectName?: string | null };
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isOpen = true,
  onToggle = () => {},
  projectContext,
}) => {
  // 使用 projectContext 来增强AI的上下文理解
  console.log('📝 AIChatPanel: 当前项目上下文:', projectContext);
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
  // AI模型配置相关状态
  const [models, setModels] = useState<AIModelConfig[]>(() => {
    const savedModels = localStorage.getItem('ai-models');
    return savedModels ? JSON.parse(savedModels) : [];
  });
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    return localStorage.getItem('selected-ai-model') || '';
  });
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelConfig | null>(null);
  const [tempModelConfig, setTempModelConfig] = useState<AIModelConfig>({
    id: Date.now().toString(),
    name: '',
    provider: 'openai',
    apiUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: PRESET_SYSTEM_PROMPTS.novelist
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 获取当前选中的模型配置
  const getCurrentModel = (): AIModelConfig | undefined => {
    if (!selectedModelId) return undefined;
    return models.find(model => model.id === selectedModelId);
  };

  // 根据提供商构建请求头
  const buildHeaders = (model: AIModelConfig): Record<string, string> => {
    const provider = SUPPORTED_PROVIDERS.find(p => p.id === model.provider);
    if (!provider) return {};
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // 添加API密钥
    if (model.provider === 'openai') {
      headers[provider.apiKeyName] = `Bearer ${model.apiKey}`;
    } else if (model.provider === 'qwen') {
      headers[provider.apiKeyName] = `Bearer ${model.apiKey}`;
    } else if (model.provider === 'anthropic') {
      headers[provider.apiKeyName] = model.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      // 自定义提供商
      if (model.headers) {
        Object.assign(headers, model.headers);
      }
      if (model.apiKey && !headers[provider.apiKeyName]) {
        headers[provider.apiKeyName] = model.apiKey;
      }
    }
    
    return headers;
  };

  // 根据提供商构建请求体
  const buildRequestBody = (model: AIModelConfig, messages: { role: string; content: string }[]): any => {
    // 获取操作类型（从最新用户消息中提取）
    const latestUserMessage = messages[messages.length - 1]?.content || '';
    const actionType = Object.keys({
      'generate-character': '帮我创建一个新角色',
      'create-scene': '帮我设计一个新场景',
      'add-dialogue': '为当前场景中的角色生成一段自然的对话',
      'plot-twist': '为我的故事设计一个出人意料但合理的剧情转折',
      'fix-syntax': '检查并修复我提供的Ink代码中的语法错误',
      'optimize-code': '优化这段Ink代码的结构和可读性',
      'add-variables': '根据我的剧情需要，建议一些有用的变量来跟踪状态',
      'format-code': '重新格式化这段Ink代码，使其更易读',
      'analyze-flow': '分析我的剧情分支逻辑，指出可能的问题',
      'check-balance': '评估我的游戏选项是否平衡',
      'review-story': '全面评估我的故事',
      'suggest-improve': '基于当前内容，提供具体的改进建议'
    }).find(key => latestUserMessage.includes(key.split('-')[1])) || '';
    
    // 根据操作类型选择系统Prompt（如果未自定义）
    let systemPrompt = model.systemPrompt;
    if (systemPrompt === PRESET_SYSTEM_PROMPTS.novelist) {
      if (actionType.includes('fix-syntax') || actionType.includes('optimize-code') || 
          actionType.includes('add-variables') || actionType.includes('format-code')) {
        systemPrompt = PRESET_SYSTEM_PROMPTS.coder;
      } else if (actionType.includes('analyze-flow') || actionType.includes('check-balance') || 
                 actionType.includes('review-story') || actionType.includes('suggest-improve')) {
        systemPrompt = PRESET_SYSTEM_PROMPTS.analyzer;
      }
    }
    
    const commonParams = {
      model: model.model,
      temperature: model.temperature,
      max_tokens: model.maxTokens,
    };
    
    if (model.provider === 'openai') {
      return {
        ...commonParams,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ]
      };
    } else if (model.provider === 'qwen') {
      return {
        ...commonParams,
        input: {
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages
          ]
        },
        parameters: {
          temperature: model.temperature,
          max_tokens: model.maxTokens
        }
      };
    } else if (model.provider === 'anthropic') {
      return {
        model: model.model,
        messages: messages,
        system: systemPrompt,
        max_tokens: model.maxTokens || 1024,
        temperature: model.temperature
      };
    } else {
      // 自定义提供商，使用通用格式
      return {
        ...commonParams,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ]
      };
    }
  };

  // 发送消息到AI API
  const sendToAI = async (userMessage: string) => {
    const currentModel = getCurrentModel();
    if (!currentModel) {
      return '请先配置AI模型';
    }
    
    try {
      setIsAiThinking(true);
      
      // 构建消息历史
      const historyMessages = messages
        .filter(m => m.type === 'user' || m.type === 'ai')
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        }));
      
      // 添加当前用户消息
      historyMessages.push({ role: 'user', content: userMessage });
      
      // 构建请求
      const headers = buildHeaders(currentModel);
      const body = buildRequestBody(currentModel, historyMessages);
      
      console.log('发送AI请求:', { url: currentModel.apiUrl, headers, body });
      
      const response = await fetch(currentModel.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API错误:', response.status, errorText);
        return `API错误: ${response.status} - ${errorText}`;
      }
      
      const data = await response.json();
      console.log('AI响应:', data);
      
      // 根据不同提供商解析响应
      if (currentModel.provider === 'openai') {
        return data.choices?.[0]?.message?.content || '无响应内容';
      } else if (currentModel.provider === 'qwen') {
        return data.output?.text || '无响应内容';
      } else if (currentModel.provider === 'anthropic') {
        return data.content?.[0]?.text || '无响应内容';
      } else {
        // 自定义提供商，尝试通用解析
        return data.choices?.[0]?.message?.content || 
               data.output?.text || 
               data.content?.[0]?.text || 
               '无响应内容';
      }
    } catch (error) {
      console.error('AI请求失败:', error);
      return `请求失败: ${error instanceof Error ? error.message : '未知错误'}`;
    } finally {
      setIsAiThinking(false);
    }
  };

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
    
    // 发送到AI API
    const aiResponseContent = await sendToAI(input);
    
    const aiResponse: AIMessageData = {
      id: Date.now() + 1,
      type: 'ai',
      content: aiResponseContent,
      timestamp: new Date(),
      actions: getRelevantActions(input)
    };
    
    setMessages(prev => [...prev, aiResponse]);
  };

  // 模型配置相关函数
  const handleAddModel = () => {
    setEditingModel(null);
    setTempModelConfig({
      id: Date.now().toString(),
      name: '',
      provider: 'openai',
      apiUrl: '',
      apiKey: '',
      model: '',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '你是一个专业的互动小说创作助手，帮助用户创建精彩的AVG游戏剧本。'
    });
    setShowModelConfig(true);
  };

  const handleEditModel = (model: AIModelConfig) => {
    setEditingModel(model);
    setTempModelConfig({ ...model });
    setShowModelConfig(true);
  };

  const handleDeleteModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
    if (selectedModelId === id) {
      setSelectedModelId('');
    }
  };

  const handleSaveModel = () => {
    if (!tempModelConfig.name || !tempModelConfig.model || !tempModelConfig.apiUrl) {
      alert('请填写必填字段');
      return;
    }
    
    if (editingModel) {
      // 更新现有模型
      setModels(prev => prev.map(m => m.id === editingModel.id ? tempModelConfig : m));
    } else {
      // 添加新模型
      setModels(prev => [...prev, tempModelConfig]);
    }
    
    setShowModelConfig(false);
  };

  const handleProviderChange = (providerId: AIModelConfig['provider']) => {
    setTempModelConfig(prev => {
      const provider = SUPPORTED_PROVIDERS.find(p => p.id === providerId);
      return {
        ...prev,
        provider: providerId,
        apiUrl: provider?.defaultApiUrl || ''
      };
    });
  };

  const getRelevantActions = (input: string): string[] => {
    if (input.includes('角色')) return ['refine-character', 'add-dialogue', 'create-backstory'];
    if (input.includes('代码')) return ['apply-fix', 'review-code', 'add-comments'];
    return ['continue-chat', 'generate-more', 'start-over'];
  };

  // 保存模型配置到localStorage
  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  // 保存选中的模型ID到localStorage
  useEffect(() => {
    if (selectedModelId) {
      localStorage.setItem('selected-ai-model', selectedModelId);
    }
  }, [selectedModelId]);

  if (!isOpen) return null;

  return (
    <div className="bg-gray-800 flex flex-col h-full w-full">
      {/* 面板头部 */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot size={20} className="text-purple-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />
          </div>
          <div>
            <div className="font-semibold text-white">AI 创作助手</div>
            <div className="text-xs text-gray-400">
              {getCurrentModel()?.name || '未选择模型'} • 在线
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowModelConfig(true)}
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

      {/* 模型配置面板 */}
      {showModelConfig && (
        <div className="absolute inset-0 bg-gray-800 z-10 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-white">
              {editingModel ? '编辑模型' : '添加模型'}
            </h3>
            <button 
              onClick={() => setShowModelConfig(false)}
              className="text-gray-400 hover:text-white p-1 rounded"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                模型名称 *
              </label>
              <input
                type="text"
                value={tempModelConfig.name}
                onChange={(e) => setTempModelConfig(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="例如：GPT-4 Turbo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                服务提供商 *
              </label>
              <select
                value={tempModelConfig.provider}
                onChange={(e) => handleProviderChange(e.target.value as AIModelConfig['provider'])}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                {SUPPORTED_PROVIDERS.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API 地址 *
              </label>
              <input
                type="text"
                value={tempModelConfig.apiUrl}
                onChange={(e) => setTempModelConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder={SUPPORTED_PROVIDERS.find(p => p.id === tempModelConfig.provider)?.defaultApiUrl || "https://api.example.com/v1/chat/completions"}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API 密钥 *
              </label>
              <input
                type="password"
                value={tempModelConfig.apiKey}
                onChange={(e) => setTempModelConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                模型名称 *
              </label>
              <input
                type="text"
                value={tempModelConfig.model}
                onChange={(e) => setTempModelConfig(prev => ({ ...prev, model: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="例如：gpt-4-turbo"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  温度 (0-2)
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={tempModelConfig.temperature}
                  onChange={(e) => setTempModelConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  最大 Token
                </label>
                <input
                  type="number"
                  min="1"
                  value={tempModelConfig.maxTokens}
                  onChange={(e) => setTempModelConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                系统提示词
              </label>
              <div className="mb-2">
                <select
                  value={Object.keys(PRESET_SYSTEM_PROMPTS).find(key => 
                    PRESET_SYSTEM_PROMPTS[key as keyof typeof PRESET_SYSTEM_PROMPTS] === tempModelConfig.systemPrompt
                  ) || 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setTempModelConfig(prev => ({
                        ...prev,
                        systemPrompt: PRESET_SYSTEM_PROMPTS[e.target.value as keyof typeof PRESET_SYSTEM_PROMPTS]
                      }));
                    }
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mb-2"
                >
                  <option value="novelist">小说创作专家</option>
                  <option value="coder">Ink脚本程序员</option>
                  <option value="analyzer">剧情分析师</option>
                  <option value="teacher">创作导师</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
              <textarea
                value={tempModelConfig.systemPrompt}
                onChange={(e) => setTempModelConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                rows={6}
                placeholder="输入系统提示词，指导AI的行为..."
              />
              <p className="text-xs text-gray-400 mt-1">
                系统提示词用于指导AI的行为和回答风格。选择预设模板或自定义内容。
              </p>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-700 flex justify-end space-x-2">
            <button
              onClick={() => setShowModelConfig(false)}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              取消
            </button>
            <button
              onClick={handleSaveModel}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              保存
            </button>
          </div>
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
        <div className="flex space-x-2 mb-3">
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="">选择模型</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddModel}
            className="p-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
            title="添加模型"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {models.length > 0 && selectedModelId && (
          <div className="mb-3 flex flex-wrap gap-2">
            {models
              .filter(model => model.id === selectedModelId)
              .map(model => (
                <div key={model.id} className="flex items-center bg-gray-700 rounded-full px-3 py-1 text-xs">
                  <span className="text-gray-300">{model.name}</span>
                  <button
                    onClick={() => handleEditModel(model)}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteModel(model.id)}
                    className="ml-1 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
          </div>
        )}
        
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
            disabled={!input.trim() || isAiThinking || !selectedModelId}
            className="p-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
        
        <QuickActions onAction={(action) => {
          // 根据操作类型生成相应的输入
          const actionPrompts: Record<string, string> = {
            'generate-character': '帮我创建一个新角色，包括姓名、背景故事和性格特点',
            'create-scene': '帮我设计一个新场景，包括环境描述和可能的交互元素',
            'add-dialogue': '为当前场景中的角色生成一段自然的对话',
            'plot-twist': '为我的故事设计一个出人意料但合理的剧情转折',
            'fix-syntax': '检查并修复我提供的Ink代码中的语法错误',
            'optimize-code': '优化这段Ink代码的结构和可读性',
            'add-variables': '根据我的剧情需要，建议一些有用的变量来跟踪状态',
            'format-code': '重新格式化这段Ink代码，使其更易读',
            'analyze-flow': '分析我的剧情分支逻辑，指出可能的问题',
            'check-balance': '评估我的游戏选项是否平衡，是否存在过于简单或困难的部分',
            'review-story': '全面评估我的故事，包括角色、情节、对话等方面',
            'suggest-improve': '基于当前内容，提供具体的改进建议'
          };
          
          const prompt = actionPrompts[action] || '请提供更多帮助';
          setInput(prompt);
        }} />
      </div>
    </div>
  );
};

export default AIChatPanel;