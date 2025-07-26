import React, { useContext, useState } from 'react';
import { ProjectContext } from './context/ProjectContext';
import { Toolbar } from './components/Toolbar';
import { ProjectExplorer } from './components/ProjectExplorer';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { NodeGraph } from './components/NodeGraph';
import { PluginHost } from './components/PluginHost';

export const App: React.FC = () => {
  const { plugins } = useContext(ProjectContext)!;
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [view, setView] = useState<'preview' | 'graph'>('preview');
  const [pluginCtx, setPluginCtx] = useState<{
    manifest: any;
    params?: any;
  } | null>(null);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 左侧：项目文件树 */}
      <ProjectExplorer onSelect={setActiveFile} />

      {/* 右侧：主区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <Toolbar
          view={view}
          onViewChange={setView}
          onOpenProject={() =>
            window.inkAPI.openProject().then((path: string | null) => {
              // openProject returns a directory path, don't set it as activeFile
              // activeFile should only be set when user selects a file from ProjectExplorer
              if (path) {
                // Just trigger the project load, don't set activeFile to directory
                setActiveFile(null);
              }
            })
          }
          onExportWeb={() => window.inkAPI.exportGame('web')}
          onExportDesktop={() => window.inkAPI.exportGame('desktop')}
        />

        {/* 内容区：分栏布局 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 编辑器区域 */}
          <div className="w-1/3 h-full border-r bg-white">
            <Editor
              filePath={activeFile}
              onRunPlugin={(id, params) => {
                const manifest = plugins.find((p) => p.id === id);
                if (manifest) setPluginCtx({ manifest, params });
              }}
            />
          </div>

          {/* 预览 / 节点图 / 插件宿主 */}
          <div className="flex-1 relative">
            {pluginCtx ? (
              <PluginHost
                plugin={pluginCtx.manifest}
                params={pluginCtx.params}
                onClose={() => setPluginCtx(null)}
              />
            ) : view === 'graph' ? (
              <NodeGraph filePath={activeFile} />
            ) : (
              <Preview filePath={activeFile} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
