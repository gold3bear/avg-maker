import React, { createContext, useState } from 'react';
import { buildStoryGraph, type GraphNode, type GraphLink } from '../utils/storyGraph.ts';
import { validateInkSyntax } from '../utils/inkValidator';
import { parseInklecateOutput, convertInklecateErrorsToMarkers } from '../utils/inklecateErrorParser';

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
  lintInk: (source: string, sourceFilePath?: string) => Promise<Marker[]>;
  /** 向Editor报告外部编译错误（比如来自NodeGraph） */
  reportCompilationErrors: (source: string, error: string, sourceFilePath?: string) => Promise<void>;
  /** 外部错误状态，用于触发Editor重新lint */
  externalErrors: {error: string, sourceFilePath?: string} | null;
}

export const InkContext = createContext<InkContextValue | null>(null);

export const InkProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [content, setContent] = useState<string>("");
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [externalErrors, setExternalErrors] = useState<{error: string, sourceFilePath?: string} | null>(null);

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
   * 语法检测：完全依赖inklecate后端编译检查，确保准确性
   */
  const lintInk = async (source: string, sourceFilePath?: string): Promise<Marker[]> => {
    const markers: Marker[] = [];
    const sourceLines = source.split('\n');
    
    // 客户端语法检测已禁用，返回空数组 - 完全依赖inklecate
    const clientMarkers = validateInkSyntax(source);
    markers.push(...clientMarkers);
    
    // 服务端编译检测 - inklecate是权威标准
    try {
      const result = await (window as any).inkAPI.compileInk(source, true, sourceFilePath);
      
      // 检查编译结果中的警告
      if (result && result.warnings && Array.isArray(result.warnings)) {
        const warningStr = result.warnings.join('\n');
        const inklecateErrors = parseInklecateOutput('', warningStr, undefined, sourceFilePath);
        const inklecateMarkers = convertInklecateErrorsToMarkers(inklecateErrors, sourceLines, sourceFilePath);
        
        // 添加警告标记
        markers.push(...inklecateMarkers);
      }
    } catch (stderr) {
      const errStr = String(stderr);
      console.log('InkContext: Compilation failed with stderr:', errStr);
      console.log('InkContext: sourceFilePath:', sourceFilePath);
      console.log('InkContext: Error string length:', errStr.length);
      console.log('InkContext: First 500 chars:', errStr.substring(0, 500));
      
      // 从JavaScript Error中提取inklecate错误文本
      let cleanErrorText = errStr;
      
      // 如果错误被包装在JavaScript Error中，提取所有inklecate错误行
      // 改进正则表达式以匹配更多错误格式
      const inklecateErrorMatches = errStr.match(/(ERROR|WARNING):\s*'[^']+'.*line\s*\d+:\s*.+/g);
      if (inklecateErrorMatches && inklecateErrorMatches.length > 0) {
        cleanErrorText = inklecateErrorMatches.join('\n');
        console.log('InkContext: Extracted inklecate errors:', cleanErrorText);
        console.log('InkContext: Found', inklecateErrorMatches.length, 'error(s)');
      } else {
        // 如果正则匹配失败，尝试查找包含ERROR或WARNING的行
        const errorLines = errStr.split('\n').filter(line => 
          line.includes('ERROR:') || line.includes('WARNING:')
        );
        if (errorLines.length > 0) {
          cleanErrorText = errorLines.join('\n');
          console.log('InkContext: Fallback extraction found', errorLines.length, 'error line(s)');
        }
      }
      
      // 使用增强的inklecate错误解析器处理编译错误
      const inklecateErrors = parseInklecateOutput('', cleanErrorText, undefined, sourceFilePath);
      console.log('InkContext: Parsed inklecate errors:', inklecateErrors);
      const inklecateMarkers = convertInklecateErrorsToMarkers(inklecateErrors, sourceLines, sourceFilePath);
      console.log('InkContext: Converted to markers:', inklecateMarkers);
      
      // 避免重复标记（如果客户端已经检测到相同问题）
      markers.push(...inklecateMarkers);
    }
    
    // 3. 处理外部编译错误（比如来自NodeGraph）
    if (externalErrors && 
        (!sourceFilePath || !externalErrors.sourceFilePath || 
         sourceFilePath === externalErrors.sourceFilePath)) {
      const inklecateErrors = parseInklecateOutput('', externalErrors.error, undefined, sourceFilePath);
      const inklecateMarkers = convertInklecateErrorsToMarkers(inklecateErrors, sourceLines, sourceFilePath);
      
      markers.push(...inklecateMarkers);
    }
    
    return markers;
  };

  /**
   * 报告外部编译错误（比如来自NodeGraph）
   */
  const reportCompilationErrors = async (_: string, error: string, sourceFilePath?: string) => {
    setExternalErrors({ error, sourceFilePath });
  };

  return (
    <InkContext.Provider value={{ content, setContent, parsed, loading, graph, compileInk, lintInk, reportCompilationErrors, externalErrors }}>
      {children}
    </InkContext.Provider>
  );
};
