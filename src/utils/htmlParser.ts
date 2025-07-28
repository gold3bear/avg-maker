// src/utils/htmlParser.ts
// 安全的HTML内容解析工具

/**
 * 允许的HTML标签白名单
 */
// const ALLOWED_TAGS = new Set([
//   'b', 'strong', 'i', 'em', 'u', 'span', 'br', 'p', 'div',
//   'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'mark', 'small', 'sub', 'sup'
// ]);

/**
 * 允许的HTML属性白名单
 */
// const ALLOWED_ATTRIBUTES = new Set([
//   'class', 'style', 'id', 'title'
// ]);

/**
 * 清理和验证HTML内容，移除危险标签和属性
 */
export function sanitizeHTML(html: string): string {
  // 移除script、style等危险标签
  const cleaned = html.replace(/<(script|style|link|meta|iframe|object|embed)[^>]*>.*?<\/\1>/gi, '');
  
  // 移除on事件属性
  const noEvents = cleaned.replace(/\s+on\w+="[^"]*"/gi, '');
  
  return noEvents;
}

/**
 * 解析文本中的简单标记为HTML
 * 支持：*粗体*、_斜体_、**强调**、__下划线__
 */
export function parseTextMarkup(text: string): string {
  return text
    // 粗体 **text** 或 *text*
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<b>$1</b>')
    // 斜体 _text_
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // 下划线 __text__
    .replace(/__(.*?)__/g, '<u>$1</u>')
    // 换行符
    .replace(/\n/g, '<br />');
}

/**
 * 检测文本类型（旁白、对话、系统提示等）
 */
export function detectTextType(text: string): 'narration' | 'dialogue' | 'system' | 'choice' {
  const trimmed = text.trim();
  
  // 对话检测：以引号开头或包含"说"、"问"等动词
  if (/^["「『"]/.test(trimmed) || /["「『"].*?["」』"]/.test(trimmed)) {
    return 'dialogue';
  }
  
  // 系统提示检测：括号内容或特定格式
  if (/^\[.*\]$/.test(trimmed) || /^（.*）$/.test(trimmed)) {
    return 'system';
  }
  
  // 选择项检测：数字开头或特定标记
  if (/^\d+\./.test(trimmed) || /^[>→]/.test(trimmed)) {
    return 'choice';
  }
  
  // 默认为旁白
  return 'narration';
}

/**
 * 为不同类型的文本应用样式类
 */
export function getTextTypeClassName(type: ReturnType<typeof detectTextType>): string {
  switch (type) {
    case 'dialogue':
      return 'text-dialogue';
    case 'system':
      return 'text-system';
    case 'choice':
      return 'text-choice';
    default:
      return 'text-narration';
  }
}

/**
 * 处理文本内容，解析标记并应用样式
 */
export function processTextContent(text: string) {
  const textType = detectTextType(text);
  const htmlContent = parseTextMarkup(sanitizeHTML(text));
  const className = getTextTypeClassName(textType);
  
  return {
    htmlContent,
    textType,
    className
  };
}