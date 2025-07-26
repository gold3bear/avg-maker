// src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Story } from 'inkjs';
import DOMPurify from 'dompurify';
import ForceGraph2D from 'react-force-graph-2d';
import { buildInkAdjacency } from './utils/buildInkAdjacency';
import type { GraphData, LinkObject, NodeObject } from 'react-force-graph-2d';

interface InkChoice {
  index: number;
  text: string;
}

interface HistoryEntry {
  state: string;
  lines: string[];
  choices: InkChoice[];
}
const containerStyles: React.CSSProperties = {
  width: '100%',
  height: '100vh',
};

const App: React.FC = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [choices, setChoices] = useState<InkChoice[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [treeData, setTreeData] = useState<GraphData | null>(null);
  const treeContainer = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  // 加载故事
  useEffect(() => {
    fetch('/story.json')
      .then(res => res.json())
      .then(json => {
        const inkStory = new Story(json);
        // 打印所有命名容器的 key
        // console.log('Story loaded:', inkStory);
        setStory(inkStory);
        advanceAndRecord(inkStory);
        console.log(JSON.stringify(inkStory.state.toJson(), null, 2));
        const adj = buildInkAdjacency(json);
        console.log("JSON:", json);
        console.log("named", adj);
        console.log("Graph Data:", adj);
        console.log("DATA", adj)
        setTreeData(adj);
      })
      .catch(console.error);
  }, []);

  // 推进故事并记录历史
  const advanceAndRecord = (inkStory: Story) => {
    // 收集文本
    const newLines: string[] = [];
    while (inkStory.canContinue) {
      newLines.push(inkStory.Continue().trim());
    }
    // 收集选项
    const newChoices: InkChoice[] = inkStory.currentChoices.map(c => ({
      index: c.index,
      text: c.text.trim(),
    }));
    setLines(newLines);
    setChoices(newChoices);

    // 记录历史：截断“未来”分支，追加当前状态
    const entry: HistoryEntry = {
      state: inkStory.state.toJson(),
      lines: newLines,
      choices: newChoices,
    };
    setHistory(prev => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, entry];
    });
    setHistoryIndex(prev => prev + 1);
  };

  // 玩家做出选择
  const choose = (choiceIndex: number) => {
    if (!story) return;
    story.ChooseChoiceIndex(choiceIndex);
    advanceAndRecord(story);
  };

  // 回到上一条历史
  const goBack = () => {
    if (!story || historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    const entry = history[prevIndex];
    story.state.LoadJson(entry.state);
    setLines(entry.lines);
    setChoices(entry.choices);
    setHistoryIndex(prevIndex);
  };

  // 前进到下一条历史
  const goForward = () => {
    if (!story || historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];
    story.state.LoadJson(entry.state);
    setLines(entry.lines);
    setChoices(entry.choices);
    setHistoryIndex(nextIndex);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">

      {/* 左侧：对话面板，固定宽度 400px */}
      <div className="w-[400px] h-full flex flex-col p-8 bg-gray-900">
        <h1 className="text-4xl font-bold mb-6 text-center">《智子连线》演示</h1>

        {/* 上一页 / 下一页 控制 */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
            onClick={goBack}
            disabled={historyIndex <= 1}
          >
            ← 后退
          </button>
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
          >
            前进 →
          </button>
        </div>

        {/* 对话区 */}
        <div className="ink-content flex-1 overflow-y-auto space-y-6">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line) }}
            />
          ))}
        </div>

        {/* 选项区 */}
        <div className="mt-6 flex flex-col space-y-4">
          {choices.map(c => (
            <button
              key={c.index}
              className="
            block w-full text-left
            bg-blue-600 hover:bg-blue-700
            transition-colors duration-150
            text-white py-3 px-4 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-400
          "
              onClick={() => choose(c.index)}
            >
              {c.text}
            </button>
          ))}
        </div>
      </div>

      {/* 右侧：树图面板，剩余宽度自动撑满 */}
      {treeData && (
        <div
          className="flex-1 h-full bg-gray-200 p-4 overflow-hidden"
          ref={treeContainer}
        >
          <ForceGraph2D
            ref={fgRef}
            graphData={treeData}
            nodeAutoColorBy="id"
            nodeLabel={d => `${d.id}`}
            linkLabel= "label"
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={() => '#888'}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            width={window.innerWidth - 400}
            height={window.innerHeight}
          />
        </div>
      )}
    </div>

  );
};

export default App;
