// src/components/NodeGraph.tsx

import React, { useRef, useEffect, useState, useContext } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { GraphNode, GraphLink } from '../utils/storyGraph.ts';
import { buildStoryGraph } from '../utils/storyGraph.ts';
import { InkContext } from '../context/InkContext';
import { useTheme } from '../context/ThemeContext';

interface NodeGraphProps {
  filePath?: string | null;
}

export const NodeGraph: React.FC<NodeGraphProps> = ({ filePath }) => {
  const fgRef = useRef<ForceGraphMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { nodes, links } = graph;
  
  // 使用主题和InkContext
  const { colors } = useTheme();
  const inkContext = useContext(InkContext);
  const { reportCompilationErrors } = inkContext || {};

  // 当文件路径改变时，重新编译并生成图
  useEffect(() => {
    if (!filePath) {
      setGraph({ nodes: [], links: [] });
      setError(null);
      setLoading(false);
      return;
    }

    // 验证文件是否为 Ink 文件
    if (!filePath.endsWith('.ink')) {
      setError('只能为 .ink 文件生成节点图');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadGraph = async () => {
      if (cancelled) return;
      
      setLoading(true);
      setError(null);
      try {
        // 读取文件内容
        const source = await window.inkAPI.readFile(filePath);
        
        // 编译文件生成图数据，同时将编译错误传递给Editor
        const compiled = await window.inkAPI.compileInk(source, false, filePath);
        
        // 生成图数据
        const graphData = buildStoryGraph(compiled);
        
        if (!cancelled) {
          setGraph(graphData);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : String(error));
          setGraph({ nodes: [], links: [] });
          
          // 将编译错误传递给Editor
          if (reportCompilationErrors) {
            try {
              const source = await window.inkAPI.readFile(filePath);
              await reportCompilationErrors(source, error instanceof Error ? error.message : String(error), filePath);
            } catch {
              // 错误报告失败，忽略
            }
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  // 当 nodes 或 links 更新时，自动缩放以适应视图
  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      // 延迟执行缩放，确保图形已经渲染
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 50);
        }
      }, 100);
    }
  }, [nodes, links]);

  if (!filePath) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          backgroundColor: colors.secondary,
          color: colors.textMuted 
        }}
      >
        请选择一个 Ink 文件以查看节点图
      </div>
    );
  }

  if (loading) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          backgroundColor: colors.secondary,
          color: colors.textMuted 
        }}
      >
        正在生成节点图...
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="w-full h-full p-4 overflow-auto"
        style={{ backgroundColor: colors.secondary }}
      >
        <div 
          className="px-4 py-3 rounded border"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.error,
            color: colors.error 
          }}
        >
          <h3 className="font-bold mb-2">无法生成节点图</h3>
          <pre 
            className="whitespace-pre-wrap text-sm font-mono p-2 rounded border overflow-x-auto"
            style={{ 
              backgroundColor: colors.primary,
              borderColor: colors.border,
              color: colors.textPrimary 
            }}
          >{error}</pre>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          backgroundColor: colors.secondary,
          color: colors.textMuted 
        }}
      >
        此文件没有可显示的节点
      </div>
    );
  }

  console.log('NodeGraph: Rendering with data:', { nodes: nodes.length, links: links.length });
  console.log('NodeGraph: nodes:', nodes);
  console.log('NodeGraph: links:', links);

  return (
    <div 
      className="flex-1 h-full p-4 overflow-hidden" 
      ref={containerRef}
      style={{ backgroundColor: colors.secondary }}
    >
      {/* 临时调试信息 */}
      <div 
        className="absolute top-2 left-2 z-50 p-2 text-xs rounded"
        style={{ 
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          border: `1px solid ${colors.border}` 
        }}
      >
        节点: {nodes.length} | 连线: {links.length}
      </div>
      
      {/* 只在有数据时渲染ForceGraph2D，避免空数据初始化问题 */}
      {nodes.length > 0 && (
        <ForceGraph2D
          key={`${filePath}-${nodes.length}-${links.length}`} // 强制在数据变化时重新挂载
          ref={fgRef as any}
          graphData={{ nodes: nodes as GraphNode[], links: links as GraphLink[] }}
          nodeAutoColorBy="id"
          nodeLabel={(d: any) => `${d.id}`}
          linkLabel="label"
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={() => colors.textMuted}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          backgroundColor={colors.secondary}
          width={window.innerWidth * 0.6} // 使用窗口宽度的60%
          height={window.innerHeight}
        />
      )}
    </div>
  );
};

export default NodeGraph;
