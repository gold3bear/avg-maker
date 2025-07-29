// src/context/SaveContext.tsx
// 文件保存状态管理上下文

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FileStatus {
  filePath: string;
  isDirty: boolean; // 是否有未保存的更改
  lastSaved: number; // 最后保存时间戳
  originalContent: string; // 原始内容（用于比较）
  currentContent: string; // 当前内容
}

interface SaveContextValue {
  // 文件状态
  fileStatuses: Record<string, FileStatus>;
  
  // 检查是否有未保存的文件
  hasUnsavedChanges: () => boolean;
  
  // 获取未保存的文件列表
  getUnsavedFiles: () => FileStatus[];
  
  // 标记文件为脏状态（有未保存更改）
  markFileAsDirty: (filePath: string, content: string) => void;
  
  // 标记文件为已保存
  markFileAsSaved: (filePath: string, content?: string) => void;
  
  // 设置文件原始内容
  setFileOriginalContent: (filePath: string, content: string) => void;
  
  // 移除文件状态
  removeFileStatus: (filePath: string) => void;
  
  // 获取特定文件的状态
  getFileStatus: (filePath: string) => FileStatus | null;
  
  // 保存所有未保存的文件
  saveAllFiles: () => Promise<boolean>;
  
  // 保存特定文件
  saveFile: (filePath: string) => Promise<boolean>;
}

const SaveContext = createContext<SaveContextValue | null>(null);

export const useSave = () => {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error('useSave must be used within a SaveProvider');
  }
  return context;
};

interface SaveProviderProps {
  children: React.ReactNode;
}

export const SaveProvider: React.FC<SaveProviderProps> = ({ children }) => {
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});

  const hasUnsavedChanges = useCallback(() => {
    const result = Object.values(fileStatuses).some(status => status.isDirty);
    console.log('🔍 SaveContext: hasUnsavedChanges() 被调用，结果:', result);
    console.log('🔍 SaveContext: 当前文件状态统计:', {
      总文件数: Object.keys(fileStatuses).length,
      脏文件数: Object.values(fileStatuses).filter(s => s.isDirty).length,
      脏文件列表: Object.values(fileStatuses).filter(s => s.isDirty).map(s => s.filePath)
    });
    return result;
  }, [fileStatuses]);

  const getUnsavedFiles = useCallback(() => {
    const unsavedFiles = Object.values(fileStatuses).filter(status => status.isDirty);
    console.log('🔍 SaveContext: getUnsavedFiles() 被调用');
    console.log('🔍 SaveContext: 所有文件状态:', Object.keys(fileStatuses).map(path => ({
      path,
      isDirty: fileStatuses[path].isDirty,
      lastSaved: new Date(fileStatuses[path].lastSaved).toISOString()
    })));
    console.log('🔍 SaveContext: 返回未保存文件数量:', unsavedFiles.length);
    return unsavedFiles;
  }, [fileStatuses]);

  const markFileAsDirty = useCallback((filePath: string, content: string) => {
    setFileStatuses(prev => {
      const existing = prev[filePath];
      const isDirty = existing ? content !== existing.originalContent : true;
      
      return {
        ...prev,
        [filePath]: {
          filePath,
          isDirty,
          lastSaved: existing?.lastSaved || 0,
          originalContent: existing?.originalContent || content,
          currentContent: content,
        }
      };
    });
  }, []);

  const markFileAsSaved = useCallback((filePath: string, content?: string) => {
    console.log('💾 SaveContext: markFileAsSaved() 被调用，文件:', filePath);
    setFileStatuses(prev => {
      const existing = prev[filePath];
      if (!existing && !content) {
        console.log('💾 SaveContext: 跳过保存标记，文件不存在且无内容');
        return prev;
      }

      const finalContent = content || existing?.currentContent || '';
      console.log('💾 SaveContext: 标记文件为已保存，内容长度:', finalContent.length);
      
      return {
        ...prev,
        [filePath]: {
          filePath,
          isDirty: false,
          lastSaved: Date.now(),
          originalContent: finalContent,
          currentContent: finalContent,
        }
      };
    });
  }, []);

  const setFileOriginalContent = useCallback((filePath: string, content: string) => {
    setFileStatuses(prev => ({
      ...prev,
      [filePath]: {
        filePath,
        isDirty: false,
        lastSaved: Date.now(),
        originalContent: content,
        currentContent: content,
      }
    }));
  }, []);

  const removeFileStatus = useCallback((filePath: string) => {
    setFileStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[filePath];
      return newStatuses;
    });
  }, []);

  const getFileStatus = useCallback((filePath: string) => {
    return fileStatuses[filePath] || null;
  }, [fileStatuses]);

  const saveFile = useCallback(async (filePath: string): Promise<boolean> => {
    try {
      const status = fileStatuses[filePath];
      if (!status || !status.isDirty) {
        return true; // 文件已经是最新的
      }

      await window.inkAPI.writeFile(filePath, status.currentContent);
      markFileAsSaved(filePath, status.currentContent);
      
      console.log(`✅ 文件已保存: ${filePath}`);
      return true;
    } catch (error) {
      console.error('保存文件失败:', error);
      return false;
    }
  }, [fileStatuses, markFileAsSaved]);

  const saveAllFiles = useCallback(async (): Promise<boolean> => {
    const unsavedFiles = getUnsavedFiles();
    if (unsavedFiles.length === 0) {
      return true;
    }

    try {
      const savePromises = unsavedFiles.map(status => saveFile(status.filePath));
      const results = await Promise.all(savePromises);
      
      return results.every(result => result);
    } catch (error) {
      console.error('批量保存文件失败:', error);
      return false;
    }
  }, [getUnsavedFiles, saveFile]);

  const contextValue: SaveContextValue = {
    fileStatuses,
    hasUnsavedChanges,
    getUnsavedFiles,
    markFileAsDirty,
    markFileAsSaved,
    setFileOriginalContent,
    removeFileStatus,
    getFileStatus,
    saveAllFiles,
    saveFile,
  };

  return (
    <SaveContext.Provider value={contextValue}>
      {children}
    </SaveContext.Provider>
  );
};