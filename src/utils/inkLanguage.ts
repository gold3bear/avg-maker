// src/utils/inkLanguage.ts
// 完整的Ink语言支持，包括语法高亮、验证和自动完成

import * as monaco from 'monaco-editor';

// Ink语言的完整语法定义
export const inkLanguageDefinition: monaco.languages.IMonarchLanguage = {
  // 忽略大小写
  ignoreCase: false,
  
  // 关键字定义
  keywords: [
    'VAR', 'CONST', 'LIST', 'INCLUDE', 'EXTERNAL',
    'function', 'return', 'if', 'else', 'elseif', 'endif',
    'has', 'hasnt', 'not', 'and', 'or', 'mod',
    'true', 'false', 'null',
    'CHOICE_COUNT', 'TURNS', 'TURNS_SINCE', 'SEED_RANDOM',
    'LIST_COUNT', 'LIST_MIN', 'LIST_MAX', 'LIST_ALL', 'LIST_INVERT',
    'RANDOM', 'SHUFFLE'
  ],

  // 操作符
  operators: [
    '=', '==', '!=', '<', '<=', '>', '>=',
    '+', '-', '*', '/', '%', '++', '--',
    '+=', '-=', '*=', '/=', '%=',
    '&&', '||', '!',
    '?', ':', '->', '<-'
  ],

  // 符号
  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  // 转义字符
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // Tokenizer规则
  tokenizer: {
    root: [
      // 注释
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      
      // 多行字符串（三引号）
      [/"""/, 'string', '@string_multiline'],
      
      // 单行字符串
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // 未闭合字符串
      [/"/, 'string', '@string'],
      
      // Knots (=== name ===)
      [/^===\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*===$/, 'type.identifier'],
      
      // Stitches (= name)
      [/^=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*$/, 'function'],
      
      // 标签 (# tags)
      [/#\s*[a-zA-Z_][a-zA-Z0-9_]*/, 'tag'],
      
      // 选择项 (* choice 或 + choice)
      [/^[\s]*[\*\+]+\s*/, 'keyword.choice'],
      
      // 条件选择 {condition: choice}
      [/\{[^}]*:/, 'keyword.conditional'],
      
      // 变量引用 {variable}
      [/\{[^}]*\}/, 'variable'],
      
      // 数字
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],
      
      // 标识符和关键字
      [/[a-zA-Z_][a-zA-Z0-9_]*/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      
      // 跳转 (-> target 或 <- return)
      [/->[^<>\n]*/, 'keyword.flow'],
      [/<-/, 'keyword.flow'],
      
      // 内联逻辑 (~ code)
      [/~[^~\n]*/, 'keyword.logic'],
      
      // 操作符
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],
      
      // 分隔符
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/[,.]/, 'delimiter'],
      
      // 空白字符
      [/[ \t\r\n]+/, 'white'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop']
    ],

    string_multiline: [
      [/[^"]+/, 'string'],
      [/"""/, 'string', '@pop'],
      [/"/, 'string']
    ]
  }
};

// Ink语言配置
export const inkLanguageConfiguration: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: '"""', close: '"""', notIn: ['string'] }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  indentationRules: {
    increaseIndentPattern: /^[\s]*[\*\+]+.*$/,
    decreaseIndentPattern: /^[\s]*$|^[\s]*\}.*$/
  },
  folding: {
    markers: {
      start: new RegExp('^\\s*===.*===$'),
      end: new RegExp('^\\s*===.*===$')
    }
  }
};

