import React, { useState } from 'react';
import { Wand2, Code, AlertCircle, Sparkles } from 'lucide-react';

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

interface QuickActionsProps {
  onAction: (actionId: string) => void;
  currentContext?: string;
}

interface ActionItem {
  id: string;
  text: string;
  icon: string;
  description: string;
  promptCategory?: keyof typeof PRESET_SYSTEM_PROMPTS; // 关联的Prompt类别
}

interface ActionCategory {
  label: string;
  icon: React.ReactNode;
  actions: ActionItem[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, currentContext: _currentContext = 'general' }) => {
  const [activeCategory, setActiveCategory] = useState('create');

  // 根据上下文动态生成快捷操作
  const actionCategories: Record<string, ActionCategory> = {
    create: {
      label: '创作',
      icon: <Wand2 size={14} />,
      actions: [
        { 
          id: 'generate-character', 
          text: '生成角色', 
          icon: '👤', 
          description: '创建新角色',
          promptCategory: 'novelist'
        },
        { 
          id: 'create-scene', 
          text: '创建场景', 
          icon: '🏞️', 
          description: '添加新场景',
          promptCategory: 'novelist'
        },
        { 
          id: 'add-dialogue', 
          text: '添加对话', 
          icon: '💬', 
          description: '生成对话内容',
          promptCategory: 'novelist'
        },
        { 
          id: 'plot-twist', 
          text: '剧情转折', 
          icon: '️⚡', 
          description: '创造意外情节',
          promptCategory: 'novelist'
        }
      ]
    },
    code: {
      label: '代码',
      icon: <Code size={14} />,
      actions: [
        { 
          id: 'fix-syntax', 
          text: '修复语法', 
          icon: '🔧', 
          description: '自动修复代码错误',
          promptCategory: 'coder'
        },
        { 
          id: 'optimize-code', 
          text: '优化代码', 
          icon: '⚡', 
          description: '改进代码结构',
          promptCategory: 'coder'
        },
        { 
          id: 'add-variables', 
          text: '添加变量', 
          icon: '🔢', 
          description: '智能变量建议',
          promptCategory: 'coder'
        },
        { 
          id: 'format-code', 
          text: '格式化', 
          icon: '✨', 
          description: '美化代码格式',
          promptCategory: 'coder'
        }
      ]
    },
    analyze: {
      label: '分析',
      icon: <AlertCircle size={14} />,
      actions: [
        { 
          id: 'analyze-flow', 
          text: '分析流程', 
          icon: '🔄', 
          description: '检查故事逻辑',
          promptCategory: 'analyzer'
        },
        { 
          id: 'check-balance', 
          text: '平衡检查', 
          icon: '⚖️', 
          description: '评估游戏平衡',
          promptCategory: 'analyzer'
        },
        { 
          id: 'review-story', 
          text: '故事评估', 
          icon: '📝', 
          description: '整体质量分析',
          promptCategory: 'analyzer'
        },
        { 
          id: 'suggest-improve', 
          text: '改进建议', 
          icon: '💡', 
          description: '优化建议',
          promptCategory: 'analyzer'
        }
      ]
    }
  };

  const handleActionClick = (actionId: string) => {
    onAction(actionId);
  };

  // AI推荐组件
  const AIRecommendations = () => {
    const [recommendations] = useState([
      { id: 'context-suggestion-1', text: '基于当前内容建议', priority: 'high' },
      { id: 'context-suggestion-2', text: '优化建议', priority: 'medium' }
    ]);

    return (
      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles size={14} className="text-purple-400" />
          <span className="text-xs font-medium text-purple-400">AI 智能推荐</span>
        </div>

        <div className="space-y-2">
          {recommendations.map((rec) => (
            <button
              key={rec.id}
              onClick={() => handleActionClick(rec.id)}
              className="
                w-full text-left p-2 bg-purple-900/20 hover:bg-purple-900/40 
                rounded border border-purple-500/30 hover:border-purple-500/50
                transition-all duration-200
              "
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-300">{rec.text}</span>
                <div className={`
                  w-2 h-2 rounded-full 
                  ${rec.priority === 'high' ? 'bg-red-400' : 
                    rec.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}
                `} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 快捷操作按钮
  const QuickActionButton = ({ action }: { action: ActionItem }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <button
        onClick={() => handleActionClick(action.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="
          relative group p-3 bg-gray-700 hover:bg-gray-600 rounded-lg
          border border-gray-600 hover:border-purple-500
          transition-all duration-200 text-left
        "
      >
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-lg">{action.icon}</span>
          <span className="text-sm font-medium text-white">{action.text}</span>
        </div>
        <p className="text-xs text-gray-400 group-hover:text-gray-300">
          {action.description}
        </p>

        {/* 悬停效果 */}
        {isHovered && (
          <div className="absolute inset-0 bg-purple-500/10 rounded-lg pointer-events-none" />
        )}
      </button>
    );
  };

  return (
    <div className="mt-3">
      {/* 分类标签 */}
      <div className="flex space-x-1 mb-3">
        {Object.entries(actionCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeCategory === key 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category.icon}
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* 快捷操作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        {actionCategories[activeCategory].actions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>

      {/* 智能推荐 */}
      <AIRecommendations />
    </div>
  );
};

export default QuickActions;