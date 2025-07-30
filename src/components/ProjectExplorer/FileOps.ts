export const FileOps = {
  async createFile(path: string, name: string) {
    return window.inkAPI.writeFile(`${path}/${name}`, '');
  },
  async createDirectory(path: string, name: string) {
    return window.inkAPI.createDirectory?.(`${path}/${name}`);
  },
  async renameFile(filePath: string, newName: string) {
    return window.inkAPI.renameFile?.(filePath, newName);
  },
  async deleteFile(filePath: string) {
    return window.inkAPI.deleteFile?.(filePath);
  },
  async moveFile(src: string, dest: string) {
    return window.inkAPI.moveFile?.(src, dest);
  },
  async moveToDirectory(sourcePath: string, targetDirectoryPath: string) {
    const fileName = sourcePath.split('/').pop() || '';
    const newPath = `${targetDirectoryPath}/${fileName}`;
    return window.inkAPI.moveFile?.(sourcePath, newPath);
  },
  async showInExplorer(filePath: string) {
    return window.inkAPI.showInExplorer?.(filePath);
  },
  async copyFile(sourcePath: string, targetPath: string) {
    return window.inkAPI.copyFile?.(sourcePath, targetPath);
  }
};
