import React, { useContext, useState } from 'react';
import { ProjectContext } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import { TitleBar } from './components/TitleBar';
import { Toolbar } from './components/Toolbar';
import { ProjectExplorer } from './components/ProjectExplorer';
import { ActivityBar } from './components/ActivityBar';
import { StatusBar } from './components/StatusBar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { NodeGraph } from './components/NodeGraph';
import { PluginHost } from './components/PluginHost';
import type { SidebarTab } from './types/sidebar';

const AppContent: React.FC = () => {
  const { plugins, activeFile, selectFile, openProject, projectPath } = useContext(ProjectContext)!;
  const [view, setView] = useState<'preview' | 'graph'>('preview');
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [pluginCtx, setPluginCtx] = useState<{
    manifest: any;
    params?: any;
  } | null>(null);

  const getWindowTitle = () => {
    const defaultTitle = 'AVG Master';
    
    // 如果没有项目路径，返回默认标题
    if (!projectPath) {
      return defaultTitle;
    }
    
    const projectName = projectPath.split('/').pop() || defaultTitle;
    
    // 如果没有打开文件，只显示项目名
    if (!activeFile) {
      return projectName;
    }
    
    // 如果有打开文件，显示 "文件名 - 项目名"
    const fileName = activeFile.split('/').pop()?.replace('.ink', '') || 'Untitled';
    return `${fileName} - ${projectName}`;
  };

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {/* 顶部：标题栏 */}
      <div style={{ flexShrink: 0 }}>
        <TitleBar 
          title={getWindowTitle()}
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          sidebarVisible={sidebarVisible}
        />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex">
        {/* 左侧：活动栏 */}
        {sidebarVisible && <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />}

        {/* 侧边栏 */}
        {sidebarVisible && activeTab === 'explorer' && <ProjectExplorer onSelect={selectFile} />}

        {/* 右侧：主区域 */}
        <div className="flex-1 flex flex-col">
          {/* 顶部工具栏 */}
          <Toolbar
            view={view}
            onViewChange={setView}
            onOpenProject={openProject}
            onExportWeb={() => window.inkAPI.exportGame('web')}
            onExportDesktop={() => window.inkAPI.exportGame('desktop')}
          />

          {/* 内容区：分栏布局 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 编辑器区域 */}
            <div
              className="w-2/3 h-full"

              style={{
                borderRight: `1px solid var(--color-border)`,
                backgroundColor: 'var(--color-editorBackground)',
              }}
            >
              <Editor
                filePath={activeFile}
                onRunPlugin={(id, params) => {
                  const manifest = plugins.find((p) => p.id === id);
                  if (manifest) setPluginCtx({ manifest, params });
                }}
              />
            </div>

            {/* 预览 / 节点图 / 插件宿主 */}
            <div
              className="w-1/3 relative"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
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

          {/* 底部状态栏 */}
          <StatusBar filePath={activeFile} />
        </div>
      </div>
    </div>
  );
};

// 使用ThemeProvider包装App
export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
