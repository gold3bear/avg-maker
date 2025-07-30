import React, { useState, useEffect, useRef, useContext, useCallback, Component, ReactNode } from 'react';
import MonacoEditor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type * as MonacoNamespace from 'monaco-editor';
import { debounce } from '../hooks/useDebounce';
import { InkContext, type Marker } from '../context/InkContext.tsx';
import { useTheme } from '../context/ThemeContext';
import { registerInkLanguage, getMonacoThemeName } from '../utils/inkLanguage';
import { crashRecovery } from '../utils/crashRecovery';
import { useSave } from '../context/SaveContext';

// 错误边界组件 - 增强编辑器健壮性
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('❌ Editor ErrorBoundary: 捕获到错误:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ Editor ErrorBoundary: 详细错误信息:', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              编辑器加载失败
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              编辑器遇到了意外错误，但应用的其他功能仍然可用。
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              重新加载编辑器
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface EditorProps {
  /** 当前编辑的本地 Ink 文件路径 */
  filePath: string | null;
  /** 外部插件触发回调（暂未使用） */
  onRunPlugin?: (id: string, params: string) => void;
  /** 跳转到指定行号 */
  goToLine?: number;
}

export const Editor: React.FC<EditorProps> = ({ filePath, goToLine }) => {
  const { lintInk, externalErrors } = useContext(InkContext)!;
  const { currentTheme, colors } = useTheme();
  const { 
    markFileAsDirty, 
    markFileAsSaved, 
    setFileOriginalContent, 
    saveFile 
  } = useSave();
  const [content, setContent] = useState<string>('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const monacoRef = useRef<typeof MonacoNamespace | null>(null);
  const editorRef = useRef<MonacoNamespace.editor.IStandaloneCodeEditor | null>(null);

  // 根据 filePath 加载本地文件内容
  useEffect(() => {
    if (!filePath) {
      setContent('');
      return;
    }
    
    window.inkAPI.readFile(filePath).then((text: string) => {
      setContent(text);
      
      // 设置文件的原始内容（用于检测更改）
      setFileOriginalContent(filePath, text);
      
      // 确保Monaco Editor和编辑器实例都准备好后再处理
      if (editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          // 清除旧标记
          monacoRef.current.editor.setModelMarkers(model, 'ink-lint', []);
          
          // 使用editor.setValue确保内容立即更新到model
          editorRef.current.setValue(text);
          
          // 内容更新后立即进行语法检测
          setTimeout(() => {
            debouncedLint(text, filePath);
          }, 100);
        }
      } else {
        // 如果editor还没准备好，在编辑器挂载后会自动触发检测
        console.log('Editor: Editor not ready, will lint after mount');
      }
    });
  }, [filePath]);

  // 防抖保存到本地
  const debouncedSave = useRef(
    debounce(async (val: string) => {
      if (filePath) {
        try {
          await window.inkAPI.writeFile(filePath, val);
          // 标记文件为已保存
          markFileAsSaved(filePath, val);
          // 保存成功后清除此文件的崩溃恢复备份
          crashRecovery.clearFileBackup(filePath);
        } catch (error) {
          console.error('自动保存失败:', error);
        }
      }
    }, 500)
  ).current;

  // 防抖备份文件内容（用于崩溃恢复）
  const debouncedBackup = useRef(
    debounce((val: string, path: string) => {
      crashRecovery.backupFile(path, val);
    }, 1000)
  ).current;

  // 防抖语法检测
  const debouncedLint = useRef(
    debounce(async (val: string, currentFilePath?: string) => {
      if (!editorRef.current || !monacoRef.current) {
        console.log('Editor: Editor or Monaco not ready for linting');
        return;
      }
      
      try {
        console.log('Editor: Starting lint for file:', currentFilePath);
        const markers: Marker[] = await lintInk(val, currentFilePath);
        console.log('Editor: Received markers from lintInk:', markers.length, markers);
        
        const model = editorRef.current.getModel();
        if (!model) {
          console.error('Editor: No model available for setting markers');
          return;
        }
        
        console.log('Editor: Model info:', {
          lineCount: model.getLineCount(),
          valueLength: model.getValue().length,
          language: model.getLanguageId()
        });
        
        // 验证并修复标记范围
        const validMarkers = markers.map((marker, index) => {
          const maxLine = model.getLineCount();
          const lineLength = marker.startLineNumber <= maxLine ? 
            model.getLineContent(marker.startLineNumber).length : 0;
          
          const validMarker = {
            ...marker,
            startLineNumber: Math.max(1, Math.min(marker.startLineNumber, maxLine)),
            endLineNumber: Math.max(1, Math.min(marker.endLineNumber, maxLine)),
            startColumn: Math.max(1, Math.min(marker.startColumn, lineLength + 1)),
            endColumn: Math.max(1, Math.min(marker.endColumn, lineLength + 1))
          };
          
          if (marker.startLineNumber !== validMarker.startLineNumber || 
              marker.endColumn !== validMarker.endColumn) {
            console.log('Editor: Fixed marker', index, 'from', marker, 'to', validMarker);
          }
          
          return validMarker;
        });
        
        // 使用独一无二的owner名称，防止被其他逻辑覆盖
        monacoRef.current.editor.setModelMarkers(model, 'ink-lint', validMarkers);
        console.log('Editor: Applied markers to Monaco editor with owner: ink-lint');
        
        // 强制重新布局和渲染
        editorRef.current.layout();
        
        // 验证标记是否真的被设置了
        const appliedMarkers = monacoRef.current.editor.getModelMarkers({ resource: model.uri });
        console.log('Editor: Verification - All applied markers count:', appliedMarkers.length);
        
        // 检查特定owner的标记
        const inkMarkers = monacoRef.current.editor.getModelMarkers({ owner: 'ink-lint' });
        console.log('Editor: Ink-lint markers count:', inkMarkers.length);
        
        // 检查编辑器配置
        const editorOptions = editorRef.current.getOptions();
        console.log('Editor: Configuration check:', {
          glyphMargin: editorOptions.get(monacoRef.current.editor.EditorOption.glyphMargin),
          lineNumbers: editorOptions.get(monacoRef.current.editor.EditorOption.lineNumbers),
          overviewRulerBorder: editorOptions.get(monacoRef.current.editor.EditorOption.overviewRulerBorder),
          hover: editorOptions.get(monacoRef.current.editor.EditorOption.hover)
        });
      } catch (error) {
        console.error('Editor: Lint failed:', error);
      }
    }, 500)
  ).current;

  // 监听外部错误变化（如NodeGraph编译错误）
  useEffect(() => {
    if (externalErrors && editorRef.current && monacoRef.current && content) {
      // 外部错误变化时，重新进行语法检测以显示最新错误
      debouncedLint(content, filePath || undefined);
    }
  }, [externalErrors, content, filePath, debouncedLint]);
  
  // 编辑器挂载后，如果有内容则立即进行语法检测
  useEffect(() => {
    if (editorRef.current && monacoRef.current && content && filePath) {
      console.log('Editor: Mounted with content, starting initial lint');
      debouncedLint(content, filePath);
    }
  }, [editorRef.current, monacoRef.current, content, filePath, debouncedLint]);

  // 手动保存快捷键处理
  const handleSave = useCallback(async () => {
    console.log('💾 Editor: handleSave 被调用', { filePath, hasContent: content !== undefined });
    
    if (!filePath) {
      console.warn('⚠️ Editor: 没有文件路径，无法保存');
      return;
    }
    
    if (content === undefined) {
      console.warn('⚠️ Editor: 内容为空，无法保存');
      return;
    }
    
    try {
      console.log('💾 Editor: 开始保存文件...', filePath);
      const success = await saveFile(filePath);
      if (success) {
        console.log('✅ Editor: 手动保存成功', filePath);
      } else {
        console.error('❌ Editor: 手动保存失败', filePath);
      }
    } catch (error) {
      console.error('❌ Editor: 保存过程中出错', error);
    }
  }, [filePath, content, saveFile]);

  // 监听主题变化并更新编辑器主题
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const themeName = getMonacoThemeName(currentTheme);
      monacoRef.current.editor.setTheme(themeName);
      console.log('Editor: Theme changed to', themeName);
    }
  }, [currentTheme]);

  // 全局Cmd+S监听 - 作为Monaco命令的备用方案
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 只在编辑器有焦点时处理
      if (document.activeElement && 
          (document.activeElement.classList.contains('monaco-editor') || 
           document.activeElement.closest('.monaco-editor'))) {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          console.log('⌨️ Editor: 全局备用Cmd+S监听被触发');
          e.preventDefault();
          e.stopPropagation();
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, true); // 使用capture模式
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [handleSave]);

  // 跳转到指定行号
  useEffect(() => {
    if (goToLine && editorRef.current) {
      setTimeout(() => {
        if (editorRef.current) {
          // 跳转到指定行并选中该行
          editorRef.current.revealLineInCenter(goToLine);
          editorRef.current.setPosition({ lineNumber: goToLine, column: 1 });
          // 选中整行
          editorRef.current.setSelection({
            startLineNumber: goToLine,
            startColumn: 1,
            endLineNumber: goToLine,
            endColumn: editorRef.current.getModel()?.getLineMaxColumn(goToLine) || 1
          });
          // 聚焦编辑器
          editorRef.current.focus();
        }
      }, 100);
    }
  }, [goToLine]);

  // 在编辑器加载前获取Monaco SDK实例 - 增强错误处理
  const handleBeforeMount: BeforeMount = (monaco) => {
    try {
      console.log('🔧 Editor: 开始Monaco编辑器初始化');
      monacoRef.current = monaco;
      
      // 安全地注册Ink语言支持
      try {
        registerInkLanguage(monaco);
        console.log('✅ Editor: Ink语言支持注册成功');
      } catch (langError) {
        console.warn('⚠️ Editor: Ink语言支持注册失败，但编辑器仍可使用:', langError);
        // 继续执行，不阻止编辑器加载
      }
      
      // 安全地设置主题
      try {
        const themeName = getMonacoThemeName(currentTheme);
        console.log('🎨 Editor: 设置主题:', themeName);
        monaco.editor.setTheme(themeName);
        console.log('✅ Editor: 主题设置成功');
      } catch (themeError) {
        console.warn('⚠️ Editor: 主题设置失败，使用默认主题:', themeError);
        // 尝试设置默认主题
        try {
          monaco.editor.setTheme('vs-dark');
        } catch (fallbackError) {
          console.warn('⚠️ Editor: 连默认主题都设置失败:', fallbackError);
        }
      }
      
      console.log('✅ Editor: Monaco编辑器初始化完成');
    } catch (error) {
      console.error('❌ Editor: Monaco编辑器初始化严重失败:', error);
      // 即使初始化失败，也不抛出错误，让编辑器尝试继续加载
    }
  };

  // Monaco Editor 挂载回调：获取编辑器实例并配置 - 增强错误处理
  const handleEditorDidMount: OnMount = (editor) => {
    try {
      console.log('🔧 Editor: 开始配置编辑器实例');
      editorRef.current = editor;
      setIsEditorReady(true); // 标记编辑器已准备完成
      
      // 安全地添加保存快捷键
      try {
        if (monacoRef.current && editor.addCommand) {
          console.log('🔧 Editor: 注册Cmd+S快捷键');
          editor.addCommand(monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.KeyS, () => {
            console.log('⌨️ Editor: Cmd+S 被触发');
            try {
              handleSave();
            } catch (saveError) {
              console.error('❌ Editor: 保存快捷键处理失败:', saveError);
            }
          });
          console.log('✅ Editor: 快捷键注册成功');
        } else {
          console.warn('⚠️ Editor: 无法注册快捷键，Monaco实例不可用');
        }
      } catch (commandError) {
        console.warn('⚠️ Editor: 快捷键注册失败，但不影响编辑器使用:', commandError);
      }
      
      // 安全地添加全局键盘监听作为备用方案
      try {
        const handleKeyDown = (e: KeyboardEvent) => {
          try {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              console.log('⌨️ Editor: 全局Cmd+S监听被触发');
              e.preventDefault();
              handleSave();
            }
          } catch (keyError) {
            console.error('❌ Editor: 键盘事件处理失败:', keyError);
          }
        };
        
        // 安全地注册焦点事件监听器
        if (editor.onDidFocusEditorText && editor.onDidBlurEditorText) {
          editor.onDidFocusEditorText(() => {
            try {
              console.log('🔧 Editor: 编辑器获得焦点，添加键盘监听');
              document.addEventListener('keydown', handleKeyDown);
            } catch (focusError) {
              console.warn('⚠️ Editor: 焦点事件处理失败:', focusError);
            }
          });
          
          editor.onDidBlurEditorText(() => {
            try {
              console.log('🔧 Editor: 编辑器失去焦点，移除键盘监听');
              document.removeEventListener('keydown', handleKeyDown);
            } catch (blurError) {
              console.warn('⚠️ Editor: 失焦事件处理失败:', blurError);
            }
          });
        } else {
          console.warn('⚠️ Editor: 焦点事件监听器不可用');
        }
      } catch (listenerError) {
        console.warn('⚠️ Editor: 事件监听器设置失败:', listenerError);
      }
      
      // 安全地设置编辑器高级选项
      try {
        if (editor.updateOptions) {
          editor.updateOptions({
            scrollBeyondLastLine: false,
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            },
            parameterHints: {
              enabled: true
            },
            foldingStrategy: 'auto',
            showFoldingControls: 'always',
            // 语法验证和错误显示
            'semanticHighlighting.enabled': true,
          });
          console.log('✅ Editor: 编辑器选项设置成功');
        } else {
          console.warn('⚠️ Editor: updateOptions方法不可用');
        }
      } catch (optionsError) {
        console.warn('⚠️ Editor: 编辑器选项设置失败:', optionsError);
      }
      
      // 安全地应用当前主题
      try {
        if (monacoRef.current && monacoRef.current.editor && monacoRef.current.editor.setTheme) {
          const themeName = getMonacoThemeName(currentTheme);
          monacoRef.current.editor.setTheme(themeName);
          console.log('✅ Editor: 编辑器主题应用成功');
        } else {
          console.warn('⚠️ Editor: 无法应用主题，Monaco实例不完整');
        }
      } catch (themeError) {
        console.warn('⚠️ Editor: 主题应用失败:', themeError);
      }
      
      console.log('✅ Editor: 编辑器配置完成');
    } catch (error) {
      console.error('❌ Editor: 编辑器配置严重失败:', error);
      // 即使配置失败，编辑器可能仍然可用
      setIsEditorReady(true); // 仍然标记为准备完成，让用户可以使用基础功能
    }
  };

  // 内容变更处理 - 增强错误处理
  const handleChange = (value?: string) => {
    try {
      const val = value ?? '';
      setContent(val);
      
      // 安全地标记文件为已修改
      try {
        if (filePath && markFileAsDirty) {
          markFileAsDirty(filePath, val);
        }
      } catch (dirtyError) {
        console.warn('⚠️ Editor: 标记文件修改状态失败:', dirtyError);
      }
      
      // 安全地执行防抖保存
      try {
        if (debouncedSave) {
          debouncedSave(val);
        }
      } catch (saveError) {
        console.warn('⚠️ Editor: 防抖保存失败:', saveError);
      }
      
      // 安全地执行防抖语法检查
      try {
        if (debouncedLint) {
          debouncedLint(val, filePath || undefined);
        }
      } catch (lintError) {
        console.warn('⚠️ Editor: 语法检查失败:', lintError);
      }
      
      // 安全地备份内容用于崩溃恢复
      try {
        if (filePath && debouncedBackup) {
          debouncedBackup(val, filePath);
        }
      } catch (backupError) {
        console.warn('⚠️ Editor: 内容备份失败:', backupError);
      }
    } catch (error) {
      console.error('❌ Editor: 内容变更处理失败:', error);
      // 即使处理失败，也要保证基本的内容更新
      try {
        const val = value ?? '';
        setContent(val);
      } catch (basicError) {
        console.error('❌ Editor: 连基本内容更新都失败:', basicError);
      }
    }
  };

  return (
    <div 
      className="h-full relative" 
      style={{ 
        backgroundColor: colors.editorBackground, // 使用主题的编辑器背景色
        color: colors.editorForeground // 使用主题的编辑器前景色
      }}
    >
      {/* 编辑器加载期间显示与主题匹配的背景 */}
      {!isEditorReady && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            backgroundColor: colors.editorBackground,
            color: colors.textMuted
          }}
        >
          <div className="text-sm">Loading editor...</div>
        </div>
      )}
      
      {/* 使用错误边界保护Monaco编辑器 */}
      <ErrorBoundary>
        <MonacoEditor
          height="100%"
          defaultLanguage="ink"
          language="ink"
          value={content}
          theme={getMonacoThemeName(currentTheme)} // 直接设置主题避免闪烁
          beforeMount={handleBeforeMount}
          onMount={handleEditorDidMount}
          onChange={handleChange}
        options={{
          wordWrap: 'on',
          tabSize: 2,
          automaticLayout: true,
          // 错误标记显示的核心配置
          glyphMargin: true,          // 启用字形边距（显示错误图标）
          lineNumbers: 'on',          // 确保行号显示
          renderLineHighlight: 'all', // 高亮当前行
          overviewRulerBorder: true,  // 滚动条边框
          overviewRulerLanes: 3,      // 滚动条标记层数
          fontSize: 14,
          minimap: { enabled: false },
          hover: { enabled: true, delay: 300 },
          folding: true,
          // 简化错误样式 - 只显示波浪线
          lightbulb: {
            enabled: false
          }
        }}
        />
      </ErrorBoundary>
    </div>
  );
};

export default Editor;
