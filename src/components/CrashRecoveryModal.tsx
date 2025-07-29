import React, { useState } from 'react';
import { AlertTriangle, FileText, RotateCcw, X, CheckCircle } from 'lucide-react';
import type { AppState, FileBackup } from '../utils/crashRecovery';

interface CrashRecoveryModalProps {
  isOpen: boolean;
  appState?: AppState;
  fileBackups?: Record<string, FileBackup>;
  onRestore: (restoreFiles: boolean, restoreProject: boolean) => void;
  onDismiss: () => void;
}

export const CrashRecoveryModal: React.FC<CrashRecoveryModalProps> = ({
  isOpen,
  appState,
  fileBackups = {},
  onRestore,
  onDismiss,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
    new Set(Object.keys(fileBackups))
  );
  const [restoreProject, setRestoreProject] = useState(true);

  if (!isOpen) return null;

  const fileBackupArray = Object.values(fileBackups);
  const hasFiles = fileBackupArray.length > 0;
  const hasProject = appState?.projectPath || appState?.activeFile;

  const toggleFile = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  const handleRestore = () => {
    onRestore(selectedFiles.size > 0, restoreProject);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle 
              size={24} 
              className="text-orange-500"
            />
            <div>
              <h2 
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                检测到程序异常退出
              </h2>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-textMuted)' }}
              >
                发现了上次会话的恢复数据，您要恢复吗？
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} style={{ color: 'var(--color-text)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-96">
          {/* Project State */}
          {hasProject && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="restore-project"
                  checked={restoreProject}
                  onChange={(e) => setRestoreProject(e.target.checked)}
                  className="rounded"
                />
                <label 
                  htmlFor="restore-project" 
                  className="font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  恢复项目状态
                </label>
              </div>
              <div 
                className="ml-6 p-3 rounded border"
                style={{ 
                  backgroundColor: 'var(--color-secondary)',
                  borderColor: 'var(--color-border)'
                }}
              >
                {appState?.projectPath && (
                  <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
                    <strong>项目路径:</strong> {appState.projectPath}
                  </p>
                )}
                {appState?.activeFile && (
                  <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
                    <strong>打开文件:</strong> {getFileName(appState.activeFile)}
                  </p>
                )}
                <p className="text-sm" style={{ color: 'var(--color-textMuted)' }}>
                  <strong>保存时间:</strong> {formatTime(appState?.timestamp || 0)}
                </p>
              </div>
            </div>
          )}

          {/* File Backups */}
          {hasFiles && (
            <div className="space-y-3">
              <h3 
                className="font-medium flex items-center space-x-2"
                style={{ color: 'var(--color-text)' }}
              >
                <FileText size={16} />
                <span>未保存的文件更改 ({fileBackupArray.length})</span>
              </h3>
              
              <div className="space-y-2">
                {fileBackupArray.map((backup) => (
                  <div
                    key={backup.filePath}
                    className="flex items-start space-x-3 p-3 rounded border"
                    style={{ 
                      backgroundColor: 'var(--color-secondary)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <input
                      type="checkbox"
                      id={`file-${backup.filePath}`}
                      checked={selectedFiles.has(backup.filePath)}
                      onChange={() => toggleFile(backup.filePath)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={`file-${backup.filePath}`}
                        className="font-medium cursor-pointer"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {getFileName(backup.filePath)}
                      </label>
                      <p className="text-sm truncate" style={{ color: 'var(--color-textMuted)' }}>
                        {backup.filePath}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                        备份时间: {formatTime(backup.lastModified)}
                      </p>
                    </div>
                    <CheckCircle 
                      size={16} 
                      className={`mt-1 ${
                        selectedFiles.has(backup.filePath) 
                          ? 'text-green-500' 
                          : 'text-gray-300'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {fileBackupArray.length > 1 && (
                <div className="flex space-x-2 text-sm">
                  <button
                    onClick={() => setSelectedFiles(new Set(Object.keys(fileBackups)))}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    全选
                  </button>
                  <span style={{ color: 'var(--color-textMuted)' }}>|</span>
                  <button
                    onClick={() => setSelectedFiles(new Set())}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    全不选
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div 
            className="p-3 rounded border-l-4 border-orange-400"
            style={{ backgroundColor: 'rgba(255, 165, 0, 0.1)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              <strong>注意:</strong> 恢复操作将覆盖磁盘上的对应文件。请确保您要恢复的更改是正确的。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-end space-x-3 p-6 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
            style={{ 
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            放弃恢复
          </button>
          <button
            onClick={handleRestore}
            disabled={!restoreProject && selectedFiles.size === 0}
            className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <RotateCcw size={16} />
            <span>恢复选中项</span>
          </button>
        </div>
      </div>
    </div>
  );
};