// src/components/NodeGraph.tsx

import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { GraphNode, GraphLink } from '../utils/storyGraph.ts';
import { buildStoryGraph } from '../utils/storyGraph.ts';

interface NodeGraphProps {
  filePath?: string | null;
}

export const NodeGraph: React.FC<NodeGraphProps> = ({ filePath }) => {
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { nodes, links } = graph;

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
        
        // 编译文件，传递文件路径以支持INCLUDE语法
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
      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
        请选择一个 Ink 文件以查看节点图
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
        正在生成节点图...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-200 p-4 overflow-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold mb-2">无法生成节点图</h3>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-red-200 p-2 rounded border overflow-x-auto">{error}</pre>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
        此文件没有可显示的节点
      </div>
    );
  }

  console.log('NodeGraph: Rendering with data:', { nodes: nodes.length, links: links.length });
  console.log('NodeGraph: nodes:', nodes);
  console.log('NodeGraph: links:', links);

  return (
    <div className="flex-1 h-full bg-gray-200 p-4 overflow-hidden" ref={containerRef}>
      {/* 临时调试信息 */}
      <div className="absolute top-2 left-2 z-50 bg-black text-white p-2 text-xs rounded">
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
          linkDirectionalArrowColor={() => '#888'}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          width={window.innerWidth * 0.6} // 使用窗口宽度的60%
          height={window.innerHeight}
        />
      )}
    </div>
  );
};

export default NodeGraph;
