import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Story } from 'inkjs';
import { ProjectContext } from '../context/ProjectContext';
import { PluginHost } from './PluginHost.tsx';
import { useTheme } from '../context/ThemeContext';
import { NavigationBar } from './preview/NavigationBar';
import { StatusInfo } from './preview/StatusInfo';
import { ContentDisplay } from './preview/ContentDisplay';
import { HistoryPanel } from './preview/HistoryPanel';
import type { GameState, HistoryEntry, NavigationAction } from '../types/preview';

interface PreviewProps {
  /** 当前选中的 Ink 文件绝对路径 */
  filePath: string | null;
}

export const Preview: React.FC<PreviewProps> = ({ filePath }) => {
  const { colors } = useTheme();
  const { plugins } = useContext(ProjectContext)!;
  
  // 核心状态
  const [story, setStory] = useState<Story | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentKnot: 'unknown',
    stepCount: 0,
    history: [],
    variables: {},
    canRedo: false,
    canUndo: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pluginCtx, setPluginCtx] = useState<{
    manifest: any;
    params?: any;
  } | null>(null);
  
  // 历史导航相关
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  // const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  // 未来用于重做功能
  
  // refs
  const storyRef = useRef<Story | null>(null);
  const saveKeyRef = useRef<string>('');

  // 存储当前的knot名称(简单的手动跟踪方法)
  // const [currentKnotName, setCurrentKnotName] = useState<string>('unknown');
  
  // 基于currentPathString获取当前knot名称，带有备用策略
  const getCurrentKnotName = useCallback((story: Story, fallbackKnot?: string): string => {
    try {
      // currentPathString格式: "knot_name.stitchIndex.lineIndex"
      // 例如: "greet_maria.0.4" -> knot名称是 "greet_maria"
      const pathString = story.state.currentPathString;
      console.log('getCurrentKnotName - pathString:', pathString, 'fallback:', fallbackKnot);
      
      if (pathString) {
        const knotName = pathString.split('.')[0];
        console.log('getCurrentKnotName - knotName extracted:', knotName);
        if (knotName && knotName !== 'DEFAULT_FLOW') {
          return knotName;
        }
      }
      
      // 如果currentPathString为null，使用备用knot名称
      if (fallbackKnot && fallbackKnot !== 'DEFAULT_FLOW') {
        console.log('getCurrentKnotName - using fallback:', fallbackKnot);
        return fallbackKnot;
      }
      
      console.log('getCurrentKnotName - returning unknown');
      return 'unknown';
    } catch (error) {
      console.warn('获取当前knot失败:', error);
      return 'unknown';
    }
  }, []);
  
  // 手动跟踪 knot 变化的函数
  const trackKnotChange = useCallback((newKnotName: string) => {
    console.log('Tracking knot change to:', newKnotName);
    // setCurrentKnotName(newKnotName);
  }, []);

  // 获取Story变量
  const getStoryVariables = useCallback((story: Story): Record<string, any> => {
    try {
      const variables: Record<string, any> = {};
      const globalVars = (story as any).variablesState;
      if (globalVars && globalVars._globalVariables) {
        for (const [key, value] of globalVars._globalVariables) {
          variables[key] = value;
        }
      }
      return variables;
    } catch {
      return {};
    }
  }, []);

  // 创建历史记录条目
  const createHistoryEntry = useCallback((story: Story, output: string[], choices: any[], choiceIndex?: number): HistoryEntry => {
    try {
      return {
        output: [...output],
        choices: [...choices],
        choiceIndex,
        knotName: getCurrentKnotName(story),
        timestamp: Date.now(),
        storyState: story.state.ToJson()
      };
    } catch (error) {
      console.warn('创建历史记录失败:', error);
      return {
        output: [...output],
        choices: [...choices],
        choiceIndex,
        knotName: getCurrentKnotName(story),
        timestamp: Date.now(),
        storyState: undefined
      };
    }
  }, [getCurrentKnotName]);

  // 初始化故事
  const initializeStory = useCallback(async () => {
    if (!filePath) {
      // 清空状态
      setStory(null);
      setGameState({
        currentKnot: 'unknown',
        stepCount: 0,
        history: [],
        variables: {},
        canRedo: false,
        canUndo: false
      });
      setError(null);
      setPluginCtx(null);
      setHistoryIndex(-1);
      // setRedoStack([]);
      storyRef.current = null;
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // 1. 读取并编译Ink源码
      const source: string = await window.inkAPI.readFile(filePath);
      const json = await window.inkAPI.compileInk(source, false, filePath);
      
      // 2. 创建Story实例
      const s = new Story(json as any);
      storyRef.current = s;
      
      // 3. 绑定外部函数
      s.BindExternalFunction('runPlugin', (id: string, paramJson: string) => {
        const manifest = plugins.find((p) => p.id === id);
        if (manifest) {
          const params = JSON.parse(paramJson);
          setPluginCtx({ manifest, params });
        }
      });
      
      // 4. 执行初始内容
      const initialOutput: string[] = [];
      while (s.canContinue) {
        const line = s.Continue();
        if (line) initialOutput.push(line);
      }
      
      // 5. 创建初始历史记录
      const initialEntry = createHistoryEntry(s, initialOutput, s.currentChoices);
      
      // 6. 更新状态
      
      // 尝试从文件名或内容推断初始 knot
      let initialKnotName = 'unknown';
      
      // 先尝试从文件名推断
      if (filePath) {
        const fileName = filePath.split('/').pop()?.replace('.ink', '');
        if (fileName && fileName !== 'story') {
          initialKnotName = fileName;
        }
      }
      
      // 如果文件名不能用，尝试从Story获取
      if (initialKnotName === 'unknown') {
        initialKnotName = getCurrentKnotName(s);
      }
      
      // 更新跟踪状态
      // setCurrentKnotName(initialKnotName);
      
      console.log('=== Initial State Update ===');
      console.log('initialKnotName:', initialKnotName);
      
      const newGameState = {
        currentKnot: initialKnotName,
        stepCount: 1,
        history: [initialEntry],
        variables: getStoryVariables(s),
        canRedo: false,
        canUndo: false
      };
      
      console.log('Setting gameState:', newGameState);
      
      setStory(s);
      setGameState(newGameState);
      setHistoryIndex(0);
      // setRedoStack([]);
      
      // 设置保存键
      saveKeyRef.current = `ink-save-${filePath}`;
      
    } catch (err) {
      console.error('Preview 初始化失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [filePath, plugins, createHistoryEntry, getCurrentKnotName, getStoryVariables]);
  
  useEffect(() => {
    initializeStory();
  }, [initializeStory]);

  // 从选择文本中提取目标knot名称
  const extractKnotFromChoice = useCallback((choice: any): string | null => {
    try {
      // 检查 choice 的目标路径
      if (choice.targetPath) {
        const pathStr = choice.targetPath.toString();
        console.log('Choice target path:', pathStr);
        
        // 路径格式通常为 "knot_name" 或 "knot_name.stitch_name"
        const parts = pathStr.split('.');
        if (parts.length > 0 && parts[0] !== 'DEFAULT_FLOW') {
          return parts[0];
        }
      }
      
      // 如果没有目标路径，尝试从选择文本中解析
      if (choice.text) {
        // 查找文本中的 "-> knot_name" 模式
        const match = choice.text.match(/-\s*>\s*(\w+)/);
        if (match) {
          return match[1];
        }
      }
      
      return null;
    } catch (error) {
      console.warn('从选择中提取knot失败:', error);
      return null;
    }
  }, []);
  
  // 处理选择
  const handleChoose = useCallback((index: number) => {
    if (!story || !storyRef.current) return;
    
    setIsLoading(true);
    
    try {
      // 清空重做栈（做出新选择后不能再重做）
      // setRedoStack([]);
      
      // 记录选择到当前历史条目
      const currentHistory = [...gameState.history];
      if (currentHistory.length > 0) {
        currentHistory[historyIndex] = {
          ...currentHistory[historyIndex],
          choiceIndex: index
        };
      }
      
      // 在执行选择之前，尝试预测目标knot
      const selectedChoice = story.currentChoices[index];
      const predictedKnot = extractKnotFromChoice(selectedChoice);
      console.log('Selected choice:', selectedChoice);
      console.log('Predicted target knot:', predictedKnot);
      
      // 执行选择
      story.ChooseChoiceIndex(index);
      
      // 如果我们预测到了目标knot，更新跟踪状态
      if (predictedKnot) {
        trackKnotChange(predictedKnot);
      }
      
      // 收集新的输出
      const newOutput: string[] = [];
      while (story.canContinue) {
        const line = story.Continue();
        if (line) newOutput.push(line);
      }
      
      // 创建新的历史条目
      const newEntry = createHistoryEntry(story, newOutput, story.currentChoices);
      const updatedHistory = [...currentHistory, newEntry];
      const newIndex = updatedHistory.length - 1;
      
      // 获取新的knot名称，使用预测的knot作为备用
      const newKnotName = getCurrentKnotName(story, predictedKnot || undefined);
      console.log('=== After Choice State Update ===');
      console.log('newKnotName:', newKnotName);
      
      const newGameState = {
        currentKnot: newKnotName,
        stepCount: gameState.stepCount + 1,
        history: updatedHistory,
        variables: getStoryVariables(story),
        canRedo: false,
        canUndo: updatedHistory.length > 1
      };
      
      console.log('Setting gameState after choice:', newGameState);
      
      setGameState(newGameState);
      setHistoryIndex(newIndex);
      
    } catch (err) {
      console.error('处理选择失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [story, gameState, historyIndex, createHistoryEntry, getCurrentKnotName, getStoryVariables, extractKnotFromChoice, trackKnotChange]);

  // 后退到历史记录
  const handleUndo = useCallback(() => {
    if (!story || historyIndex <= 0) return;
    
    setIsLoading(true);
    try {
      const targetIndex = historyIndex - 1;
      const targetEntry = gameState.history[targetIndex];
      
      // 从Story状态恢复
      if (targetEntry.storyState) {
        try {
          story.state.LoadJson(targetEntry.storyState);
        } catch (loadError) {
          console.warn('加载状态失败，使用当前状态:', loadError);
        }
      }
      
      // 更新状态
      setHistoryIndex(targetIndex);
      setGameState(prev => ({
        ...prev,
        currentKnot: targetEntry.knotName,
        stepCount: prev.stepCount, // 保持步数不变
        canUndo: targetIndex > 0,
        canRedo: true
      }));
    } catch (err) {
      console.error('后退失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [story, historyIndex, gameState.history]);
  
  // 前进到历史记录
  const handleRedo = useCallback(() => {
    if (!story || historyIndex >= gameState.history.length - 1) return;
    
    setIsLoading(true);
    try {
      const targetIndex = historyIndex + 1;
      const targetEntry = gameState.history[targetIndex];
      
      // 从Story状态恢复
      if (targetEntry.storyState) {
        try {
          story.state.LoadJson(targetEntry.storyState);
        } catch (loadError) {
          console.warn('加载状态失败，使用当前状态:', loadError);
        }
      }
      
      // 更新状态
      setHistoryIndex(targetIndex);
      setGameState(prev => ({
        ...prev,
        currentKnot: targetEntry.knotName,
        stepCount: prev.stepCount, // 保持步数不变
        canUndo: true,
        canRedo: targetIndex < gameState.history.length - 1
      }));
    } catch (err) {
      console.error('前进失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [story, historyIndex, gameState.history]);

  // 处理导航动作
  const handleNavigationAction = useCallback((action: NavigationAction) => {
    switch (action.type) {
      case 'RESET':
        initializeStory();
        break;
      case 'UNDO':
        handleUndo();
        break;
      case 'REDO':
        handleRedo();
        break;
      case 'EXPORT_WEB':
        window.inkAPI.exportGame('web');
        break;
      case 'EXPORT_DESKTOP':
        window.inkAPI.exportGame('desktop');
        break;
    }
  }, [initializeStory, handleUndo, handleRedo]);

  // 跳转到历史记录
  const handleJumpToHistory = useCallback((index: number) => {
    if (!story || index < 0 || index >= gameState.history.length || index === historyIndex) return;
    
    setIsLoading(true);
    try {
      const targetEntry = gameState.history[index];
      
      // 从Story状态恢复
      if (targetEntry.storyState) {
        story.state.LoadJson(targetEntry.storyState);
      }
      
      // 更新状态
      setHistoryIndex(index);
      setGameState(prev => ({
        ...prev,
        currentKnot: targetEntry.knotName,
        canUndo: index > 0,
        canRedo: index < gameState.history.length - 1
      }));
    } catch (err) {
      console.error('历史跳转失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [story, historyIndex, gameState.history]);

  // 获取当前显示的内容
  const getCurrentContent = () => {
    if (historyIndex >= 0 && historyIndex < gameState.history.length) {
      const currentEntry = gameState.history[historyIndex];
      return {
        output: currentEntry.output,
        choices: currentEntry.choices
      };
    }
    return { output: [], choices: [] };
  };

  const currentContent = getCurrentContent();

  // 渲染
  if (!filePath) {
    return (
      <div 
        className="h-full flex items-center justify-center"
        style={{ 
          backgroundColor: colors.primary,
          color: colors.textMuted 
        }}
      >
        请选择一个 Ink 文件以预览
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="h-full flex flex-col"
        style={{ backgroundColor: colors.primary }}
      >
        <div 
          className="flex-1 flex items-center justify-center p-4"
        >
          <div 
            className="max-w-2xl w-full px-6 py-4 rounded-lg border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.error,
              color: colors.error 
            }}
          >
            <h3 className="font-bold mb-3 text-lg">Ink编译错误</h3>
            <pre 
              className="whitespace-pre-wrap text-sm font-mono p-3 rounded border overflow-x-auto"
              style={{ 
                backgroundColor: colors.primary,
                borderColor: colors.border,
                color: colors.textPrimary 
              }}
            >{error}</pre>
            <div className="mt-4">
              <button
                className="px-4 py-2 rounded transition-colors duration-200"
                style={{
                  backgroundColor: colors.buttonPrimary,
                  color: colors.textPrimary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.buttonPrimaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.buttonPrimary;
                }}
                onClick={() => initializeStory()}
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pluginCtx) {
    return (
      <PluginHost
        plugin={pluginCtx.manifest}
        params={pluginCtx.params}
        onClose={() => setPluginCtx(null)}
      />
    );
  }

  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: colors.primary }}
    >
      {/* 导航栏 */}
      <NavigationBar
        gameState={gameState}
        onAction={handleNavigationAction}
        isLoading={isLoading}
      />
      
      {/* 状态信息 */}
      <StatusInfo
        gameState={gameState}
        filePath={filePath}
      />
      
      {/* 内容显示 */}
      <ContentDisplay
        output={currentContent.output}
        choices={currentContent.choices}
        onChoiceSelect={handleChoose}
        isLoading={isLoading}
      />
      
      {/* 历史面板 */}
      <HistoryPanel
        history={gameState.history}
        currentIndex={historyIndex}
        onJumpToHistory={handleJumpToHistory}
      />
    </div>
  );
};

export default Preview;
