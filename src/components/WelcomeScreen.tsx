// 欢迎页面组件 - 类似VS Code的欢迎界面
import React, { useState, useEffect } from 'react';
import { appStartupManager } from '../utils/AppStartupManager';

interface WelcomeScreenProps {
  onCreateProject: () => void;
  onOpenProject: (projectPath?: string) => void;
  onSkip: () => void;
}

interface WelcomeContent {
  title: string;
  subtitle: string;
  showRecentProjects: boolean;
  recentProjects: string[];
}

export function WelcomeScreen({ onCreateProject, onOpenProject, onSkip }: WelcomeScreenProps) {
  const [welcomeContent, setWelcomeContent] = useState<WelcomeContent>({
    title: '加载中...',
    subtitle: '',
    showRecentProjects: false,
    recentProjects: []
  });

  useEffect(() => {
    const content = appStartupManager.getWelcomeContent();
    setWelcomeContent(content);
  }, []);

  const handleRecentProjectClick = (projectPath: string) => {
    console.log('📁 WelcomeScreen: 打开最近项目:', projectPath);
    onOpenProject(projectPath);
  };

  const handleCreateProject = () => {
    console.log('🆕 WelcomeScreen: 创建新项目');
    onCreateProject();
  };

  const handleOpenProject = () => {
    console.log('📂 WelcomeScreen: 选择项目文件夹');
    onOpenProject();
  };

  const handleSkip = () => {
    console.log('⏭️ WelcomeScreen: 跳过欢迎页面');
    onSkip();
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl w-full px-8 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-4">
            {welcomeContent.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {welcomeContent.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 开始区域 */}
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
              开始
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={handleCreateProject}
                className="flex items-center w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">创建新项目</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">开始一个全新的互动小说项目</div>
                </div>
              </button>

              <button
                onClick={handleOpenProject}
                className="flex items-center w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
              >
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 1v6m8 0V1" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">打开项目文件夹</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">打开现有的项目文件夹</div>
                </div>
              </button>

              <button
                onClick={handleSkip}
                className="flex items-center w-full p-4 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
              >
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">跳过并进入编辑器</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">直接进入编辑界面</div>
                </div>
              </button>
            </div>
          </div>

          {/* 最近项目区域 */}
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
              最近项目
            </h2>
            
            {welcomeContent.showRecentProjects && welcomeContent.recentProjects.length > 0 ? (
              <div className="space-y-2">
                {welcomeContent.recentProjects.slice(0, 5).map((projectPath, index) => {
                  const projectName = projectPath.split('/').pop() || projectPath;
                  return (
                    <button
                      key={index}
                      onClick={() => handleRecentProjectClick(projectPath)}
                      className="flex items-center w-full p-3 text-left bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
                    >
                      <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded flex items-center justify-center mr-3 group-hover:bg-orange-200 dark:group-hover:bg-orange-800">
                        <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 1v6m8 0V1" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {projectName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {projectPath}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 1v6m8 0V1" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  {welcomeContent.title.includes('欢迎使用') ? '开始创建你的第一个项目' : '暂无最近项目'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 底部链接 */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              📚 查看文档
            </a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              🎯 示例项目
            </a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              💡 快速入门
            </a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              🐛 反馈问题
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}