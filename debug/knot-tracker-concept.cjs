#!/usr/bin/env node

// 混合方案：保留inkjs runtime + 自实现knot tracking
const fs = require('fs');
const { Story } = require('inkjs');

class KnotTracker {
  constructor(storyJson) {
    this.storyData = JSON.parse(storyJson);
    this.currentKnot = 'unknown';
    this.visitCounts = new Map();
    this.knotContainers = this._extractKnotContainers();
    
    console.log('📚 Extracted knots:', Object.keys(this.knotContainers));
  }
  
  // 从inklecate JSON中提取所有knot容器
  _extractKnotContainers() {
    const knots = {};
    
    function traverse(obj, path = []) {
      if (typeof obj === 'object' && obj !== null) {
        // 检查是否是knot容器（有#n属性表示名称）
        if (obj['#n'] && typeof obj['#n'] === 'string') {
          const knotName = obj['#n'];
          knots[knotName] = {
            name: knotName,
            path: path.join('.'),
            container: obj,
            hasVisitCount: !!obj['#f']
          };
        }
        
        // 递归遍历所有属性
        for (const [key, value] of Object.entries(obj)) {
          if (key !== '#n' && key !== '#f') {
            traverse(value, [...path, key]);
          }
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          traverse(item, [...path, index.toString()]);
        });
      }
    }
    
    traverse(this.storyData.root);
    return knots;
  }
  
  // 基于story状态推断当前knot
  inferCurrentKnot(story) {
    try {
      // 尝试使用enhanced API
      const knotInfo = story.getCurrentKnotInfo();
      if (knotInfo.name && knotInfo.name !== 'unknown') {
        this.currentKnot = knotInfo.name;
        return knotInfo.name;
      }
    } catch (e) {
      // Enhanced API失败，使用fallback
    }
    
    // Fallback: 基于故事输出和状态推断
    const pointer = story.state?.currentPointer;
    if (pointer && pointer.container) {
      const path = pointer.container.path?.toString() || '';
      
      // 从路径中提取knot名称
      for (const [knotName, knotInfo] of Object.entries(this.knotContainers)) {
        if (path.includes(knotName)) {
          this.currentKnot = knotName;
          return knotName;
        }
      }
    }
    
    return this.currentKnot;
  }
  
  // 获取所有knot名称
  getAllKnotNames() {
    return Object.keys(this.knotContainers).sort();
  }
  
  // 获取当前knot详细信息
  getCurrentKnotInfo(story) {
    const knotName = this.inferCurrentKnot(story);
    const knotData = this.knotContainers[knotName];
    
    return {
      name: knotName,
      path: knotData?.path || '',
      visitCount: this.visitCounts.get(knotName) || 0,
      isValid: knotName !== 'unknown',
      hasVisitCount: knotData?.hasVisitCount || false
    };
  }
  
  // 记录knot访问
  recordVisit(knotName) {
    const current = this.visitCounts.get(knotName) || 0;
    this.visitCounts.set(knotName, current + 1);
  }
}

// 测试概念验证
console.log('🔍 Testing hybrid knot tracking approach...');

const storyJson = fs.readFileSync('./story/test_knot_fix.ink.json', 'utf8');
const story = new Story(storyJson);
const tracker = new KnotTracker(storyJson);

function testKnotTracking(stage) {
  console.log(`\n📍 ${stage}:`);
  const knotInfo = tracker.getCurrentKnotInfo(story);
  console.log(`  🎯 Tracker detected: "${knotInfo.name}" (visitCount: ${knotInfo.visitCount})`);
  console.log(`  📍 Path: "${knotInfo.path}"`);
  console.log(`  ✅ Valid: ${knotInfo.isValid}`);
}

testKnotTracking('Initial state');

const text1 = story.Continue();
console.log(`\n➡️ Text: "${text1.trim()}"`);
testKnotTracking('After Continue()');

if (story.currentChoices.length > 0) {
  console.log('\n➡️ Making choice 0...');
  story.ChooseChoiceIndex(0);
  testKnotTracking('After choice');
  
  const text2 = story.Continue();
  console.log(`\n➡️ Text: "${text2.trim()}"`);
  testKnotTracking('After second Continue()');
}