// src/utils/__tests__/inkKnotDetection.test.ts
// InkKnotDetection 工具的鲁棒性测试套件

import { InkKnotDetector, createKnotDetector, quickDetectKnot, detectKnotAfterChoice } from '../inkKnotDetection';

// Mock Story object for testing
interface MockStoryState {
  currentPathString?: string;
  callStack?: {
    elements: Array<{
      currentPointer?: {
        container?: {
          name?: string;
        };
      };
      type?: string;
    }>;
  };
  currentPointer?: {
    container?: {
      name?: string;
    };
  };
  currentFlow?: {
    name?: string;
  };
  ToJson?: () => string;
  LoadJson?: (json: string) => void;
}

interface MockStory {
  state: MockStoryState;
  canContinue: boolean;
  currentChoices: Array<{
    text: string;
    targetPointer?: any;
    choicePoint?: any;
  }>;
  Continue: () => string;
  ChooseChoiceIndex: (index: number) => void;
}

function createMockStory(stateOverrides: Partial<MockStoryState> = {}): MockStory {
  return {
    state: {
      currentPathString: '',
      callStack: { elements: [] },
      currentPointer: undefined,
      currentFlow: undefined,
      ToJson: () => '{}',
      LoadJson: (json: string) => {},
      ...stateOverrides
    },
    canContinue: false,
    currentChoices: [],
    Continue: () => '',
    ChooseChoiceIndex: (index: number) => {}
  } as MockStory;
}

