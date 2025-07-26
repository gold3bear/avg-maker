// src/components/NodeGraph.tsx

import React, { useRef, useEffect, useContext } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { InkContext } from '../context/InkContext.tsx';
import type { GraphNode, GraphLink } from '../utils/storyGraph.ts';

export const NodeGraph: React.FC = () => {
  const fgRef = useRef<ForceGraphMethods>();
  const { graph } = useContext(InkContext);
  const { nodes, links } = graph;

  // 当 nodes 或 links 更新时，自动缩放以适应视图
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50);
    }
  }, [nodes, links]);

  return (
    <div className="w-full h-full bg-white">
      <ForceGraph2D
        ref={fgRef as any}
        graphData={{ nodes: nodes as GraphNode[], links: links as GraphLink[] }}
        nodeLabel="name"
        nodeAutoColorBy="id"
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={() => 0.004}
        // 让画布自动填充容器
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
};

export default NodeGraph;
