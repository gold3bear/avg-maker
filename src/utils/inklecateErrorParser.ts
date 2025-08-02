// src/utils/inklecateErrorParser.ts
// 专门解析inklecate编译器错误输出的工具

import type { Marker } from '../context/InkContext';

export interface InklecateError {
  type: 'ERROR' | 'WARNING';
  file: string;
  line: number;
  column?: number;
  message: string;
  code?: string;
}

// inklecate错误输出的各种格式模式
const ERROR_PATTERNS = [
  // 标准格式: "ERROR: 'filename' line 42: Error message"
  {
    pattern: /^(ERROR|WARNING):\s*'([^']+)'\s*line\s*(\d+):\s*(.+)$/,
    groups: { type: 1, file: 2, line: 3, message: 4 }
  },
  // 带列号格式: "ERROR: 'filename' line 42, column 15: Error message"
  {
    pattern: /^(ERROR|WARNING):\s*'([^']+)'\s*line\s*(\d+),?\s*column\s*(\d+):\s*(.+)$/,
    groups: { type: 1, file: 2, line: 3, column: 4, message: 5 }
  },
  // 简化格式: "line 42: Error message"
  {
    pattern: /^line\s*(\d+):\s*(.+)$/,
    groups: { line: 1, message: 2 }
  },
  // 编译器内部错误格式
  {
    pattern: /^ERROR in (.+) at line (\d+): (.+)$/,
    groups: { file: 1, line: 2, message: 3, type: 'ERROR' }
  },
  // 语法错误格式
  {
    pattern: /^Syntax error in '([^']+)' line (\d+): (.+)$/,
    groups: { file: 1, line: 2, message: 3, type: 'ERROR' }
  },
  // Include错误格式: "ERROR: Couldn't open include file 'filename.ink'"
  {
    pattern: /^(ERROR|WARNING):\s*Couldn't open include file '([^']+)'/,
    groups: { type: 1, file: 2, message: 0 }
  },
  // 通用错误格式: "ERROR: 'filename.ink' line 5: Error message"
  {
    pattern: /^(ERROR|WARNING):\s*'([^']+)'\s+line\s+(\d+):\s*(.+)$/,
    groups: { type: 1, file: 2, line: 3, message: 4 }
  },
  // 变量错误格式: "ERROR: Variable 'var_name' has not been assigned"
  {
    pattern: /^(ERROR|WARNING):\s*(Variable '[^']+' has not been assigned.*)/,
    groups: { type: 1, message: 2 }
  },
  // Knot错误格式: "ERROR: function, knot or stitch already exists called 'name'"
  {
    pattern: /^(ERROR|WARNING):\s*(function, knot or stitch already exists called '[^']+'.*)/,
    groups: { type: 1, message: 2 }
  },
  // 跳转错误格式: "ERROR: Unknown divert target 'target_name'"
  {
    pattern: /^(ERROR|WARNING):\s*(Unknown divert target '[^']+'.*)/,
    groups: { type: 1, message: 2 }
  }
];

// 特定错误类型的智能定位
const ERROR_LOCATION_HINTS: Array<{
  pattern: RegExp;
  getLocation: (message: string, line: string) => { column: number; length: number } | null;
}> = [
  {
    // 未定义的knot/stitch错误
    pattern: /Unknown divert target '([^']+)'/,
    getLocation: (message, line) => {
      const match = message.match(/Unknown divert target '([^']+)'/);
      if (match) {
        const target = match[1];
        const index = line.indexOf(`-> ${target}`);
        if (index >= 0) {
          return { column: index + 4, length: target.length }; // +4 for "-> "
        }
      }
      return null;
    }
  },
  {
    // 变量未声明错误
    pattern: /Variable '([^']+)' has not been assigned/,
    getLocation: (message, line) => {
      const match = message.match(/Variable '([^']+)' has not been assigned/);
      if (match) {
        const varName = match[1];
        const index = line.indexOf(`{${varName}}`);
        if (index >= 0) {
          return { column: index + 2, length: varName.length }; // +2 for "{"
        }
      }
      return null;
    }
  },
  {
    // 语法错误 - 选择项
    pattern: /Expected choice/,
    getLocation: (_, line) => {
      const choiceIndex = line.search(/[*+]/);
      if (choiceIndex >= 0) {
        return { column: choiceIndex + 1, length: 1 };
      }
      return null;
    }
  },
  {
    // 括号不匹配
    pattern: /(Missing|Unexpected).*(bracket|brace|parenthesis)/,
    getLocation: (_, line) => {
      // 查找不匹配的括号
      const brackets = ['{', '}', '[', ']', '(', ')'];
      for (let i = 0; i < line.length; i++) {
        if (brackets.includes(line[i])) {
          return { column: i + 1, length: 1 };
        }
      }
      return null;
    }
  },
  {
    // 字符串未闭合
    pattern: /Unexpected end of line.*string/,
    getLocation: (_, line) => {
      const quoteIndex = line.indexOf('"');
      if (quoteIndex >= 0) {
        return { column: quoteIndex + 1, length: line.length - quoteIndex };
      }
      return null;
    }
  }
];

