import React, { createContext, useState } from 'react';
import { buildStoryGraph, type GraphNode, type GraphLink } from '../utils/storyGraph.ts';

/**
 * Monaco 标记信息
 */
export interface Marker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: number; // 用 monaco.MarkerSeverity 枚举
}

/**
 * Ink 上下文值
 */
export interface InkContextValue {
  content: string;
  setContent: (value: string) => void;
  parsed: any;
  loading: boolean;
  graph: { nodes: GraphNode[]; links: GraphLink[] };
  /** 编译或 lint：lintOnly=true 时仅做语法检查 */
  compileInk: (source: string, lintOnly?: boolean, sourceFilePath?: string) => Promise<void>;
  /** 语法检测，将错误转为 Marker 列表 */
  lintInk: (source: string) => Promise<Marker[]>;
}

export const InkContext = createContext<InkContextValue | null>(null);

export const InkProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [content, setContent] = useState<string>("");
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });

  /**
   * 调用主进程 API 编译 Ink，更新 parsed 和 graph
   */
  const compileInk = async (source: string, lintOnly = false, sourceFilePath?: string) => {
    setLoading(true);
    try {
      const result = await (window as any).inkAPI.compileInk(source, lintOnly, sourceFilePath);
      if (!lintOnly) {
        setParsed(result);
        setGraph(buildStoryGraph(result));
      }
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      // 如果 lintOnly，抛出 stderr 字符串供 lintInk 处理
      throw typeof err === 'string' ? err : err.message;
    }
  };

  /**
   * 语法检测：使用 compileInk({lintOnly: true}) 并解析错误输出
   */
  const lintInk = async (source: string): Promise<Marker[]> => {
    try {
      await compileInk(source, true);
      return [];
    } catch (stderr) {
      const errStr = String(stderr);
      const markers: Marker[] = [];
      const regex = /line\s+(\d+):\s*(.+)/g;
      let match;
      while ((match = regex.exec(errStr))) {
        const line = Number(match[1]);
        const message = match[2].trim();
        // 区分警告和错误
        const isWarning = message.toLowerCase().includes('warning') || message.includes('WARNING');
        markers.push({
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: Number.MAX_SAFE_INTEGER,
          message,
          severity: isWarning ? 4 : 8 // monaco.MarkerSeverity.Warning : Error
        });
      }
      return markers;
    }
  };

  return (
    <InkContext.Provider value={{ content, setContent, parsed, loading, graph, compileInk, lintInk }}>
      {children}
    </InkContext.Provider>
  );
};
