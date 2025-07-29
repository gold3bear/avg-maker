import { useState } from 'react';
import AIChatPanel from './AIChatPanel';

export default function AVGMakerPages() {
  const [aiPanelOpen, setAiPanelOpen] = useState(true);

  return (
    <div className="h-screen bg-gray-900 flex">
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-white mb-4">AVG Maker 页面组件演示</h1>
        <p className="text-gray-400 mb-8">
          展示 AIChatPanel、AIMessage 和 QuickActions 组件的功能
        </p>

        <button
          onClick={() => setAiPanelOpen(!aiPanelOpen)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          {aiPanelOpen ? '隐藏' : '显示'} AI 面板
        </button>
      </div>
      
      <AIChatPanel 
        isOpen={aiPanelOpen}
        onToggle={() => setAiPanelOpen(!aiPanelOpen)}
        projectContext={{ currentFile: 'main.ink', projectName: 'Mystery Manor' }}
      />
    </div>
  );
}