/**
 * 解析inklecate错误输出为结构化错误对象
 */
export function parseInklecateErrors(errorOutput: string, filename?: string): InklecateError[] {
  const errors: InklecateError[] = [];
  const lines = errorOutput.split('\n').filter(line => line.trim());

  for (const line of lines) {
    for (const { pattern, groups } of ERROR_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const error: InklecateError = {
          type: (match[groups.type as number] as 'ERROR' | 'WARNING') || 'ERROR',
          file: match[groups.file as number] || filename || 'unknown',
          line: parseInt(match[groups.line as number]) || 1,
          message: match[groups.message as number] || line
        };

        if (groups.column && match[groups.column as number]) {
          error.column = parseInt(match[groups.column as number]);
        }

        errors.push(error);
        break; // 匹配到一个模式就停止
      }
    }
  }

  return errors;
}

/**
 * 将inklecate错误转换为Monaco Editor标记
 */
export function convertInklecateErrorsToMarkers(
  errors: InklecateError[],
  sourceLines: string[],
  targetFile?: string
): Marker[] {
  const markers: Marker[] = [];
  
  // 预先扫描源文件中的INCLUDE语句
  const includeMap = new Map<string, number>(); // filename -> line number
  sourceLines.forEach((line, index) => {
    const includeMatch = line.match(/^\s*INCLUDE\s+(.+?)(?:\s*$|(?:\s*\/\/.*$))/);
    if (includeMatch) {
      let includeFile = includeMatch[1].trim();
      // 移除可能的引号
      includeFile = includeFile.replace(/^["']|["']$/g, '');
      // 只保留文件名，不保留路径
      const fileName = includeFile.split('/').pop() || includeFile;
      includeMap.set(fileName, index + 1); // 行号是1-indexed
    }
  });

  for (const error of errors) {
    // 改进的文件匹配逻辑
    const targetFileName = targetFile?.split('/').pop() || '';
    const errorFileName = error.file.split('/').pop() || error.file;
    let shouldInclude = !targetFile || error.file.endsWith(targetFileName);
    let mappedLineNumber = error.line;
    let includeFileError = false;
    
    // 检查错误是否来自被包含的文件
    if (targetFile && !shouldInclude && includeMap.has(errorFileName)) {
      // 错误来自INCLUDE文件，将其映射到INCLUDE语句所在的行
      shouldInclude = true;
      mappedLineNumber = includeMap.get(errorFileName)!;
      includeFileError = true;
      console.log(`inklecateErrorParser: Mapping error from ${errorFileName} to INCLUDE line ${mappedLineNumber}`);
    }
    
    // 对于某些全局错误（如重复的knot名称），在主文件中也显示
    const isGlobalError = error.message.includes('Story already contains flow named') ||
                         error.message.includes('Couldn\'t open include file');
    
    if (isGlobalError && targetFile && targetFileName.endsWith('.ink')) {
      shouldInclude = true; // 在所有相关文件中显示全局错误
    }
    
    console.log('inklecateErrorParser: Processing error:', {
      errorFile: error.file,
      errorFileName,
      targetFile,
      targetFileName,
      shouldInclude,
      isGlobalError,
      includeFileError,
      originalLine: error.line,
      mappedLine: mappedLineNumber,
      error: error.message
    });
    
    if (!shouldInclude) {
      continue;
    }

    const lineNumber = mappedLineNumber; // 使用映射后的行号
    const lineContent = sourceLines[lineNumber - 1] || '';
    
    // 确定错误位置和范围
    let startColumn = error.column || 1;
    let endColumn = startColumn + 1;
    
    if (includeFileError) {
      // 对于INCLUDE文件的错误，高亮整个INCLUDE语句
      const includeMatch = lineContent.match(/^\s*(INCLUDE\s+.+?)(?:\s*$|(?:\s*\/\/.*$))/);
      if (includeMatch) {
        const includeStart = lineContent.indexOf(includeMatch[1]);
        startColumn = includeStart + 1;
        endColumn = includeStart + includeMatch[1].length + 1;
      }
    } else {
      // 使用智能定位来精确定位错误
      for (const hint of ERROR_LOCATION_HINTS) {
        if (hint.pattern.test(error.message)) {
          const location = hint.getLocation(error.message, lineContent);
          if (location) {
            startColumn = location.column;
            endColumn = location.column + location.length;
            break;
          }
        }
      }

      // 如果没有智能定位，尝试通用定位策略
      if (startColumn === 1 && endColumn === 2) {
        const location = getGenericErrorLocation(error.message, lineContent);
        if (location) {
          startColumn = location.column;
          endColumn = location.column + location.length;
        } else {
          // 默认高亮整行（去除前导空格）
          const trimmedStart = lineContent.search(/\S/);
          startColumn = Math.max(1, trimmedStart + 1);
          endColumn = lineContent.length + 1;
        }
      }
    }

    // 确保列号在有效范围内
    startColumn = Math.max(1, Math.min(startColumn, lineContent.length + 1));
    endColumn = Math.max(startColumn + 1, Math.min(endColumn, lineContent.length + 1));
    
    // 为INCLUDE文件的错误构建更清晰的消息
    let errorMessage = error.message;
    if (includeFileError) {
      errorMessage = `Error in included file '${errorFileName}' (line ${error.line}): ${error.message}\n[Click to open ${errorFileName}]`;
    }

    markers.push({
      startLineNumber: lineNumber,
      startColumn,
      endLineNumber: lineNumber,
      endColumn,
      message: `[inklecate] ${errorMessage}`,
      severity: error.type === 'ERROR' ? 8 : 4 // Monaco: MarkerSeverity.Error=8, Warning=4
    });
  }

  return markers;
}

/**
 * 通用错误定位策略
 */
function getGenericErrorLocation(message: string, line: string): { column: number; length: number } | null {
  const lowerMessage = message.toLowerCase();
  
  // 常见关键字定位 - 更精确的匹配
  const keywords = [
    { words: ['knot'], pattern: /===\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*===/ },
    { words: ['stitch'], pattern: /^=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*$/ },
    { words: ['choice', 'option'], pattern: /[*+]+\s*/ },
    { words: ['divert', 'goto', 'jump', 'target'], pattern: /->\s*[a-zA-Z_][a-zA-Z0-9_]*/ },
    { words: ['variable', 'var'], pattern: /\{[a-zA-Z_][a-zA-Z0-9_]*\}|VAR\s+[a-zA-Z_][a-zA-Z0-9_]*/ },
    { words: ['include'], pattern: /INCLUDE\s+[^\s]+/ },
    { words: ['string'], pattern: /"[^"]*"?/ },
    { words: ['bracket', 'brace', 'parenthesis'], pattern: /[{}[\]()]/ },
    { words: ['condition', 'conditional'], pattern: /\{[^}]*:/ },
    { words: ['tag'], pattern: /#\s*[a-zA-Z_][a-zA-Z0-9_]*/ },
    { words: ['logic', 'inline'], pattern: /~[^~\n]*/ }
  ];

  for (const { words, pattern } of keywords) {
    if (words.some(word => lowerMessage.includes(word))) {
      const match = line.match(pattern);
      if (match && match.index !== undefined) {
        return { column: match.index + 1, length: match[0].length };
      }
    }
  }

  // 如果没有匹配特定模式，尝试匹配错误消息中提到的具体名称
  const nameMatches = message.match(/'([^']+)'/);
  if (nameMatches) {
    const name = nameMatches[1];
    const nameIndex = line.indexOf(name);
    if (nameIndex >= 0) {
      return { column: nameIndex + 1, length: name.length };
    }
  }

  return null;
}

/**
 * 从JSON格式的issues数组中解析错误
 */
export function parseInklecateIssues(issues: string[], filename?: string): InklecateError[] {
  const errors: InklecateError[] = [];

  for (const issue of issues) {
    // 解析issue字符串，格式通常是: "WARNING: 'filename' line 42: message"
    const parsed = parseInklecateErrors(issue, filename);
    errors.push(...parsed);
  }

  return errors;
}

/**
 * 增强的错误解析，支持多种输入格式
 */
export function parseInklecateOutput(
  stdout: string,
  stderr: string,
  issues?: string[],
  filename?: string
): InklecateError[] {
  const allErrors: InklecateError[] = [];

  // 解析stderr中的错误
  if (stderr.trim()) {
    allErrors.push(...parseInklecateErrors(stderr, filename));
  }

  // 解析stdout中的错误（有些错误可能输出到stdout）
  if (stdout.trim()) {
    allErrors.push(...parseInklecateErrors(stdout, filename));
  }

  // 解析JSON issues数组
  if (issues && issues.length > 0) {
    allErrors.push(...parseInklecateIssues(issues, filename));
  }

  // 去重（基于行号和消息）
  const uniqueErrors = allErrors.filter((error, index, array) => 
    array.findIndex(e => 
      e.line === error.line && 
      e.message === error.message && 
      e.type === error.type
    ) === index
  );

  return uniqueErrors;
}