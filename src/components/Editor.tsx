import React, { useState, useEffect, useRef, useContext } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { debounce } from '../hooks/useDebounce';
import { InkContext, type Marker } from '../context/InkContext.tsx';

interface EditorProps {
  /** 当前编辑的本地 Ink 文件路径 */
  filePath: string | null;
  /** 外部插件触发回调（暂未使用） */
  onRunPlugin?: (id: string, params: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ filePath }) => {
  const { lintInk } = useContext(InkContext)!;
  const [content, setContent] = useState<string>('');
  const monacoRef = useRef<any>(null);

  // 根据 filePath 加载本地文件内容
  useEffect(() => {
    if (!filePath) {
      setContent('');
      return;
    }
    window.inkAPI.readFile(filePath).then((text: string) => {
      setContent(text);
      // 清除旧标记
      if (monacoRef.current) {
        const model = monacoRef.current.getModel();
        monaco.editor.setModelMarkers(model, 'ink', []);
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
    debounce(async (val: string) => {
      if (!monacoRef.current) return;
      const markers: Marker[] = await lintInk(val);
      const model = monacoRef.current.getModel();
      monaco.editor.setModelMarkers(model, 'ink', markers);
    }, 500)
  ).current;

  // Monaco Editor 挂载回调：注册语言、高亮规则
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = editor;
    monaco.languages.register({ id: 'ink' });
    monaco.languages.setMonarchTokensProvider('ink', {
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/\b(INCLUDE|->)\b/, 'keyword'],
          [/"[^"]*"/, 'string'],
        ],
      },
    });
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });
  };

  // 内容变更
  const handleChange = (value?: string) => {
    const val = value ?? '';
    setContent(val);
    debouncedSave(val);
    debouncedLint(val);
  };

  return (
    <div className="h-full">
      <MonacoEditor
        height="100%"
        defaultLanguage="ink"
        language="ink"
        value={content}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          wordWrap: 'on',
          tabSize: 2,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default Editor;
