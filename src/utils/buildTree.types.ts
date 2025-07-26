// src/utils/buildTree.types.ts

/**
 * 剧情分支树节点类型
 * - name: 节点名称（如 knot 名称或 "root"）
 * - children: 子节点数组，若无子节点则为空数组
 */
export interface TreeNode {
  name: string;
  children: TreeNode[];
}