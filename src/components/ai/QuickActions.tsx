import React, { useState } from 'react';
import { Wand2, Code, AlertCircle, Sparkles } from 'lucide-react';

interface QuickActionsProps {
  onAction: (actionId: string) => void;
  currentContext?: string;
}

interface ActionItem {
  id: string;
  text: string;
  icon: string;
  description: string;
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
        { id: 'generate-character', text: '生成角色', icon: '👤', description: '创建新角色' },
        { id: 'create-scene', text: '创建场景', icon: '🏞️', description: '添加新场景' },
        { id: 'add-dialogue', text: '添加对话', icon: '💬', description: '生成对话内容' },
        { id: 'plot-twist', text: '剧情转折', icon: '️⚡', description: '创造意外情节' }
      ]
    },
    code: {
      label: '代码',
      icon: <Code size={14} />,
      actions: [
        { id: 'fix-syntax', text: '修复语法', icon: '🔧', description: '自动修复代码错误' },
        { id: 'optimize-code', text: '优化代码', icon: '⚡', description: '改进代码结构' },
        { id: 'add-variables', text: '添加变量', icon: '🔢', description: '智能变量建议' },
        { id: 'format-code', text: '格式化', icon: '✨', description: '美化代码格式' }
      ]
    },
    analyze: {
      label: '分析',
      icon: <AlertCircle size={14} />,
      actions: [
        { id: 'analyze-flow', text: '分析流程', icon: '🔄', description: '检查故事逻辑' },
        { id: 'check-balance', text: '平衡检查', icon: '⚖️', description: '评估游戏平衡' },
        { id: 'review-story', text: '故事评估', icon: '📝', description: '整体质量分析' },
        { id: 'suggest-improve', text: '改进建议', icon: '💡', description: '优化建议' }
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