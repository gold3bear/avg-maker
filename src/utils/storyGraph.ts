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
  // inklecate 输出的原始结构中，root[2] 存储所有 knot 的内容
  const named = raw.root[2] as Record<string, any[]>;
  const nodes: GraphNode[] = Object.keys(named).map((id) => ({ id }));
  const links: GraphLink[] = [];

  Object.entries(named).forEach(([from, content]) => {
    let usedNarrativeDivert = false;
    let lastText = '';

    function recurse(arr: any[], inChoice: boolean) {
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
            if (named[to]) {
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

    recurse(content, false);
  });

  return { nodes, links };
}
