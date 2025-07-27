// src/utils/inkValidator.ts
// 移除所有前端语法检测逻辑，完全依赖inklecate后端反馈

import type { Marker } from '../context/InkContext';

export interface InkValidationRule {
  name: string;
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// 移除所有前端自定义语法规则 - 完全依赖inklecate后端反馈
// 为了更好的用户体验，避免与inklecate不一致的检测结果
export const inkValidationRules: InkValidationRule[] = [];

// 移除前端语法检测 - 完全依赖inklecate后端反馈
// 前端只负责解析和显示后端返回的错误信息
export function validateInkSyntax(_content: string): Marker[] {
  // 不再进行前端语法检测，直接返回空数组
  // 所有错误都通过InkContext中的inklecate编译结果获得
  return [];
}