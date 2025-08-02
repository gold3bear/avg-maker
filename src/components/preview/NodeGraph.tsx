// src/components/NodeGraph.tsx

import React, { useRef, useEffect, useState, useContext } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { GraphNode, GraphLink } from '../../utils/storyGraph.ts';
import { buildStoryGraph } from '../../utils/storyGraph.ts';
import { InkContext } from '../../context/InkContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';

interface NodeGraphProps {
  filePath?: string | null;
  currentKnot?: string; // 当前游戏所在的节点
  // 新增：直接接收预编译的图数据
  graphData?: { nodes: GraphNode[]; links: GraphLink[] };
  isLoading?: boolean;
  error?: string | null;
}

export const NodeGraph: React.FC<NodeGraphProps> = ({ 
  filePath, 
  currentKnot, 
  graphData, 
  isLoading: externalLoading, 
  error: externalError 
}) => {
  const fgRef = useRef<ForceGraphMethods>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [shouldFocusCurrentKnot, setShouldFocusCurrentKnot] = useState(false);
  
  // 如果提供了外部数据，使用外部数据；否则使用内部状态
  const [internalGraph, setInternalGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  
  // 选择数据源
  const graph = graphData || internalGraph;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;
  const { nodes, links } = graph;
  
  // 使用主题和InkContext
  const { colors } = useTheme();
  const inkContext = useContext(InkContext);
  const { reportCompilationErrors } = inkContext || {};

  // 当文件路径改变时，重新编译并生成图（仅在没有外部数据时）
  useEffect(() => {
    // 如果有外部数据，跳过内部编译
    if (graphData) {
      return;
    }
    
    if (!filePath) {
      setInternalGraph({ nodes: [], links: [] });
      setInternalError(null);
      setInternalLoading(false);
      return;
    }

    // 验证文件是否为 Ink 文件
    if (!filePath.endsWith('.ink')) {
      setInternalError('只能为 .ink 文件生成节点图');
      setInternalLoading(false);
      return;
    }

    let cancelled = false;

    const loadGraph = async () => {
      if (cancelled) return;
      
      setInternalLoading(true);
      setInternalError(null);
      try {
        // 读取文件内容
        const source = await window.inkAPI.readFile(filePath);
        
        // 编译文件生成图数据，同时将编译错误传递给Editor
        const compiled = await window.inkAPI.compileInk(source, false, filePath);
        
        // 生成图数据
        const graphData = buildStoryGraph(compiled);
        
        if (!cancelled) {
          setInternalGraph(graphData);
        }
      } catch (error) {
        if (!cancelled) {
          setInternalError(error instanceof Error ? error.message : String(error));
          setInternalGraph({ nodes: [], links: [] });
          
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
          setInternalLoading(false);
        }
      }
    };

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [filePath, graphData, reportCompilationErrors]);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    // 初始设置尺寸
    updateDimensions();

    // 监听窗口大小变化
    window.addEventListener('resize', updateDimensions);
    
    // 使用ResizeObserver监听容器大小变化
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  // 当 nodes 或 links 更新时，自动缩放以适应视图
  useEffect(() => {
    if (fgRef.current && nodes.length > 0 && dimensions.width > 0) {
      // 延迟执行缩放，确保图形已经渲染
      const timer = setTimeout(() => {
        if (fgRef.current) {
          // 使用更大的padding值，确保节点不会贴边
          fgRef.current.zoomToFit(400, Math.min(dimensions.width * 0.00001, dimensions.height * 0.00001));
          
          // 如果有当前节点，设置标志以便在力布局完成后聚焦
          if (currentKnot) {
            setShouldFocusCurrentKnot(true);
          }
        }
      }, 300); // 增加延迟时间

      return () => clearTimeout(timer);
    }
  }, [nodes, links, dimensions, currentKnot]);

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
      
      {/* 只在有数据时渲染ForceGraph2D，避免空数据初始化问题 */}
      {nodes.length > 0 && (
        <ForceGraph2D
          key={`${filePath}-${nodes.length}-${links.length}`} // 强制在数据变化时重新挂载
          ref={fgRef as any}
          graphData={{ nodes: nodes as GraphNode[], links: links as GraphLink[] }}
          nodeRelSize={8}
        
          nodeLabel= {(node: any) => node.id}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const isCurrentKnot = currentKnot && node.id === currentKnot;
            
            // 检查是否为相邻节点
            const isNeighborNode = links.some(link => 
              (link.source === currentKnot && link.target === node.id) ||
              (link.target === currentKnot && link.source === node.id)
            );
            
            // 决定是否显示标签
            const shouldShowLabel = isCurrentKnot || isNeighborNode;
            
            // 节点大小
            const nodeSize = isCurrentKnot ? 8 : 5;
            
            // 绘制节点圆形
            ctx.fillStyle = isCurrentKnot ? '#ef4444' : (isNeighborNode ? '#10b981' : '#6366f1');
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
            ctx.fill();
            
            // 如果是当前节点，添加光环效果
            if (isCurrentKnot) {
              ctx.strokeStyle = '#ef444480';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(node.x, node.y, nodeSize + 4, 0, 2 * Math.PI, false);
              ctx.stroke();
            }
            
            // 绘制标签（仅当前节点和相邻节点）
            if (shouldShowLabel) {
              const fontSize = Math.max(10, 14 / globalScale);
              ctx.font = `bold ${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // 标签背景
              const textMetrics = ctx.measureText(node.id);
              const textWidth = textMetrics.width;
              const textHeight = fontSize;
              const padding = 4;
              
              const bgX = node.x - textWidth / 2 - padding;
              const bgY = node.y + nodeSize + 8 - textHeight / 2 - padding;
              const bgWidth = textWidth + padding * 2;
              const bgHeight = textHeight + padding * 2;
              
              // 绘制标签背景
              ctx.fillStyle = isCurrentKnot ? '#ef444490' : '#00000080';
              ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
              
              // 绘制标签文字
              ctx.fillStyle = '#ffffff';
              ctx.fillText(node.id, node.x, node.y + nodeSize + 8);
              
            
            }
          }}
          linkLabel={(link: any) => link.label || ''}
          linkColor={(link: any) => {
            // 高亮连接到当前节点的连线
            if (currentKnot && (link.source === currentKnot || link.target === currentKnot)) {
              return '#ef4444';
            }
            return colors.textMuted;
          }}
          linkWidth={(link: any) => {
            // 加粗连接到当前节点的连线
            if (currentKnot && (link.source === currentKnot || link.target === currentKnot)) {
              return 2;
            }
            return 1;
          }}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={(link: any) => {
            // 箭头颜色与连线保持一致
            if (currentKnot && (link.source === currentKnot || link.target === currentKnot)) {
              return '#ef4444';
            }
            return colors.textMuted;
          }}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          backgroundColor={colors.secondary}
          width={dimensions.width || 400}
          height={dimensions.height || 300}
          d3Force={(d3Force: any) => {
            // 调整力导向图的参数，让节点分布更合理
            d3Force('charge')?.strength(-300);
            d3Force('link')?.distance(100);
            d3Force('center')?.strength(0.1);
          }}
          cooldownTicks={100}
          onEngineStop={() => {
            // 当力导向图稳定后，如果需要聚焦当前节点
            if (shouldFocusCurrentKnot && currentKnot && fgRef.current) {
              setTimeout(() => {
                // 直接从传入的 nodes 数组中找到当前节点
                // 在力布局完成后，nodes 数组中的节点会被 ForceGraph 添加 x, y 坐标
                const nodeInGraph = nodes.find((n: any) => n.id === currentKnot);
                
                if (nodeInGraph && (nodeInGraph as any).x !== undefined && (nodeInGraph as any).y !== undefined) {
                  // 居中到节点的计算坐标
                  fgRef.current?.centerAt((nodeInGraph as any).x, (nodeInGraph as any).y, 500);
                  // 放大
                  setTimeout(() => {
                    fgRef.current?.zoom(1.5, 500);
                  }, 600);
                  
                  setShouldFocusCurrentKnot(false); // 重置标志
                } else {
                  // 如果坐标还没准备好，先放大，不居中
                  fgRef.current?.zoom(1.5, 500);
                  setShouldFocusCurrentKnot(false);
                }
              }, 100);
            }
          }}
        />
      )}
    </div>
  );
};

export default NodeGraph;
