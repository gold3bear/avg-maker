import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, X, Settings, Trash2, Plus, Edit3, CheckCircle, AlertCircle, Loader2, MessageSquare, Clock, Search
} from 'lucide-react';
import AIMessage, { type AIMessageData } from './AIMessage';

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

// 会话历史接口
interface ChatSession {
  id: string;
  title: string;
  messages: AIMessageData[];
  createdAt: Date;
  updatedAt: Date;
  modelId: string;
  messageCount: number;
  preview?: string; // 会话预览文本
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
    defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
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

// 面板状态枚举
type PanelState = 'empty' | 'ready' | 'chatting' | 'history';

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isOpen = true,
  onToggle = () => {},
  projectContext,
}) => {
  // 使用 projectContext 来增强AI的上下文理解
  console.log('📝 AIChatPanel: 当前项目上下文:', projectContext);
  
  // 面板状态管理
  const [panelState, setPanelState] = useState<PanelState>('empty');
  
  // 聊天相关状态
  const [messages, setMessages] = useState<AIMessageData[]>([]);
  const [input, setInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  
  // 会话历史状态
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // AI模型配置相关状态
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [storageConfig, setStorageConfig] = useState({ 
    storageType: 'file' as 'file', 
    enableLocalStorageSync: false 
  });
  
  // UI状态管理
  const [showSettings, setShowSettings] = useState(false);
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
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [proxyInfo, setProxyInfo] = useState<string>('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 智能更新面板状态
  const updatePanelState = () => {
    if (showHistory) {
      setPanelState('history');
    } else if (models.length === 0 || !selectedModelId) {
      setPanelState('empty');
    } else if (messages.length === 0) {
      setPanelState('ready');
    } else {
      setPanelState('chatting');
    }
  };

  // 监听模型和消息变化，自动更新面板状态
  useEffect(() => {
    updatePanelState();
  }, [models, selectedModelId, messages, showHistory]);

  // 基于项目上下文生成智能建议
  const getContextualSuggestions = (): string[] => {
    const currentFile = projectContext.currentFile;
    const projectName = projectContext.projectName;
    
    if (currentFile?.endsWith('.ink')) {
      return [
        '检查当前Ink文件的语法错误',
        '优化这个文件的代码结构',
        '为当前场景添加更多选择分支'
      ];
    } else if (projectName) {
      return [
        '基于项目设定创建新角色',
        '为项目设计新的剧情线',
        '生成项目相关的对话场景'
      ];
    } else {
      return [
        '帮我创建一个有趣的角色',
        '设计一个引人入胜的开场',
        '生成一个情节转折点'
      ];
    }
  };

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
    
    if (model.provider === 'openai' || model.provider === 'qwen') {
      // OpenAI和通义千问兼容模式使用相同格式
      return {
        ...commonParams,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ]
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

  // 发送流式消息到AI API
  const sendToAIStream = async (userMessage: string): Promise<number> => {
    const currentModel = getCurrentModel();
    if (!currentModel) {
      throw new Error('请先配置AI模型');
    }
    
    try {
      // 注意：在流式模式下不设置isAiThinking，因为空的流式消息已经显示思考状态
      
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
      
      console.log('🌊 发送AI流式请求:', { url: currentModel.apiUrl, headers, body });
      
      // 创建AI响应消息
      const aiMessageId = Date.now() + 1;
      const aiResponse: AIMessageData = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        actions: []
      };
      
      // 添加空的AI消息到列表中（空内容会自动显示思考指示器）
      setMessages(prev => [...prev, aiResponse]);
      setStreamingMessageId(aiMessageId);
      setStreamingContent('');
      
      // 使用流式API
      if (window.inkAPI && typeof window.inkAPI.aiApiStreamRequest === 'function') {
        const result = await window.inkAPI.aiApiStreamRequest({
          url: currentModel.apiUrl,
          headers,
          body
        });
        
        if (!result.success) {
          throw new Error(result.error || '流式请求启动失败');
        }
      } else {
        throw new Error('流式API不可用，请更新应用版本');
      }
      
      return aiMessageId;
    } catch (error) {
      console.error('🌊 AI流式请求失败:', error);
      throw error;
    }
  };

  // 发送消息到AI API（非流式，作为后备）
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
      
      // 使用Electron IPC代理请求，避免CORS问题
      const result = await window.inkAPI.aiApiRequest({
        url: currentModel.apiUrl,
        headers,
        body
      });
      
      if (!result.success) {
        console.error('AI API错误:', result.status, result.error);
        return `API错误: ${result.status || 'Unknown'} - ${result.error || '请求失败'}`;
      }
      
      const data = result.data;
      console.log('AI响应:', data);
      
      // 根据不同提供商解析响应
      if (currentModel.provider === 'openai' || currentModel.provider === 'qwen') {
        // OpenAI和通义千问兼容模式使用相同格式
        return data.choices?.[0]?.message?.content || '无响应内容';
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

    // 如果没有当前会话，创建新会话
    if (!currentSessionId) {
      const newSession = createNewSession();
      setCurrentSessionId(newSession.id);
      setMessages(newSession.messages);
    }

    const userMessage: AIMessageData = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    const userInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      // 尝试使用流式API
      const aiMessageId = await sendToAIStream(userInput);
      // 流式响应会通过事件监听器处理
    } catch (error) {
      console.error('🌊 流式请求失败，回退到非流式API:', error);
      
      // 回退到非流式API
      const aiResponseContent = await sendToAI(userInput);
      
      const aiResponse: AIMessageData = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseContent,
        timestamp: new Date(),
        actions: getRelevantActions(aiResponseContent, true)
      };
      
      setMessages(prev => {
        const newMessages = [...prev, aiResponse];
        // 异步保存会话
        saveSessionAfterMessage(newMessages, aiResponse);
        return newMessages;
      });
    }
  };

  // 保存会话的辅助函数
  const saveSessionAfterMessage = (newMessages: AIMessageData[], aiResponse: AIMessageData) => {
    setTimeout(() => {
      if (currentSessionId) {
        const session: ChatSession = {
          id: currentSessionId,
          title: generateSessionTitle(newMessages),
          messages: newMessages,
          createdAt: chatSessions.find(s => s.id === currentSessionId)?.createdAt || new Date(),
          updatedAt: new Date(),
          modelId: selectedModelId,
          messageCount: newMessages.length,
          preview: aiResponse.content.substring(0, 100) + '...'
        };
        
        // 检查IPC方法是否存在，避免启动时的错误
        if (window.inkAPI && typeof window.inkAPI.saveChatSession === 'function') {
          window.inkAPI.saveChatSession(session).then(result => {
            if (result.success) {
              setChatSessions(prev => {
                const index = prev.findIndex(s => s.id === currentSessionId);
                if (index >= 0) {
                  return [...prev.slice(0, index), session, ...prev.slice(index + 1)];
                } else {
                  return [session, ...prev];
                }
              });
            }
          });
        } else {
          console.warn('⚠️ window.inkAPI.saveChatSession 方法不可用，跳过会话保存');
        }
      }
    }, 100);
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
      systemPrompt: PRESET_SYSTEM_PROMPTS.novelist
    });
    setFormErrors({});
    setShowModelConfig(true);
  };

  const handleEditModel = (model: AIModelConfig) => {
    setEditingModel(model);
    setTempModelConfig({ ...model });
    setFormErrors({});
    setShowModelConfig(true);
  };

  const handleDeleteModel = (id: string) => {
    const updatedModels = models.filter(m => m.id !== id);
    setModels(updatedModels);
    
    // 如果删除的是当前选中的模型，清空选择或自动选择第一个可用模型
    if (selectedModelId === id) {
      const newSelectedId = updatedModels.length > 0 ? updatedModels[0].id : '';
      setSelectedModelId(newSelectedId);
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!tempModelConfig.name.trim()) {
      errors.name = '请输入模型名称';
    }
    
    if (!tempModelConfig.apiUrl.trim()) {
      errors.apiUrl = '请输入API地址';
    }
    
    if (!tempModelConfig.apiKey.trim()) {
      errors.apiKey = '请输入API密钥';
    }
    
    if (!tempModelConfig.model.trim()) {
      errors.model = '请输入模型ID';
    }
    
    // 检查模型名称是否重复
    const existingModel = models.find(m => 
      m.name === tempModelConfig.name.trim() && 
      (!editingModel || m.id !== editingModel.id)
    );
    if (existingModel) {
      errors.name = '模型名称已存在';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveModel = () => {
    if (!validateForm()) {
      console.log('⚠️ Model validation failed, not saving');
      return;
    }
    
    console.log('💾 Saving model:', tempModelConfig.name, editingModel ? '(update)' : '(new)');
    
    if (editingModel) {
      // 更新现有模型
      console.log('🔄 Updating existing model:', editingModel.name, '->', tempModelConfig.name);
      setModels(prev => prev.map(m => m.id === editingModel.id ? tempModelConfig : m));
    } else {
      // 添加新模型
      console.log('➕ Adding new model:', tempModelConfig.name);
      setModels(prev => {
        const newModels = [...prev, tempModelConfig];
        console.log('📊 New models array length:', newModels.length);
        return newModels;
      });
    }
    
    setFormErrors({});
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

  const getRelevantActions = (input: string, isAIResponse: boolean = false): string[] => {
    // 如果是AI回复，根据内容判断是否显示生成Ink代码按钮
    if (isAIResponse) {
      const hasStoryContent = input.includes('角色') || input.includes('场景') || input.includes('对话') || 
                              input.includes('剧情') || input.includes('故事') || input.includes('选择') ||
                              input.includes('分支') || input.includes('情节');
      
      if (hasStoryContent) {
        return ['generate-ink-code', 'refine-character', 'continue-chat'];
      }
      
      return ['continue-chat', 'generate-more'];
    }
    
    // 用户输入的相关操作
    if (input.includes('角色')) return ['refine-character', 'add-dialogue', 'create-backstory'];
    if (input.includes('代码')) return ['apply-fix', 'review-code', 'add-comments'];
    return ['continue-chat', 'generate-more', 'start-over'];
  };

  // 处理action按钮点击
  const handleActionClick = async (action: string) => {
    const actionPrompts: Record<string, string> = {
      'generate-character': '请帮我创建一个有趣且有深度的角色，包括背景故事、性格特点和动机。',
      'create-scene': '请帮我设计一个引人入胜的场景，包括环境描述、氛围营造和可能的互动选项。',
      'fix-code': '请检查并修复我提供的Ink代码中的语法错误和逻辑问题。',
      'refine-character': '请帮我进一步完善这个角色的设定，增加更多细节和深度。',
      'add-dialogue': '请为当前场景和角色生成一段自然、生动的对话。',
      'apply-fix': '请应用之前建议的修复方案。',
      'continue-chat': '请继续我们的对话。',
      'analyze-flow': '请分析我的剧情分支逻辑，指出可能存在的问题。',
      'generate-ink-code': `请将上面的剧本内容转换成标准的Ink脚本格式。要求：
1. 使用Ink语法规范：对话直接写文本，选择用*标记，分支用->标记
2. 包含合适的变量和条件判断（使用{}和[]语法）
3. 添加必要的标签（knot）和分支（stitch）结构
4. 确保代码可以在Ink引擎中正常运行
5. 请用代码块格式输出，便于复制使用

请直接输出Ink代码，不需要额外解释。`
    };

    const prompt = actionPrompts[action] || `请执行操作：${action}`;
    
    // 直接发送消息，不需要用户再次点击发送
    await sendActionMessage(prompt);
  };

  // 发送action触发的消息
  const sendActionMessage = async (message: string) => {
    if (!message.trim()) return;

    // 如果没有当前会话，创建新会话
    if (!currentSessionId) {
      const newSession = createNewSession();
      setCurrentSessionId(newSession.id);
      setMessages(newSession.messages);
    }

    const userMessage: AIMessageData = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    try {
      // 尝试使用流式API
      const aiMessageId = await sendToAIStream(message);
      // 流式响应会通过事件监听器处理
    } catch (error) {
      console.error('🌊 Action流式请求失败，回退到非流式API:', error);
      
      // 回退到非流式API
      const aiResponseContent = await sendToAI(message);
      
      const aiResponse: AIMessageData = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseContent,
        timestamp: new Date(),
        actions: getRelevantActions(aiResponseContent, true)
      };
      
      setMessages(prev => {
        const newMessages = [...prev, aiResponse];
        // 异步保存会话
        saveSessionAfterMessage(newMessages, aiResponse);
        return newMessages;
      });
    }
  };

  // 快速配置预设模型
  const quickSetupModel = async (preset: 'qwen' | 'openai' | 'custom') => {
    const presets = {
      qwen: {
        id: Date.now().toString(),
        name: '通义千问',
        provider: 'qwen' as const,
        apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        apiKey: '',
        model: 'qwen-plus',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: PRESET_SYSTEM_PROMPTS.novelist
      },
      openai: {
        id: Date.now().toString(),
        name: 'GPT-4',
        provider: 'openai' as const,
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-4-turbo',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: PRESET_SYSTEM_PROMPTS.novelist
      },
      custom: {
        id: Date.now().toString(),
        name: '自定义模型',
        provider: 'custom' as const,
        apiUrl: '',
        apiKey: '',
        model: '',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: PRESET_SYSTEM_PROMPTS.novelist
      }
    };

    setTempModelConfig(presets[preset]);
    setEditingModel(null);
    setFormErrors({});
    setShowModelConfig(true);
  };

  // 生成会话标题
  const generateSessionTitle = (messages: AIMessageData[]): string => {
    const firstUserMessage = messages.find(m => m.type === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.trim();
      return content.length > 30 ? content.substring(0, 30) + '...' : content;
    }
    return '新对话';
  };

  // 创建新会话
  const createNewSession = (): ChatSession => {
    const sessionId = Date.now().toString();
    const initialMessages = [{
      id: Date.now(),
      type: 'ai' as const,
      content: '你好！我是AVG Maker的AI助手。我可以帮你创作精彩的互动小说。现在想从哪里开始？',
      timestamp: new Date(),
      actions: ['generate-character', 'create-scene', 'fix-code']
    }];

    const session: ChatSession = {
      id: sessionId,
      title: '新对话',
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
      modelId: selectedModelId,
      messageCount: 1,
      preview: '你好！我是AVG Maker的AI助手...'
    };

    return session;
  };

  // 保存当前会话
  const saveCurrentSession = async () => {
    if (!currentSessionId || messages.length === 0) return;

    const session: ChatSession = {
      id: currentSessionId,
      title: generateSessionTitle(messages),
      messages: [...messages],
      createdAt: chatSessions.find(s => s.id === currentSessionId)?.createdAt || new Date(),
      updatedAt: new Date(),
      modelId: selectedModelId,
      messageCount: messages.length,
      preview: messages[messages.length - 1]?.content.substring(0, 100) + '...'
    };

    try {
      if (window.inkAPI && typeof window.inkAPI.saveChatSession === 'function') {
        const result = await window.inkAPI.saveChatSession(session);
        if (result.success) {
          setChatSessions(prev => {
            const index = prev.findIndex(s => s.id === currentSessionId);
            if (index >= 0) {
              return [...prev.slice(0, index), session, ...prev.slice(index + 1)];
            } else {
              return [session, ...prev];
            }
          });
        }
      } else {
        console.warn('⚠️ window.inkAPI.saveChatSession 方法不可用，跳过会话保存');
      }
    } catch (error) {
      console.error('保存会话失败:', error);
    }
  };

  // 加载会话历史
  const loadChatSessions = async () => {
    try {
      if (window.inkAPI && typeof window.inkAPI.loadChatSessions === 'function') {
        const result = await window.inkAPI.loadChatSessions();
        if (result.success) {
          setChatSessions(result.data.map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt)
          })));
        }
      } else {
        console.warn('⚠️ window.inkAPI.loadChatSessions 方法不可用，跳过会话加载');
      }
    } catch (error) {
      console.error('加载会话历史失败:', error);
    }
  };

  // 开始新对话
  const startNewConversation = () => {
    const newSession = createNewSession();
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    setShowHistory(false);
    setPanelState('chatting');
  };

  // 加载指定会话
  const loadSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setSelectedModelId(session.modelId);
      setShowHistory(false);
      setPanelState('chatting');
    }
  };

  // 删除会话
  const deleteSession = async (sessionId: string) => {
    try {
      if (window.inkAPI && typeof window.inkAPI.deleteChatSession === 'function') {
        const result = await window.inkAPI.deleteChatSession(sessionId);
        if (result.success) {
          setChatSessions(prev => prev.filter(s => s.id !== sessionId));
          if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            setMessages([]);
            setPanelState('ready');
          }
        }
      } else {
        console.warn('⚠️ window.inkAPI.deleteChatSession 方法不可用，跳过会话删除');
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  // 纯文件存储函数
  const saveModelsToStorage = async (modelsData: AIModelConfig[]) => {
    try {
      const result = await window.inkAPI.saveAIModels(modelsData);
      if (result.success) {
        console.log('✅ Models saved to file storage');
      } else {
        console.error('❌ Failed to save models to file:', result.error);
      }
      return result;
    } catch (error) {
      console.error('❌ Error saving models:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  const saveSelectedModelToStorage = async (modelId: string) => {
    try {
      if (modelId) {
        const result = await window.inkAPI.saveSelectedAIModel(modelId);
        if (result.success) {
          console.log('✅ Selected model saved to file storage');
        } else {
          console.error('❌ Failed to save selected model to file:', result.error);
        }
        return result;
      }
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving selected model:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  // 验证存储状态
  const handleVerifyStorage = async () => {
    setVerificationLoading(true);
    try {
      const result = await window.inkAPI.verifyAIStorage();
      setVerificationResult(result);
      console.log('🔍 Storage verification result:', result);
    } catch (error) {
      console.error('Storage verification failed:', error);
      setVerificationResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  // 清除存储数据（测试用）
  const handleClearStorage = async () => {
    if (!confirm('确定要清除所有AI配置数据吗？这个操作不可恢复！')) {
      return;
    }
    
    try {
      const result = await window.inkAPI.clearAIStorage();
      if (result.success) {
        // 清除本地状态
        setModels([]);
        setSelectedModelId('');
        alert('AI配置数据已清除！');
        // 重新验证
        await handleVerifyStorage();
      } else {
        alert(`清除失败: ${result.error}`);
      }
    } catch (error) {
      console.error('Clear storage failed:', error);
      alert(`清除失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  // 保存模型配置到存储
  useEffect(() => {
    // 只有在初始加载完成后才开始保存，避免初始化时的空数组覆盖已有数据
    if (!isInitialLoaded) {
      console.log('⏳ Skipping save - initial load not completed yet');
      return;
    }

    saveModelsToStorage(models);
  }, [models, isInitialLoaded]);

  // 保存选中的模型ID到存储
  useEffect(() => {
    // 只有在初始加载完成后才开始保存
    if (!isInitialLoaded) {
      console.log('⏳ Skipping selected model save - initial load not completed yet');
      return;
    }

    if (selectedModelId) {
      saveSelectedModelToStorage(selectedModelId);
    }
  }, [selectedModelId, isInitialLoaded]);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 流式响应事件监听器
  useEffect(() => {
    if (!window.inkAPI || !window.inkAPI.onAIStreamData) return;

    let cleanupFunctions: (() => void)[] = [];

    // 监听流式数据
    const cleanupData = window.inkAPI.onAIStreamData((data: string) => {
      console.log('🌊 收到流式数据:', data);
      if (streamingMessageId) {
        setStreamingContent(prev => prev + data);
        // 实时更新消息内容
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: streamingContent + data }
            : msg
        ));
      }
    });
    cleanupFunctions.push(cleanupData);

    // 监听流式结束
    const cleanupEnd = window.inkAPI.onAIStreamEnd(() => {
      console.log('🌊 流式响应结束');
      if (streamingMessageId) {
        setMessages(prev => {
          const newMessages = prev.map(msg => 
            msg.id === streamingMessageId 
              ? { 
                  ...msg, 
                  content: streamingContent,
                  actions: getRelevantActions(streamingContent, true)
                }
              : msg
          );
          
          // 保存会话
          const aiResponse = newMessages.find(msg => msg.id === streamingMessageId);
          if (aiResponse) {
            saveSessionAfterMessage(newMessages, aiResponse);
          }
          
          return newMessages;
        });
        
        setStreamingMessageId(null);
        setStreamingContent('');
        // 流式模式下不需要设置isAiThinking状态
      }
    });
    cleanupFunctions.push(cleanupEnd);

    // 监听流式错误
    const cleanupError = window.inkAPI.onAIStreamError((error: string) => {
      console.error('🌊 流式响应错误:', error);
      
      if (streamingMessageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: `错误: ${error}` }
            : msg
        ));
        
        setStreamingMessageId(null);
        setStreamingContent('');
        // 流式模式下不需要设置isAiThinking状态
      }
    });
    cleanupFunctions.push(cleanupError);

    // 清理函数
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [streamingMessageId, streamingContent]);

  // 初始化加载配置数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🔄 Loading initial AI configuration data...');
        
        // 1. 加载AI模型数据
        await loadDataByStorageConfig(storageConfig);
        
        // 2. 加载会话历史
        await loadChatSessions();
        
        // 3. 获取代理信息
        const proxyResult = await window.inkAPI.getProxyInfo();
        if (proxyResult.success && proxyResult.proxyInfo) {
          setProxyInfo(proxyResult.proxyInfo);
          console.log('🌐 Proxy info:', proxyResult.proxyInfo);
        }
        
        // 3. 标记初始加载完成
        setIsInitialLoaded(true);
        console.log('✅ Initial data loading completed');
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // 即使加载失败也要标记为完成，允许后续操作
        setIsInitialLoaded(true);
      }
    };
    
    loadInitialData();
  }, []);

  // 纯文件存储加载：项目 .ai-config → 用户数据目录
  const loadDataByStorageConfig = async (config: typeof storageConfig) => {
    console.log('📥 Loading data from file storage...');
    
    let loadedModels: AIModelConfig[] = [];
    let loadedSelectedId = '';
    let loadSource = '';
    
    try {
      // 加载模型配置
      const modelsResult = await window.inkAPI.loadAIModels();
      if (modelsResult.success && modelsResult.data.length > 0) {
        loadedModels = modelsResult.data;
        loadSource = modelsResult.source || 'file';
        console.log('📥 Loaded', loadedModels.length, 'models from', loadSource, 'storage');
      }
      
      // 加载选中的模型
      const selectedResult = await window.inkAPI.loadSelectedAIModel();
      if (selectedResult.success && selectedResult.data) {
        loadedSelectedId = selectedResult.data;
        console.log('📥 Loaded selected model from', selectedResult.source || 'file', 'storage:', selectedResult.data);
      }
      
      // 输出加载结果
      if (loadedModels.length > 0) {
        console.log(`✅ Successfully loaded ${loadedModels.length} models from ${loadSource}`);
        if (loadSource === 'project') {
          console.log('🎯 Using project .ai-config directory (highest priority)');
        }
      } else {
        console.log('ℹ️ No AI models found in file storage');
      }
    } catch (error) {
      console.error('❌ Failed to load from file storage:', error);
    }
    
    // 设置加载的数据
    setModels(loadedModels);
    setSelectedModelId(loadedSelectedId);
  };

  // 开发环境调试命令
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      // 添加到全局调试对象
      if (!window.__DEV_TESTING__) {
        window.__DEV_TESTING__ = {} as any;
      }
      
      window.__DEV_TESTING__.aiStorage = {
        // 验证存储状态
        verify: async () => {
          try {
            const result = await window.inkAPI.verifyAIStorage();
            console.log('🔍 AI Storage Verification:', result);
            return result;
          } catch (error) {
            console.error('Verification failed:', error);
            return { success: false, error };
          }
        },
        
        // 清除存储数据
        clear: async () => {
          try {
            const result = await window.inkAPI.clearAIStorage();
            console.log('🗑️ AI Storage Clear:', result);
            return result;
          } catch (error) {
            console.error('Clear failed:', error);
            return { success: false, error };
          }
        },
        
        // 查看当前内存中的数据
        showMemoryData: () => {
          console.log('📊 AI Storage Memory Data:');
          console.log('Models:', models);
          console.log('Selected Model ID:', selectedModelId);
          console.log('Models Count:', models.length);
          return { models, selectedModelId, count: models.length };
        },
        
        // 强制重新加载数据
        reload: async () => {
          try {
            console.log('🔄 Reloading AI storage data...');
            
            const modelsResult = await window.inkAPI.loadAIModels();
            const selectedResult = await window.inkAPI.loadSelectedAIModel();
            
            if (modelsResult.success) {
              setModels(modelsResult.data);
              console.log('✅ Models reloaded:', modelsResult.data.length);
            }
            
            if (selectedResult.success) {
              setSelectedModelId(selectedResult.data);
              console.log('✅ Selected model reloaded:', selectedResult.data);
            }
            
            return {
              models: modelsResult,
              selectedModel: selectedResult
            };
          } catch (error) {
            console.error('Reload failed:', error);
            return { success: false, error };
          }
        }
      };
      
      console.log('🔧 AI Storage debugging commands available:');
      console.log('  window.__DEV_TESTING__.aiStorage.verify() - 验证存储状态');
      console.log('  window.__DEV_TESTING__.aiStorage.clear() - 清除存储数据');
      console.log('  window.__DEV_TESTING__.aiStorage.showMemoryData() - 查看内存数据');
      console.log('  window.__DEV_TESTING__.aiStorage.reload() - 重新加载数据');
    }
  }, [models, selectedModelId]);

  if (!isOpen) return null;

  return (
    <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
      {/* 顶部状态栏 */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot size={20} className="text-purple-400" />
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
              getCurrentModel() ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
          </div>
          <div>
            <div className="font-semibold text-white">AI 创作助手</div>
            <div className="text-xs text-gray-400">
              {getCurrentModel()?.name || '等待配置'} • {panelState === 'empty' ? '未就绪' : '就绪'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded hover:bg-gray-700 ${
              showHistory ? 'text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
            title="会话历史"
          >
            <MessageSquare size={16} />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700"
            title="设置"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={onToggle}
            className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 主内容区域 - 根据状态显示不同内容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {panelState === 'empty' && (
          <EmptyState 
            onQuickSetup={quickSetupModel}
            onShowSettings={() => setShowSettings(true)}
          />
        )}
        
        {panelState === 'ready' && (
          <ReadyState 
            currentModel={getCurrentModel()}
            suggestions={getContextualSuggestions()}
            onStartChat={startNewConversation}
            onSuggestionClick={setInput}
          />
        )}
        
        {panelState === 'chatting' && (
          <ChattingState 
            messages={messages}
            isAiThinking={isAiThinking}
            messagesEndRef={messagesEndRef}
            onActionClick={handleActionClick}
            hasStreamingMessage={streamingMessageId !== null}
          />
        )}
        
        {panelState === 'history' && (
          <HistoryState 
            sessions={chatSessions}
            onLoadSession={loadSession}
            onDeleteSession={deleteSession}
            onNewChat={startNewConversation}
            onBack={() => setShowHistory(false)}
          />
        )}
      </div>

      {/* 底部输入区域 */}
      {panelState !== 'empty' && panelState !== 'history' && (
        <InputArea 
          input={input}
          setInput={setInput}
          onSend={handleSendMessage}
          isDisabled={!selectedModelId || isAiThinking}
          suggestions={panelState === 'ready' ? getContextualSuggestions() : []}
        />
      )}

      {/* 设置面板 */}
      {showSettings && (
        <SettingsPanel 
          models={models}
          selectedModelId={selectedModelId}
          onClose={() => setShowSettings(false)}
          onAddModel={() => setShowModelConfig(true)}
          onEditModel={handleEditModel}
          onDeleteModel={handleDeleteModel}
          onSelectModel={setSelectedModelId}
          onVerifyStorage={handleVerifyStorage}
          verificationResult={verificationResult}
          verificationLoading={verificationLoading}
        />
      )}

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
                className={`w-full bg-gray-700 border rounded px-3 py-2 text-white ${
                  formErrors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="例如：GPT-4 Turbo"
              />
              {formErrors.name && (
                <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
              )}
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
                className={`w-full bg-gray-700 border rounded px-3 py-2 text-white ${
                  formErrors.apiUrl ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder={SUPPORTED_PROVIDERS.find(p => p.id === tempModelConfig.provider)?.defaultApiUrl || "https://api.example.com/v1/chat/completions"}
              />
              {formErrors.apiUrl && (
                <p className="text-red-400 text-xs mt-1">{formErrors.apiUrl}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                API 密钥 *
              </label>
              <input
                type="password"
                value={tempModelConfig.apiKey}
                onChange={(e) => setTempModelConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className={`w-full bg-gray-700 border rounded px-3 py-2 text-white ${
                  formErrors.apiKey ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              {formErrors.apiKey && (
                <p className="text-red-400 text-xs mt-1">{formErrors.apiKey}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                模型ID *
              </label>
              <input
                type="text"
                value={tempModelConfig.model}
                onChange={(e) => setTempModelConfig(prev => ({ ...prev, model: e.target.value }))}
                className={`w-full bg-gray-700 border rounded px-3 py-2 text-white ${
                  formErrors.model ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="例如：gpt-4-turbo"
              />
              {formErrors.model && (
                <p className="text-red-400 text-xs mt-1">{formErrors.model}</p>
              )}
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

    </div>
  );
};

// 空状态组件
const EmptyState: React.FC<{
  onQuickSetup: (preset: 'qwen' | 'openai' | 'custom') => void;
  onShowSettings: () => void;
}> = ({ onQuickSetup, onShowSettings }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
      <Bot size={32} className="text-purple-400" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">欢迎使用AI创作助手</h3>
    <p className="text-gray-400 text-sm mb-6">
      先配置一个AI模型，然后就可以开始创作了
    </p>
    
    <div className="space-y-3 w-full max-w-xs">
      <h4 className="text-sm font-medium text-gray-300 mb-2">快速开始：</h4>
      
      <button
        onClick={() => onQuickSetup('qwen')}
        className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        配置通义千问
      </button>
      
      <button
        onClick={() => onQuickSetup('openai')}
        className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        配置 OpenAI GPT
      </button>
      
      <button
        onClick={() => onQuickSetup('custom')}
        className="w-full p-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
      >
        配置其他模型
      </button>
      
      <button
        onClick={onShowSettings}
        className="w-full p-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        高级设置
      </button>
    </div>
  </div>
);

// 就绪状态组件
const ReadyState: React.FC<{
  currentModel?: AIModelConfig;
  suggestions: string[];
  onStartChat: () => void;
  onSuggestionClick: (suggestion: string) => void;
}> = ({ currentModel, suggestions, onStartChat, onSuggestionClick }) => (
  <div className="flex-1 flex flex-col p-6">
    <div className="text-center mb-6">
      <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <CheckCircle size={24} className="text-green-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">AI助手已就绪</h3>
      <p className="text-gray-400 text-sm">
        当前模型：{currentModel?.name || '未知'}
      </p>
    </div>
    
    <div className="mb-6">
      <button
        onClick={onStartChat}
        className="w-full p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        开始新对话
      </button>
    </div>
    
    <div className="flex-1">
      <h4 className="text-sm font-medium text-gray-300 mb-3">快速开始：</h4>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// 聊天状态组件
const ChattingState: React.FC<{
  messages: AIMessageData[];
  isAiThinking: boolean;
  setShowSettings: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onActionClick?: (action: string) => void;
  hasStreamingMessage: boolean;
}> = ({ messages, isAiThinking, setShowSettings, messagesEndRef, onActionClick, hasStreamingMessage }) => (
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((message) => (
      <AIMessage key={message.id} message={message} onActionClick={onActionClick} />
    ))}
    
    {/* 只有在非流式模式且AI正在思考时才显示额外的思考指示器 */}
    {isAiThinking && !hasStreamingMessage && (
      <AIMessage message={{ 
        id: 0, 
        type: 'ai' as const, 
        content: '', 
        timestamp: new Date() 
      }} />
    )}
    
    <div ref={messagesEndRef} />
  </div>
);

// 输入区域组件
const InputArea: React.FC<{
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isDisabled: boolean;
  suggestions: string[];
}> = ({ input, setInput, onSend, isDisabled, suggestions }) => (
  <div className="border-t border-gray-700 p-4">
    {suggestions.length > 0 && input === '' && (
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-2">建议：</div>
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, 2).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setInput(suggestion)}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-full text-gray-300 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )}
    
    <div className="flex space-x-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && !isDisabled && onSend()}
        placeholder="向AI助手提问..."
        className="flex-1 bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-purple-500 focus:outline-none text-white placeholder-gray-400"
      />
      <button
        onClick={onSend}
        disabled={!input.trim() || isDisabled}
        className="p-2 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={16} />
      </button>
    </div>
  </div>
);

// 历史会话状态组件
const HistoryState: React.FC<{
  sessions: ChatSession[];
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewChat: () => void;
  onBack: () => void;
}> = ({ sessions, onLoadSession, onDeleteSession, onNewChat, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.preview?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 历史会话头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">会话历史</h3>
          <button
            onClick={onNewChat}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
          >
            <Plus size={14} />
            新对话
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索会话..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <MessageSquare size={48} className="text-gray-500 mb-4" />
            <h4 className="text-lg font-medium text-gray-300 mb-2">
              {searchTerm ? '未找到匹配的会话' : '暂无会话记录'}
            </h4>
            <p className="text-gray-400 text-sm mb-4">
              {searchTerm ? '尝试使用其他关键词搜索' : '开始新对话来创建第一个会话记录'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNewChat}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
              >
                开始新对话
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="group p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                onClick={() => onLoadSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate mb-1">
                      {session.title}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {session.preview}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(session.updatedAt)}
                      </span>
                      <span>{session.messageCount} 条消息</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除这个会话吗？')) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 设置面板组件
const SettingsPanel: React.FC<{
  models: AIModelConfig[];
  selectedModelId: string;
  onClose: () => void;
  onAddModel: () => void;
  onEditModel: (model: AIModelConfig) => void;
  onDeleteModel: (id: string) => void;
  onSelectModel: (id: string) => void;
  onVerifyStorage: () => void;
  verificationResult: any;
  verificationLoading: boolean;
}> = ({ 
  models, selectedModelId, onClose, onAddModel, onEditModel, 
  onDeleteModel, onSelectModel, onVerifyStorage, verificationResult, verificationLoading 
}) => (
  <div className="absolute inset-0 bg-gray-800 z-10 flex flex-col">
    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
      <h3 className="font-semibold text-white">设置</h3>
      <button 
        onClick={onClose}
        className="text-gray-400 hover:text-white p-1 rounded"
      >
        <X size={16} />
      </button>
    </div>
    
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* 模型管理 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">AI模型</h4>
          <button
            onClick={onAddModel}
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm"
          >
            <Plus size={14} />
            添加模型
          </button>
        </div>
        
        <div className="space-y-2">
          {models.map((model) => (
            <div 
              key={model.id}
              className={`p-3 rounded border ${
                selectedModelId === model.id 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-600 bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedModelId === model.id}
                      onChange={() => onSelectModel(model.id)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-white">{model.name}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {model.provider} • {model.model}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditModel(model)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteModel(model.id)}
                    className="text-gray-400 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 存储信息 */}
      <div className="bg-gray-700 rounded p-3">
        <h4 className="font-medium text-white mb-2">存储信息</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <div>存储方式: 文件存储</div>
          <div>开发环境: 项目/.ai-config/</div>
          <div>生产环境: 用户数据目录</div>
        </div>
        <button
          onClick={onVerifyStorage}
          disabled={verificationLoading}
          className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white disabled:opacity-50"
        >
          {verificationLoading ? '验证中...' : '验证存储'}
        </button>
      </div>
    </div>
  </div>
);

export default AIChatPanel;