// 自动完成建议
export const inkCompletionProvider: monaco.languages.CompletionItemProvider = {
  provideCompletionItems: (model, position) => {
    const suggestions: monaco.languages.CompletionItem[] = [];
    const content = model.getValue();
    const line = model.getLineContent(position.lineNumber);
    const wordInfo = model.getWordUntilPosition(position);
    const range = new monaco.Range(
      position.lineNumber,
      wordInfo.startColumn,
      position.lineNumber,
      wordInfo.endColumn
    );
    
    // 分析当前上下文
    const isInDivert = /->\s*$/.test(line.substring(0, position.column - 1));
    const isInVariable = /\{[^}]*$/.test(line.substring(0, position.column - 1));
    
    // 动态建议：从当前文档中提取knots和变量
    const knots = extractKnots(content);
    const variables = extractVariables(content);
    
    // 根据上下文提供不同的建议
    if (isInDivert) {
      // 跳转目标建议
      suggestions.push(
        {
          label: 'DONE',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'DONE',
          documentation: '结束当前knot或stitch',
          range
        },
        {
          label: 'END',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'END',
          documentation: '结束整个故事',
          range
        }
      );
      
      // 添加当前文档中的knots
      knots.forEach(knot => {
        suggestions.push({
          label: knot,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: knot,
          documentation: `跳转到knot: ${knot}`,
          range
        });
      });
    } else if (isInVariable) {
      // 变量建议
      variables.forEach(variable => {
        suggestions.push({
          label: variable,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: variable,
          documentation: `变量: ${variable}`,
          range
        });
      });
    } else {
      // 基本关键字和模板建议
      suggestions.push(
        {
          label: 'VAR',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'VAR ${1:variable_name} = ${2:value}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '声明一个变量',
          range
        },
        {
          label: 'LIST',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'LIST ${1:list_name} = ${2:item1}, ${3:item2}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '声明一个列表',
          range
        },
        {
          label: 'INCLUDE',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'INCLUDE ${1:filename.ink}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '包含其他Ink文件',
          range
        },
        {
          label: 'knot',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '=== ${1:knot_name} ===\n${2:content}\n-> DONE',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '创建一个新的knot（章节）',
          range
        },
        {
          label: 'choice',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '* ${1:choice_text}\n    ${2:result}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '创建一个选择项',
          range
        }
      );
    }

    return { suggestions };
  }
};

// 提取文档中的knots
export function extractKnots(content: string): string[] {
  const knots: string[] = [];
  const regex = /^===\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*===/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    knots.push(match[1]);
  }
  return knots;
}

// 提取文档中的变量
export function extractVariables(content: string): string[] {
  const variables: string[] = [];
  const regex = /^VAR\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    variables.push(match[1]);
  }
  return variables;
}

// 悬停信息提供器
export const inkHoverProvider: monaco.languages.HoverProvider = {
  provideHover: (model, position) => {
    const word = model.getWordAtPosition(position);
    if (!word) return null;

    const hoverInfo: { [key: string]: string } = {
      'VAR': '声明一个变量。语法: VAR variable_name = value',
      'LIST': '声明一个列表。语法: LIST list_name = item1, item2, item3',
      'INCLUDE': '包含其他Ink文件。语法: INCLUDE filename.ink',
      'DONE': '结束当前knot或stitch的执行',
      'END': '结束整个故事',
      'CHOICE_COUNT': '返回当前可用选择的数量',
      'TURNS': '返回从游戏开始的总回合数',
      'RANDOM': '生成随机数。语法: RANDOM(min, max)',
      'SHUFFLE': '打乱列表顺序'
    };

    const info = hoverInfo[word.word];
    if (info) {
      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [
          { value: `**${word.word}**` },
          { value: info }
        ]
      };
    }

    return null;
  }
};

// 代码折叠提供器
export const inkFoldingProvider: monaco.languages.FoldingRangeProvider = {
  provideFoldingRanges: (model) => {
    const ranges: monaco.languages.FoldingRange[] = [];
    const lines = model.getLinesContent();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Knot折叠 (=== name ===)
      if (/^===.*===$/.test(line.trim())) {
        let endLine = i;
        for (let j = i + 1; j < lines.length; j++) {
          if (/^===.*===$/.test(lines[j].trim())) {
            endLine = j - 1;
            break;
          }
          if (j === lines.length - 1) {
            endLine = j;
          }
        }
        
        if (endLine > i) {
          ranges.push({
            start: i + 1,
            end: endLine + 1,
            kind: monaco.languages.FoldingRangeKind.Region
          });
        }
      }
    }
    
    return ranges;
  }
};

