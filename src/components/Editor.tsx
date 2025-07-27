import React, { useState, useEffect, useRef, useContext } from 'react';
import MonacoEditor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type * as MonacoNamespace from 'monaco-editor';
import { debounce } from '../hooks/useDebounce';
import { InkContext, type Marker } from '../context/InkContext.tsx';
import { registerInkLanguage } from '../utils/inkLanguage';

interface EditorProps {
  /** 当前编辑的本地 Ink 文件路径 */
  filePath: string | null;
  /** 外部插件触发回调（暂未使用） */
  onRunPlugin?: (id: string, params: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ filePath }) => {
  const { lintInk, externalErrors } = useContext(InkContext)!;
  const [content, setContent] = useState<string>('');
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
    debounce((val: string) => {
      if (filePath) window.inkAPI.writeFile(filePath, val);
    }, 500)
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

  // 在编辑器加载前获取Monaco SDK实例
  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    // 注册完整的Ink语言支持
    registerInkLanguage(monaco);
  };

  // Monaco Editor 挂载回调：获取编辑器实例并配置
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    
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
    
    // 应用Ink主题
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme('ink-theme');
    }
  };

  // 内容变更
  const handleChange = (value?: string) => {
    const val = value ?? '';
    setContent(val);
    debouncedSave(val);
    debouncedLint(val, filePath || undefined);
  };

  return (
    <div className="h-full">
      <MonacoEditor
        height="100%"
        defaultLanguage="ink"
        language="ink"
        value={content}
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
