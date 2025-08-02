// src/components/preview/VariablesPanel.tsx
// 游戏变量面板组件

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { GameState } from '../../types/preview';

interface VariablesPanelProps {
  gameState: GameState;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({ gameState }) => {
  const { colors } = useTheme();
  const variables = gameState.variables || {};
  const variableEntries = Object.entries(variables);
  
  // 调试模式切换
  const [debugMode, setDebugMode] = React.useState(false);

  // 提取Ink变量的实际值
  const extractInkValue = (value: any): any => {
    // 检查是否是Ink引擎的变量对象
    if (value && typeof value === 'object') {
      // 主要的Ink变量对象格式
      if (value.hasOwnProperty('value')) {
        return value.value;
      }
      // 其他可能的Ink包装对象
      if (value.hasOwnProperty('_value')) {
        return value._value;
      }
      // 检查是否是数字包装对象
      if (value.hasOwnProperty('_number')) {
        return value._number;
      }
      // 检查是否是布尔包装对象  
      if (value.hasOwnProperty('_bool')) {
        return value._bool;
      }
    }
    return value;
  };

  // 获取变量的实际类型
  const getActualType = (value: any): string => {
    const actualValue = extractInkValue(value);
    if (actualValue === null) return 'null';
    if (actualValue === undefined) return 'undefined';
    return typeof actualValue;
  };

  // 格式化变量值的显示
  const formatValue = (value: any): string => {
    // 调试模式显示原始对象
    if (debugMode) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    
    // 正常模式显示提取的值
    const actualValue = extractInkValue(value);
    
    if (actualValue === null) return 'null';
    if (actualValue === undefined) return 'undefined';
    if (typeof actualValue === 'string') return `"${actualValue}"`;
    if (typeof actualValue === 'boolean') return actualValue ? 'true' : 'false';
    if (typeof actualValue === 'number') return actualValue.toString();
    if (typeof actualValue === 'object') {
      try {
        return JSON.stringify(actualValue, null, 2);
      } catch {
        return '[Complex Object]';
      }
    }
    return String(actualValue);
  };

  // 获取变量值的类型颜色
  const getTypeColor = (value: any): string => {
    const actualValue = extractInkValue(value);
    if (actualValue === null || actualValue === undefined) return colors.textMuted;
    if (typeof actualValue === 'string') return colors.success;
    if (typeof actualValue === 'boolean') return colors.warning;
    if (typeof actualValue === 'number') return colors.info;
    return colors.textPrimary;
  };

  if (variableEntries.length === 0) {
    return (
      <div 
        className="h-full flex items-center justify-center p-4"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="text-center">
          <div 
            className="text-sm mb-2"
            style={{ color: colors.textMuted }}
          >
            当前游戏中没有设置变量
          </div>
          <div 
            className="text-xs"
            style={{ color: colors.textMuted }}
          >
            变量会在游戏运行过程中自动显示
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: colors.primary }}
    >
      {/* 工具栏 */}
      <div 
        className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: colors.border, backgroundColor: colors.surface }}
      >
        <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
          游戏变量 ({variableEntries.length})
        </div>
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            debugMode ? 'font-medium' : 'font-normal'
          }`}
          style={{
            backgroundColor: debugMode ? colors.info : colors.primary,
            color: debugMode ? 'white' : colors.textMuted,
            border: `1px solid ${colors.border}`
          }}
          title={debugMode ? '切换到简洁视图' : '切换到调试视图'}
        >
          {debugMode ? '🐛 调试' : '👁️ 简洁'}
        </button>
      </div>
      
      {/* 变量列表 */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 space-y-3">
        {variableEntries.map(([key, value], index) => (
          <div 
            key={`${key}-${index}`}
            className="flex items-start justify-between p-3 rounded-lg border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            {/* 变量名 */}
            <div className="flex-1 min-w-0 mr-4">
              <div 
                className="font-mono text-sm font-medium break-all"
                style={{ color: colors.textPrimary }}
                title={key}
              >
                {key}
              </div>
              <div 
                className="text-xs mt-1"
                style={{ color: colors.textMuted }}
              >
                {debugMode ? `${typeof value} (原始)` : `${getActualType(value)} 类型`}
              </div>
            </div>

            {/* 变量值 */}
            <div className="flex-shrink-0 max-w-xs">
              <div 
                className="font-mono text-sm text-right break-all"
                style={{ color: getTypeColor(value) }}
                title={formatValue(value)}
              >
                {formatValue(value)}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default VariablesPanel;