export const FileOps = {
  async createFile(path: string, name: string) {
    return window.inkAPI.writeFile(`${path}/${name}`, '');
  },
  async renameFile(filePath: string, newName: string) {
    return window.inkAPI.renameFile?.(filePath, newName);
  },
  async deleteFile(filePath: string) {
    return window.inkAPI.deleteFile?.(filePath);
  },
  async moveFile(src: string, dest: string) {
    return window.inkAPI.moveFile?.(src, dest);
  }
};
