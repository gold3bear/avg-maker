import React, { useState } from 'react';
import { AlertTriangle, Save, FileText, X } from 'lucide-react';
import type { FileStatus } from '../context/SaveContext';

interface SaveConfirmDialogProps {
  isOpen: boolean;
  unsavedFiles: FileStatus[];
  onSave: () => Promise<void>;
  onDontSave: () => void;
  onCancel: () => void;
}

export const SaveConfirmDialog: React.FC<SaveConfirmDialogProps> = ({
  isOpen,
  unsavedFiles,
  onSave,
  onDontSave,
  onCancel,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return '从未保存';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle 
              size={20} 
              className="text-orange-500"
            />
            <h2 
              className="text-lg font-semibold"
              style={{ color: 'var(--color-text)' }}
            >
              保存更改
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={isSaving}
          >
            <X size={16} style={{ color: 'var(--color-text)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p 
            className="text-sm mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            以下文件有未保存的更改，您要保存这些更改吗？
          </p>

          {/* File List */}
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {unsavedFiles.map((file) => (
              <div
                key={file.filePath}
                className="flex items-start space-x-3 p-2 rounded border"
                style={{ 
                  backgroundColor: 'var(--color-secondary)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <FileText size={16} className="mt-0.5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p 
                    className="font-medium truncate"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {getFileName(file.filePath)}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-textMuted)' }}>
                    {file.filePath}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                    最后保存: {formatTime(file.lastSaved)}
                  </p>
                </div>
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" title="未保存的更改" />
              </div>
            ))}
          </div>

          {/* Warning */}
          <div 
            className="p-3 rounded border-l-4 border-orange-400 mb-4"
            style={{ backgroundColor: 'rgba(255, 165, 0, 0.1)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              如果您选择不保存，这些更改将会丢失。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-end space-x-2 p-4 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm rounded border hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            style={{ 
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            取消
          </button>
          
          <button
            onClick={onDontSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            不保存
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>保存全部</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};