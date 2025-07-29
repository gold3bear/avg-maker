import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import MonacoEditor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type * as MonacoNamespace from 'monaco-editor';
import { debounce } from '../hooks/useDebounce';
import { InkContext, type Marker } from '../context/InkContext.tsx';
import { useTheme } from '../context/ThemeContext';
import { registerInkLanguage, getMonacoThemeName } from '../utils/inkLanguage';
import { crashRecovery } from '../utils/crashRecovery';
import { useSave } from '../context/SaveContext';

interface EditorProps {
  /** 当前编辑的本地 Ink 文件路径 */
  filePath: string | null;
  /** 外部插件触发回调（暂未使用） */
  onRunPlugin?: (id: string, params: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ filePath }) => {
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

  // 在编辑器加载前获取Monaco SDK实例
  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    // 注册完整的Ink语言支持
    registerInkLanguage(monaco);
    
    // 在编辑器创建前就设置主题，避免白屏闪烁
    const themeName = getMonacoThemeName(currentTheme);
    console.log('🎨 Editor: 在编辑器创建前设置主题:', themeName);
    monaco.editor.setTheme(themeName);
  };

  // Monaco Editor 挂载回调：获取编辑器实例并配置
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    setIsEditorReady(true); // 标记编辑器已准备完成
    
    // 添加保存快捷键 (Cmd+S / Ctrl+S)
    if (monacoRef.current) {
      console.log('🔧 Editor: 注册Cmd+S快捷键');
      editor.addCommand(monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.KeyS, () => {
        console.log('⌨️ Editor: Cmd+S 被触发');
        handleSave();
      });
    }
    
    // 添加全局键盘监听作为备用方案
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        console.log('⌨️ Editor: 全局Cmd+S监听被触发');
        e.preventDefault();
        handleSave();
      }
    };
    
    // 在编辑器获得焦点时添加监听器
    editor.onDidFocusEditorText(() => {
      console.log('🔧 Editor: 编辑器获得焦点，添加键盘监听');
      document.addEventListener('keydown', handleKeyDown);
    });
    
    // 在编辑器失去焦点时移除监听器
    editor.onDidBlurEditorText(() => {
      console.log('🔧 Editor: 编辑器失去焦点，移除键盘监听');
      document.removeEventListener('keydown', handleKeyDown);
    });
    
    // 设置编辑器高级选项
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
    
    // 应用当前主题
    if (monacoRef.current) {
      const themeName = getMonacoThemeName(currentTheme);
      monacoRef.current.editor.setTheme(themeName);
    }
  };

  // 内容变更
  const handleChange = (value?: string) => {
    const val = value ?? '';
    setContent(val);
    
    // 标记文件为已修改
    if (filePath) {
      markFileAsDirty(filePath, val);
    }
    
    debouncedSave(val);
    debouncedLint(val, filePath || undefined);
    
    // 备份内容用于崩溃恢复
    if (filePath) {
      debouncedBackup(val, filePath);
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
          folding: true
        }}
      />
    </div>
  );
};

export default Editor;
