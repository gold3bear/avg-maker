import React, { useContext, useState } from 'react';
import { ProjectContext } from '../../../context/ProjectContext';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { EmptyState } from '../shared/EmptyState';
import { FileTree } from './FileTree';
import { FileOps } from '../FileOps';
import { ContextMenu } from './ContextMenu';
import type { FileNode } from '../../../context/ProjectContext';

interface FilesPanelProps {
  onFileSelect: (filePath: string) => void;
}

export const FilesPanel: React.FC<FilesPanelProps> = ({ onFileSelect }) => {
  const projectContext = useContext(ProjectContext);
  const [showCreateInput, setShowCreateInput] = useState<{
    type: 'file' | 'folder';
    parentPath: string;
  } | null>(null);
  const [createName, setCreateName] = useState('');
  const [showRenameInput, setShowRenameInput] = useState<{
    path: string;
    originalName: string;
  } | null>(null);
  const [renameName, setRenameName] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [rootDropHover, setRootDropHover] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetNode: FileNode | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetNode: null
  });
  const [clipboard, setClipboard] = useState<{
    path: string;
    operation: 'copy' | 'cut';
  } | null>(null);

  if (!projectContext) {
    throw new Error('FilesPanel must be used within ProjectProvider');
  }

  const { fileTree, projectPath, refreshFileTree } = projectContext;

  const handleCreateFile = () => {
    if (!projectPath) return;
    setShowCreateInput({ type: 'file', parentPath: projectPath });
    setCreateName('');
  };

  const handleCreateFolder = () => {
    if (!projectPath) return;
    setShowCreateInput({ type: 'folder', parentPath: projectPath });
    setCreateName('');
  };

  const handleConfirmCreate = async () => {
    if (!showCreateInput || !createName.trim()) return;
    
    try {
      if (showCreateInput.type === 'file') {
        const fileName = createName.endsWith('.ink') ? createName : `${createName}.ink`;
        await FileOps.createFile(showCreateInput.parentPath, fileName);
      } else {
        await FileOps.createDirectory(showCreateInput.parentPath, createName);
      }
      
      // 刷新文件树
      await refreshFileTree();
      
      setShowCreateInput(null);
      setCreateName('');
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateInput(null);
    setCreateName('');
  };

  const handleMove = async (sourcePath: string, targetPath: string) => {
    try {
      console.log('🔄 FilesPanel: 移动文件/文件夹', { sourcePath, targetPath });
      await FileOps.moveToDirectory(sourcePath, targetPath);
      // 刷新文件树
      await refreshFileTree();
    } catch (error) {
      console.error('移动操作失败:', error);
    }
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    if (projectPath) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setRootDropHover(true);
    }
  };

  const handleRootDragLeave = () => {
    setRootDropHover(false);
  };

  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setRootDropHover(false);
    if (projectPath) {
      const sourcePath = e.dataTransfer.getData('text/plain');
      if (sourcePath) {
        await handleMove(sourcePath, projectPath);
      }
    }
  };

  const handleManualRefresh = async () => {
    console.log('🔄 FilesPanel: 手动刷新文件树');
    await refreshFileTree();
  };

  const handleToggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  // 右键菜单处理函数
  const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetNode: node
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleShowInExplorer = async (path: string) => {
    try {
      const result = await FileOps.showInExplorer(path);
      if (!result?.success) {
        console.error('显示文件失败:', result?.error);
      }
    } catch (error) {
      console.error('显示文件失败:', error);
    }
  };

  const handleCopy = (path: string) => {
    setClipboard({ path, operation: 'copy' });
    console.log('📋 已复制:', path);
  };

  const handleCut = (path: string) => {
    setClipboard({ path, operation: 'cut' });
    console.log('✂️ 已剪切:', path);
  };

  const handleRename = (path: string) => {
    const fileName = path.split('/').pop() || '';
    setShowRenameInput({ path, originalName: fileName });
    setRenameName(fileName);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleConfirmRename = async () => {
    if (!showRenameInput || !renameName.trim()) return;
    
    try {
      const parentPath = showRenameInput.path.substring(0, showRenameInput.path.lastIndexOf('/'));
      const newPath = `${parentPath}/${renameName}`;
      
      await FileOps.renameFile(showRenameInput.path, renameName);
      await refreshFileTree();
      
      setShowRenameInput(null);
      setRenameName('');
      console.log('✏️ 重命名成功:', showRenameInput.path, '->', newPath);
    } catch (error) {
      console.error('重命名失败:', error);
    }
  };

  const handleCancelRename = () => {
    setShowRenameInput(null);
    setRenameName('');
  };

  const handlePaste = async (targetPath: string) => {
    if (!clipboard) return;
    
    try {
      const fileName = clipboard.path.split('/').pop() || '';
      const newPath = `${targetPath}/${fileName}`;
      
      if (clipboard.operation === 'copy') {
        await FileOps.copyFile(clipboard.path, newPath);
        console.log('📋 已复制:', clipboard.path, '->', newPath);
      } else if (clipboard.operation === 'cut') {
        await FileOps.moveFile(clipboard.path, newPath);
        console.log('✂️ 已剪切:', clipboard.path, '->', newPath);
        setClipboard(null); // 剪切后清除剪贴板
      }
      
      await refreshFileTree();
    } catch (error) {
      console.error('粘贴失败:', error);
    }
  };

  const handleDelete = async (path: string) => {
    if (window.confirm(`确定要删除 "${path.split('/').pop()}" 吗？`)) {
      try {
        await FileOps.deleteFile(path);
        await refreshFileTree();
        console.log('🗑️ 已删除:', path);
      } catch (error) {
        console.error('删除失败:', error);
      }
    }
  };

  const headerActions = projectPath ? (
    <div className="flex items-center gap-1">
      <button
        title="新建文件"
        className="p-1 rounded hover:bg-gray-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          handleCreateFile();
        }}
        style={{ color: 'var(--color-textSecondary)' }}
      >
        📄
      </button>
      <button
        title="新建文件夹"
        className="p-1 rounded hover:bg-gray-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          handleCreateFolder();
        }}
        style={{ color: 'var(--color-textSecondary)' }}
      >
        📁
      </button>
      <button
        title="刷新文件树"
        className="p-1 rounded hover:bg-gray-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          handleManualRefresh();
        }}
        style={{ color: 'var(--color-textSecondary)' }}
      >
        🔄
      </button>
    </div>
  ) : undefined;

  return (
    <CollapsibleSection
      title="Files"
      storageKey="files"
      defaultExpanded={true}
      headerActions={headerActions}
      stickyZIndex={30}
    >
      {/* 创建文件/文件夹输入框 */}
      {showCreateInput && (
        <div className="px-2 py-2 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-textSecondary)' }}>
              {showCreateInput.type === 'file' ? '📄' : '📁'}
            </span>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={showCreateInput.type === 'file' ? '文件名.ink' : '文件夹名'}
              className="flex-1 px-2 py-1 text-xs rounded"
              style={{
                backgroundColor: 'var(--color-inputBackground)',
                border: `1px solid var(--color-inputBorder)`,
                color: 'var(--color-inputForeground)',
              }}
              autoFocus
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isComposing) {
                  handleConfirmCreate();
                } else if (e.key === 'Escape') {
                  handleCancelCreate();
                }
              }}
            />
            <button
              onClick={handleConfirmCreate}
              className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              ✓
            </button>
            <button
              onClick={handleCancelCreate}
              className="px-2 py-1 text-xs rounded bg-gray-600 text-white hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 重命名输入框 */}
      {showRenameInput && (
        <div className="px-2 py-2 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-textSecondary)' }}>
              ✏️
            </span>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="新文件名"
              className="flex-1 px-2 py-1 text-xs rounded"
              style={{
                backgroundColor: 'var(--color-inputBackground)',
                border: `1px solid var(--color-inputBorder)`,
                color: 'var(--color-inputForeground)',
              }}
              autoFocus
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isComposing) {
                  handleConfirmRename();
                } else if (e.key === 'Escape') {
                  handleCancelRename();
                }
              }}
            />
            <button
              onClick={handleConfirmRename}
              className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              ✓
            </button>
            <button
              onClick={handleCancelRename}
              className="px-2 py-1 text-xs rounded bg-gray-600 text-white hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!projectPath ? (
        <EmptyState
          icon="📁"
          message="未打开项目"
        />
      ) : fileTree.length === 0 ? (
        <EmptyState
          icon="📄"
          message="项目中没有文件"
        />
      ) : (
        <div 
          className="px-2"
          style={{
            backgroundColor: rootDropHover ? 'var(--color-highlight)' : 'transparent',
            border: rootDropHover ? '1px dashed var(--color-textSecondary)' : 'none',
            minHeight: '20px'
          }}
          onDragOver={handleRootDragOver}
          onDragLeave={handleRootDragLeave}
          onDrop={handleRootDrop}
        >
          <FileTree 
            nodes={fileTree} 
            onSelect={onFileSelect}
            onMove={handleMove}
            expandedDirs={expandedDirs}
            onToggleExpanded={handleToggleExpanded}
            onContextMenu={handleContextMenu}
          />
        </div>
      )}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        targetNode={contextMenu.targetNode}
        onClose={handleCloseContextMenu}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onShowInExplorer={handleShowInExplorer}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onRename={handleRename}
        onDelete={handleDelete}
        hasClipboard={!!clipboard}
      />
    </CollapsibleSection>
  );
};