// 注册完整的Ink语言支持
export function registerInkLanguage(monaco: typeof import('monaco-editor')) {
  // 注册语言
  monaco.languages.register({ id: 'ink' });
  
  // 设置语法高亮
  monaco.languages.setMonarchTokensProvider('ink', inkLanguageDefinition);
  
  // 设置语言配置
  monaco.languages.setLanguageConfiguration('ink', inkLanguageConfiguration);
  
  // 注册自动完成
  monaco.languages.registerCompletionItemProvider('ink', inkCompletionProvider);
  
  // 注册悬停提示
  monaco.languages.registerHoverProvider('ink', inkHoverProvider);
  
  // 注册代码折叠
  monaco.languages.registerFoldingRangeProvider('ink', inkFoldingProvider);

  // 设置默认主题（将在ThemeProvider中动态更新）
  setupInkThemes(monaco);
}

/**
 * 设置所有Ink编辑器主题
 */
export function setupInkThemes(monaco: typeof import('monaco-editor')) {
  // Light主题
  monaco.editor.defineTheme('ink-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'keyword.choice', foreground: 'AF00DB', fontStyle: 'bold' },
      { token: 'keyword.flow', foreground: 'FF6600', fontStyle: 'bold' },
      { token: 'keyword.logic', foreground: '267F99' },
      { token: 'keyword.conditional', foreground: 'AF00DB' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: '098658' },
      { token: 'type.identifier', foreground: '267F99', fontStyle: 'bold' },
      { token: 'function', foreground: '795E26', fontStyle: 'bold' },
      { token: 'variable', foreground: '001080' },
      { token: 'tag', foreground: '7C4DFF', fontStyle: 'italic' },
      { token: 'operator', foreground: '000000' }
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#F0F0F0',
      'editor.selectionBackground': '#ADD6FF',
      'editorLineNumber.foreground': '#237893',
      'editorGutter.background': '#FFFFFF',
      'editorError.foreground': '#E51400',
      'editorWarning.foreground': '#FF8C00',
      'editorInfo.foreground': '#1BA1E2',
      'editorError.border': '#E51400',
      'editorWarning.border': '#FF8C00',
      'editorInfo.border': '#1BA1E2',
      'scrollbar.shadow': '#DDDDDD',
      'scrollbarSlider.background': '#C2C2C2',
      'scrollbarSlider.hoverBackground': '#A6A6A6',
      'scrollbarSlider.activeBackground': '#8C8C8C',
      // 简化错误/警告样式 - 只保留波浪线
      'editorError.background': '#FFFFFF00', // 透明背景
      'editorWarning.background': '#FFFFFF00', // 透明背景
      'editorInfo.background': '#FFFFFF00' // 透明背景
    }
  });

  // Dark主题 (VSCode Dark+)
  monaco.editor.defineTheme('ink-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'keyword.choice', foreground: 'C586C0', fontStyle: 'bold' },
      { token: 'keyword.flow', foreground: 'FF8C00', fontStyle: 'bold' },
      { token: 'keyword.logic', foreground: '4EC9B0' },
      { token: 'keyword.conditional', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type.identifier', foreground: '4EC9B0', fontStyle: 'bold' },
      { token: 'function', foreground: 'DCDCAA', fontStyle: 'bold' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'tag', foreground: 'C792EA', fontStyle: 'italic' },
      { token: 'operator', foreground: 'D4D4D4' }
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#2A2D2E',
      'editor.selectionBackground': '#264F78',
      'editorLineNumber.foreground': '#858585',
      'editorGutter.background': '#1E1E1E',
      'editorError.foreground': '#F85149',
      'editorWarning.foreground': '#D7BA7D',
      'editorInfo.foreground': '#75BEFF',
      'editorError.border': '#F85149',
      'editorWarning.border': '#D7BA7D',
      'editorInfo.border': '#75BEFF',
      'scrollbar.shadow': '#000000',
      'scrollbarSlider.background': '#424242',
      'scrollbarSlider.hoverBackground': '#4F4F4F',
      'scrollbarSlider.activeBackground': '#646464',
      // 简化错误/警告样式 - 只保留波浪线
      'editorError.background': '#1E1E1E00', // 透明背景
      'editorWarning.background': '#1E1E1E00', // 透明背景
      'editorInfo.background': '#1E1E1E00' // 透明背景
    }
  });

  // GitHub Dark主题
  monaco.editor.defineTheme('ink-github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FFA657', fontStyle: 'bold' },
      { token: 'keyword.choice', foreground: 'F97583', fontStyle: 'bold' },
      { token: 'keyword.flow', foreground: 'FF7B72', fontStyle: 'bold' },
      { token: 'keyword.logic', foreground: '56D364' },
      { token: 'keyword.conditional', foreground: 'F97583' },
      { token: 'string', foreground: 'A5D6FF' },
      { token: 'number', foreground: '79C0FF' },
      { token: 'type.identifier', foreground: 'FFA657', fontStyle: 'bold' },
      { token: 'function', foreground: 'D2A8FF', fontStyle: 'bold' },
      { token: 'variable', foreground: 'FFA657' },
      { token: 'tag', foreground: '7EE787', fontStyle: 'italic' },
      { token: 'operator', foreground: 'F0F6FC' }
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#F0F6FC',
      'editor.lineHighlightBackground': '#161B22',
      'editor.selectionBackground': '#264F78',
      'editorLineNumber.foreground': '#7D8590',
      'editorGutter.background': '#0D1117',
      'editorError.foreground': '#F85149',
      'editorWarning.foreground': '#D29922',
      'editorInfo.foreground': '#58A6FF',
      'editorError.border': '#F85149',
      'editorWarning.border': '#D29922',
      'editorInfo.border': '#58A6FF',
      'scrollbar.shadow': '#000000',
      'scrollbarSlider.background': '#30363D',
      'scrollbarSlider.hoverBackground': '#424A53',
      'scrollbarSlider.activeBackground': '#545D68',
      // 简化错误/警告样式 - 只保留波浪线
      'editorError.background': '#0D111700', // 透明背景
      'editorWarning.background': '#0D111700', // 透明背景
      'editorInfo.background': '#0D111700' // 透明背景
    }
  });

  // Monokai主题
  monaco.editor.defineTheme('ink-monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'F92672', fontStyle: 'bold' },
      { token: 'keyword.choice', foreground: 'AE81FF', fontStyle: 'bold' },
      { token: 'keyword.flow', foreground: 'FD971F', fontStyle: 'bold' },
      { token: 'keyword.logic', foreground: '66D9EF' },
      { token: 'keyword.conditional', foreground: 'AE81FF' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'type.identifier', foreground: '66D9EF', fontStyle: 'bold' },
      { token: 'function', foreground: 'A6E22E', fontStyle: 'bold' },
      { token: 'variable', foreground: 'F8F8F2' },
      { token: 'tag', foreground: 'F92672', fontStyle: 'italic' },
      { token: 'operator', foreground: 'F92672' }
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#3E3D32',
      'editor.selectionBackground': '#49483E',
      'editorLineNumber.foreground': '#90908A',
      'editorGutter.background': '#272822',
      'editorError.foreground': '#F92672',
      'editorWarning.foreground': 'FD971F',
      'editorInfo.foreground': '66D9EF',
      'editorError.border': '#F92672',
      'editorWarning.border': 'FD971F',
      'editorInfo.border': '66D9EF',
      'scrollbar.shadow': '#000000',
      'scrollbarSlider.background': '#75715E',
      'scrollbarSlider.hoverBackground': '#90908A',
      'scrollbarSlider.activeBackground': '#A6A6A6',
      // 简化错误/警告样式 - 只保留波浪线
      'editorError.background': '#27282200', // 透明背景
      'editorWarning.background': '#27282200', // 透明背景
      'editorInfo.background': '#27282200' // 透明背景
    }
  });
}

/**
 * 获取主题对应的Monaco主题名称
 */
export function getMonacoThemeName(themeName: string): string {
  const themeMap: { [key: string]: string } = {
    'light': 'ink-light',
    'dark': 'ink-dark',
    'github-dark': 'ink-github-dark',
    'monokai': 'ink-monokai'
  };
  
  return themeMap[themeName] || 'ink-dark';
}