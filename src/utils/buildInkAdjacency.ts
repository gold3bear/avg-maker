// src/utils/buildInkEdges.ts
export interface Edge { source: string; target: string; label: string; }
export function buildInkAdjacency(raw: any): { nodes: {id:string}[]; links: Edge[] } {
  const named = raw.root[2] as Record<string, any[]>;
  const nodes = Object.keys(named).map(id => ({ id }));
  const links: Edge[] = [];
  console.log('=== Named Knots (raw JSON) ===');
  console.log("named: ",Object.keys(named));
  // 对每个 knot 单独跟踪是否已经用了 narrative divert
  Object.entries(named).forEach(([from, content]) => {
    let usedNarrativeDivert = false;  
    // 最近一次的文字，用来当作 label
    let lastText = '';

    function recurse(arr: any[], inChoice: boolean) {
      for (const entry of arr) {
        if (Array.isArray(entry)) {
          // 先把 choice 情况的 inChoice 传递下去
          recurse(entry, inChoice);
        }
        else if (typeof entry === 'string') {
          if (entry.startsWith('^')) {
            // 更新最近一次文字
            lastText = entry.slice(1).trim();
          }
        }
        else if (entry && typeof entry === 'object') {
          // 1) 检测 choice 分支标志 "*":".^.c-0"
          if (typeof entry['*'] === 'string' && /\.c-(\d+)/.test(entry['*'])) {
            const m = /\.c-(\d+)/.exec(entry['*'])!;
            const idx = m[1];
            // 找到同级别里 c-idx 数组
            const choiceObj = (arr.find(x => x && typeof x === 'object' && x[`c-${idx}`]) || {}) as any;
            const branch = choiceObj[`c-${idx}`];
            if (Array.isArray(branch)) {
              // 递归到这个选项分支里，并标记 inChoice=true
              recurse(branch, true);
            }
          }
          // 2) 检测跳转
          else if (typeof entry['->'] === 'string') {
            const to = entry['->'];
            if (named[to]) {
              const label = lastText || '…';
              if (inChoice) {
                // 玩家选择的跳转——**一定**记录
                links.push({ source: from, target: to, label });
              }
              else if (!usedNarrativeDivert) {
                // 第一次在 narrativa 里遇到的跳转——当作故事推进
                links.push({ source: from, target: to, label });
                usedNarrativeDivert = true;
              }
            }
          }

          // 3) 继续深入其他字段
          for (const v of Object.values(entry)) {
            if (Array.isArray(v)) {
              recurse(v, inChoice);
            }
          }
        }
      }
    }

    recurse(content, false);
  });

  return { nodes, links };
}