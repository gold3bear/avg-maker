// src/utils/storyGraph.ts

export interface GraphNode { id: string; }
export interface GraphLink { source: string; target: string; label: string; }

/**
 * 构建 Ink 剧本节点关系图
 * @param raw inklecate 导出的原始 JSON
 * @returns 包含节点和带标签的跳转链接
 */
export function buildStoryGraph(
  raw: any
): { nodes: GraphNode[]; links: GraphLink[] } {
  // 检查raw和raw.root是否存在
  if (!raw || !raw.root || !Array.isArray(raw.root)) {
    console.warn('buildStoryGraph: Invalid ink JSON structure');
    return { nodes: [], links: [] };
  }
  
  // inklecate 21版本：named content在root数组的最后一个元素中
  const lastRootElement = raw.root[raw.root.length - 1];
  if (!lastRootElement || typeof lastRootElement !== 'object') {
    console.warn('buildStoryGraph: No named content found in root');
    return { nodes: [], links: [] };
  }
  
  // 过滤掉特殊属性（如#f, #n等）和 global decl，获取实际的knot
  const named: Record<string, any[]> = {};
  Object.entries(lastRootElement).forEach(([key, value]) => {
    if (!key.startsWith('#') && key !== 'global decl' && Array.isArray(value)) {
      named[key] = value;
    }
  });
  
  const nodes: GraphNode[] = Object.keys(named).map((id) => ({ id }));
  const links: GraphLink[] = [];

  Object.entries(named).forEach(([from, content]) => {
    let usedNarrativeDivert = false;
    let lastText = '';

    function recurse(arr: any[], inChoice: boolean) {
      // 安全检查：确保 arr 是数组
      if (!Array.isArray(arr)) {
        console.warn(`buildStoryGraph: expected array but got ${typeof arr} for knot "${from}"`);
        return;
      }
      
      arr.forEach((entry) => {
        if (Array.isArray(entry)) {
          recurse(entry, inChoice);
        } else if (typeof entry === 'string') {
          if (entry.startsWith('^')) {
            lastText = entry.slice(1).trim();
          }
        } else if (entry && typeof entry === 'object') {
          // 1. choice 分支
          if (typeof entry['*'] === 'string' && /\.c-(\d+)/.test(entry['*'])) {
            const m = /\.c-(\d+)/.exec(entry['*']);
            const idx = m?.[1] || '';
            const choiceObj = arr.find(
              (x) => x && typeof x === 'object' && x[`c-${idx}`]
            ) as any;
            const branch = choiceObj[`c-${idx}`];
            if (Array.isArray(branch)) recurse(branch, true);

          // 2. narrative divert 跳转
          } else if (typeof entry['->'] === 'string') {
            const to = entry['->'];
            // 确保目标存在且不是 global decl
            if (named[to] && to !== 'global decl') {
              const label = lastText || '…';
              if (inChoice) {
                links.push({ source: from, target: to, label });
              } else if (!usedNarrativeDivert) {
                links.push({ source: from, target: to, label });
                usedNarrativeDivert = true;
              }
            }
          }

          // 3. 继续深入其他字段
          Object.values(entry).forEach((v) => {
            if (Array.isArray(v)) recurse(v, inChoice);
          });
        }
      });
    }

    // 安全检查：确保 content 是数组再调用 recurse
    if (Array.isArray(content)) {
      recurse(content, false);
    } else {
      console.warn(`buildStoryGraph: content is not an array for knot "${from}", type: ${typeof content}`);
    }
  });

  return { nodes, links };
}