describe('InkKnotDetector 鲁棒性测试', () => {
  let detector: InkKnotDetector;

  beforeEach(() => {
    detector = new InkKnotDetector({ enableDebugLog: false });
  });

  describe('构造函数和初始化', () => {
    test('默认构造函数应该正常工作', () => {
      const defaultDetector = new InkKnotDetector();
      expect(defaultDetector).toBeInstanceOf(InkKnotDetector);
      expect(defaultDetector.getLastKnownKnot()).toBe('game_start');
    });

    test('带选项的构造函数应该正常工作', () => {
      const detector = new InkKnotDetector({
        enableDebugLog: true,
        fallbackKnot: 'custom_start',
        customKnotFlowMap: {
          'test_knot': {
            choices: ['target1', 'target2']
          }
        }
      });
      expect(detector).toBeInstanceOf(InkKnotDetector);
    });

    test('便捷函数应该正常工作', () => {
      const detector = createKnotDetector();
      expect(detector).toBeInstanceOf(InkKnotDetector);
    });
  });

  describe('isValidKnotName 边界测试', () => {
    test('应该正确识别有效的knot名称', () => {
      const validNames = [
        'game_start',
        'character_setup', 
        'day1_start',
        'complex_scene_with_underscores',
        'scene123',
        'a',
        'A',
        'Test'
      ];
      
      validNames.forEach(name => {
        expect(detector.isValidKnotName(name)).toBe(true);
      });
    });

    test('应该正确识别无效的knot名称', () => {
      const invalidNames = [
        '',
        'c-0',
        'c-1',
        'c-999',
        'b',
        'g-0',
        'g-123',
        'DEFAULT_FLOW',
        '123',
        '0',
        '999'
      ];
      
      invalidNames.forEach(name => {
        expect(detector.isValidKnotName(name)).toBe(false);
      });
    });

    test('应该处理异常输入', () => {
      // @ts-ignore - 故意传入异常类型
      expect(detector.isValidKnotName(null)).toBe(false);
      // @ts-ignore
      expect(detector.isValidKnotName(undefined)).toBe(false);
      // @ts-ignore
      expect(detector.isValidKnotName(123)).toBe(false);
      // @ts-ignore
      expect(detector.isValidKnotName({})).toBe(false);
      // @ts-ignore
      expect(detector.isValidKnotName([])).toBe(false);
    });
  });

  describe('lastKnownKnot 状态管理', () => {
    test('应该正确更新和获取lastKnownKnot', () => {
      expect(detector.getLastKnownKnot()).toBe('game_start');
      
      detector.updateLastKnownKnot('new_knot');
      expect(detector.getLastKnownKnot()).toBe('new_knot');
    });

    test('应该拒绝无效的knot名称更新', () => {
      const initialKnot = detector.getLastKnownKnot();
      
      detector.updateLastKnownKnot('c-0');
      expect(detector.getLastKnownKnot()).toBe(initialKnot);
      
      detector.updateLastKnownKnot('');
      expect(detector.getLastKnownKnot()).toBe(initialKnot);
      
      detector.updateLastKnownKnot('b');
      expect(detector.getLastKnownKnot()).toBe(initialKnot);
    });
  });

  describe('predictTargetKnot 预测逻辑', () => {
    test('应该正确预测已知流程的目标', () => {
      const result = detector.predictTargetKnot('game_start', 0);
      expect(result).toBe('character_setup');
      
      const result2 = detector.predictTargetKnot('game_start', 1);
      expect(result2).toBe('background_info');
    });

    test('应该处理超出范围的选择索引', () => {
      const result = detector.predictTargetKnot('game_start', 999);
      expect(result).toBe('character_setup'); // 使用默认目标
    });

    test('应该处理未知的knot', () => {
      const result = detector.predictTargetKnot('unknown_knot', 0);
      expect(result).toBe('unknown_knot'); // 保持当前knot
    });

    test('应该处理负数索引', () => {
      const result = detector.predictTargetKnot('game_start', -1);
      expect(result).toBe('character_setup'); // 使用默认目标
    });
  });

  describe('detectFromCallStack 异常处理', () => {
    test('应该处理空的callStack', () => {
      const story = createMockStory({
        callStack: { elements: [] }
      });
      
      const result = detector.detectFromCallStack(story as any);
      expect(result).toBeNull();
    });

    test('应该处理无效的callStack结构', () => {
      const story = createMockStory({
        callStack: undefined
      });
      
      const result = detector.detectFromCallStack(story as any);
      expect(result).toBeNull();
    });

    test('应该处理包含无效容器的callStack', () => {
      const story = createMockStory({
        callStack: {
          elements: [
            { currentPointer: { container: { name: 'c-0' } } },
            { currentPointer: { container: { name: 'b' } } },
            { currentPointer: undefined },
            { currentPointer: { container: undefined } }
          ]
        }
      });
      
      const result = detector.detectFromCallStack(story as any);
      expect(result).toBeNull();
    });

    test('应该从callStack中找到有效的knot', () => {
      const story = createMockStory({
        callStack: {
          elements: [
            { currentPointer: { container: { name: 'c-0' } } },
            { currentPointer: { container: { name: 'valid_knot' } } },
            { currentPointer: { container: { name: 'b' } } }
          ]
        }
      });
      
      const result = detector.detectFromCallStack(story as any);
      expect(result).toBe('valid_knot');
    });
  });

  describe('detectFromCurrentPointer 异常处理', () => {
    test('应该处理空的currentPointer', () => {
      const story = createMockStory({
        currentPointer: undefined
      });
      
      const result = detector.detectFromCurrentPointer(story as any);
      expect(result).toBeNull();
    });

    test('应该处理无效的container', () => {
      const story = createMockStory({
        currentPointer: { container: undefined }
      });
      
      const result = detector.detectFromCurrentPointer(story as any);
      expect(result).toBeNull();
    });

    test('应该处理无效的容器名称', () => {
      const story = createMockStory({
        currentPointer: { container: { name: 'c-0' } }
      });
      
      const result = detector.detectFromCurrentPointer(story as any);
      expect(result).toBeNull();
    });

    test('应该找到有效的容器名称', () => {
      const story = createMockStory({
        currentPointer: { container: { name: 'valid_knot' } }
      });
      
      const result = detector.detectFromCurrentPointer(story as any);
      expect(result).toBe('valid_knot');
    });
  });

  describe('detectFromPathString 异常处理', () => {
    test('应该处理空的pathString', () => {
      const story = createMockStory({
        currentPathString: ''
      });
      
      const result = detector.detectFromPathString(story as any);
      expect(result).toBeNull();
    });

    test('应该处理null pathString', () => {
      const story = createMockStory({
        currentPathString: 'null'
      });
      
      const result = detector.detectFromPathString(story as any);
      expect(result).toBeNull();
    });

    test('应该处理包含无效段的pathString', () => {
      const story = createMockStory({
        currentPathString: 'c-0.b.g-1'
      });
      
      const result = detector.detectFromPathString(story as any);
      expect(result).toBeNull();
    });

    test('应该从pathString中找到有效的段', () => {
      const story = createMockStory({
        currentPathString: 'c-0.valid_knot.b'
      });
      
      const result = detector.detectFromPathString(story as any);
      expect(result).toBe('valid_knot');
    });
  });

  describe('getCurrentKnotName 综合测试', () => {
    test('应该处理完全空的Story状态', () => {
      const story = createMockStory({
        currentPathString: '',
        callStack: { elements: [] },
        currentPointer: undefined
      });
      
      const result = detector.getCurrentKnotName(story as any);
      expect(result).toBe('game_start'); // 使用lastKnownKnot
    });

    test('应该使用fallback参数', () => {
      const story = createMockStory({
        currentPathString: '',
        callStack: { elements: [] },
        currentPointer: undefined
      });
      
      // 重置lastKnownKnot到无效状态
      detector.updateLastKnownKnot('some_valid_knot');
      
      const result = detector.getCurrentKnotName(story as any, 'custom_fallback');
      expect(result).toBe('some_valid_knot'); // 优先使用lastKnownKnot
    });

    test('应该处理Story对象异常', () => {
      // @ts-ignore - 故意传入异常对象
      const result = detector.getCurrentKnotName(null);
      expect(result).toBe('start');
    });
  });

  describe('detectKnotAfterChoice 异常处理', () => {
    test('应该处理异常的Story对象', () => {
      // @ts-ignore
      const result = detector.detectKnotAfterChoice(null, 'current', 0);
      expect(result).toBe('current'); // 保持当前knot
    });

    test('应该处理超出范围的choiceIndex', () => {
      const story = createMockStory();
      const result = detector.detectKnotAfterChoice(story as any, 'game_start', 999);
      expect(result).toBe('character_setup'); // 使用默认目标
    });

    test('应该处理负数choiceIndex', () => {
      const story = createMockStory();
      const result = detector.detectKnotAfterChoice(story as any, 'game_start', -1);
      expect(result).toBe('character_setup');
    });

    test('验证模式应该处理Continue异常', () => {
      const story = createMockStory();
      story.canContinue = true;
      story.Continue = () => { throw new Error('Continue failed'); };
      
      const result = detector.detectKnotAfterChoice(
        story as any, 
        'game_start', 
        0,
        { verifyAfterContinue: true }
      );
      
      expect(result).toBe('character_setup'); // 应该返回预测值
    });
  });

  describe('determineInitialKnot 文件路径测试', () => {
    test('应该处理各种文件路径格式', () => {
      const testCases = [
        { path: '/path/to/story.ink', expected: 'game_start' },
        { path: 'story.ink', expected: 'game_start' },
        { path: '/path/to/game_start.ink', expected: 'game_start' },
        { path: '/path/to/day_1.ink', expected: 'day1_start' },
        { path: '/path/to/simple_test.ink', expected: 'start' },
        { path: '/path/to/custom_scene.ink', expected: 'custom_scene' },
        { path: '', expected: 'game_start' },
        { path: 'no_extension', expected: 'game_start' }
      ];
      
      testCases.forEach(({ path, expected }) => {
        const result = detector.determineInitialKnot(path);
        expect(result).toBe(expected);
      });
    });

    test('应该处理异常路径输入', () => {
      // @ts-ignore
      const result1 = detector.determineInitialKnot(null);
      expect(result1).toBe('game_start');
      
      // @ts-ignore
      const result2 = detector.determineInitialKnot(undefined);
      expect(result2).toBe('game_start');
    });
  });

  describe('自定义流程映射', () => {
    test('应该正确添加和使用自定义映射', () => {
      detector.addKnotFlowMapping('custom_knot', ['target1', 'target2'], 'target1');
      
      const result = detector.predictTargetKnot('custom_knot', 0);
      expect(result).toBe('target1');
      
      const result2 = detector.predictTargetKnot('custom_knot', 1);
      expect(result2).toBe('target2');
      
      const result3 = detector.predictTargetKnot('custom_knot', 999);
      expect(result3).toBe('target1'); // 默认目标
    });

    test('应该处理无默认目标的映射', () => {
      detector.addKnotFlowMapping('no_default', ['target1']);
      
      const result = detector.predictTargetKnot('no_default', 999);
      expect(result).toBe('no_default'); // 保持当前knot
    });

    test('应该获取流程映射', () => {
      const flowMap = detector.getKnotFlowMap();
      expect(flowMap).toBeDefined();
      expect(flowMap['game_start']).toBeDefined();
    });
  });

  describe('便捷函数测试', () => {
    test('quickDetectKnot应该正常工作', () => {
      const story = createMockStory({
        callStack: {
          elements: [{ currentPointer: { container: { name: 'test_knot' } } }]
        }
      });
      
      const result = quickDetectKnot(story as any);
      expect(result).toBe('test_knot');
    });

    test('detectKnotAfterChoice便捷函数应该正常工作', () => {
      const story = createMockStory();
      const result = detectKnotAfterChoice(story as any, 'game_start', 0);
      expect(result).toBe('character_setup');
    });

    test('便捷函数应该处理异常输入', () => {
      // @ts-ignore
      const result1 = quickDetectKnot(null);
      expect(result1).toBe('start');
      
      // @ts-ignore
      const result2 = detectKnotAfterChoice(null, 'test', 0);
      expect(result2).toBe('test');
    });
  });

  describe('内存和性能测试', () => {
    test('应该能够处理大量的callStack元素', () => {
      const elements = [];
      for (let i = 0; i < 1000; i++) {
        elements.push({
          currentPointer: { container: { name: `c-${i}` } }
        });
      }
      elements.push({
        currentPointer: { container: { name: 'valid_knot' } }
      });
      
      const story = createMockStory({
        callStack: { elements }
      });
      
      const start = Date.now();
      const result = detector.detectFromCallStack(story as any);
      const duration = Date.now() - start;
      
      expect(result).toBe('valid_knot');
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    test('应该能够处理深层嵌套的pathString', () => {
      const deepPath = Array(100).fill('c-0').join('.') + '.valid_knot.' + Array(100).fill('b').join('.');
      const story = createMockStory({
        currentPathString: deepPath
      });
      
      const start = Date.now();
      const result = detector.detectFromPathString(story as any);
      const duration = Date.now() - start;
      
      expect(result).toBe('valid_knot');
      expect(duration).toBeLessThan(50);
    });
  });

  describe('并发和状态隔离测试', () => {
    test('多个检测器实例应该状态隔离', () => {
      const detector1 = new InkKnotDetector();
      const detector2 = new InkKnotDetector();
      
      detector1.updateLastKnownKnot('knot1');
      detector2.updateLastKnownKnot('knot2');
      
      expect(detector1.getLastKnownKnot()).toBe('knot1');
      expect(detector2.getLastKnownKnot()).toBe('knot2');
    });

    test('检测器应该是线程安全的', async () => {
      const story = createMockStory({
        callStack: {
          elements: [{ currentPointer: { container: { name: 'test_knot' } } }]
        }
      });
      
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              const result = detector.getCurrentKnotName(story as any);
              resolve(result);
            }, Math.random() * 10);
          })
        );
      }
      
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBe('test_knot');
      });
    });
  });
});

// 如果在Node.js环境中运行，导出测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createMockStory,
    InkKnotDetector
  };
}