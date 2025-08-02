#!/usr/bin/env node

// 改进的混合方案
const fs = require('fs');
const { Story } = require('inkjs');

class ImprovedKnotTracker {
  constructor(storyJson) {
    this.storyData = JSON.parse(storyJson);
    this.currentKnot = 'unknown';
    this.visitCounts = new Map();
    this.knotInfo = this._extractKnotInfo();
    
    console.log('📚 Found knots:', Object.keys(this.knotInfo));
  }
  
  // 改进的knot信息提取
  _extractKnotInfo() {
    const knots = {};
    
    // 直接从root的namedContent中提取knot信息
    if (this.storyData.root && Array.isArray(this.storyData.root)) {
      // 查找终止对象（包含named content的对象）
      const lastItem = this.storyData.root[this.storyData.root.length - 1];
      if (typeof lastItem === 'object' && lastItem !== null) {
        
        // 遍历所有属性寻找knot
        for (const [key, value] of Object.entries(lastItem)) {
          // 跳过特殊属性
          if (key.startsWith('#')) continue;
          
          // 检查是否是容器对象
          if (Array.isArray(value)) {
            knots[key] = {
              name: key,
              container: value,
              hasVisitCount: this._hasVisitCountFlags(value)
            };
          }
        }
      }
    }
    
    return knots;
  }
  
  // 检查容器是否有visit count标记
  _hasVisitCountFlags(container) {
    if (!Array.isArray(container)) return false;
    
    const lastItem = container[container.length - 1];
    return lastItem && typeof lastItem === 'object' && lastItem['#f'];
  }
  
  // 改进的当前knot推断
  inferCurrentKnot(story) {
    // 首先尝试enhanced API
    try {
      const knotInfo = story.getCurrentKnotInfo();
      if (knotInfo.name && knotInfo.name !== 'unknown') {
        this.currentKnot = knotInfo.name;
        this._updateVisitCount(knotInfo.name);
        return knotInfo.name;
      }
    } catch (e) {
      // Enhanced API失败，继续fallback
    }
    
    // Fallback 1: 从pointer路径推断
    const pointer = story.state?.currentPointer;
    if (pointer && pointer.container && pointer.container.path) {
      const pathStr = pointer.container.path.toString();
      
      // 直接检查路径是否以已知knot名称开头
      for (const knotName of Object.keys(this.knotInfo)) {
        if (pathStr.startsWith(knotName)) {
          this.currentKnot = knotName;
          this._updateVisitCount(knotName);
          return knotName;
        }
      }
    }
    
    // Fallback 2: 从故事状态推断
    if (story.canContinue === false && story.currentChoices.length > 0) {
      // 有选择时，尝试从最近的文本输出推断
      // 这是一个启发式方法
    }
    
    return this.currentKnot;
  }
  
  _updateVisitCount(knotName) {
    const current = this.visitCounts.get(knotName) || 0;
    this.visitCounts.set(knotName, current + 1);
  }
  
  getAllKnotNames() {
    return Object.keys(this.knotInfo).sort();
  }
  
  getCurrentKnotInfo(story) {
    const knotName = this.inferCurrentKnot(story);
    const knot = this.knotInfo[knotName];
    
    return {
      name: knotName,
      visitCount: this.visitCounts.get(knotName) || 0,
      isValid: knotName !== 'unknown' && !!knot,
      hasVisitCount: knot?.hasVisitCount || false,
      allKnots: this.getAllKnotNames()
    };
  }
}

// 测试改进版本
console.log('🔍 Testing improved hybrid knot tracking...');

const storyJson = fs.readFileSync('./story/test_knot_fix.ink.json', 'utf8');
const story = new Story(storyJson);
const tracker = new ImprovedKnotTracker(storyJson);

function testImprovedTracking(stage) {
  console.log(`\n📍 ${stage}:`);
  const info = tracker.getCurrentKnotInfo(story);
  console.log(`  🎯 Current knot: "${info.name}" (visits: ${info.visitCount})`);
  console.log(`  ✅ Valid: ${info.isValid}`);
  console.log(`  📚 Available knots: [${info.allKnots.join(', ')}]`);
}

testImprovedTracking('Initial state');

const text1 = story.Continue();
console.log(`\n➡️ After Continue(): "${text1.trim()}"`);
testImprovedTracking('After Continue');

if (story.currentChoices.length > 0) {
  console.log(`\n📋 Choices: ${story.currentChoices.map(c => c.text.trim()).join(', ')}`);
  
  story.ChooseChoiceIndex(0);
  testImprovedTracking('After choice');
  
  const text2 = story.Continue();
  console.log(`\n➡️ After second Continue(): "${text2.trim()}"`);
  testImprovedTracking('Final state');
  
  const finalInfo = tracker.getCurrentKnotInfo(story);
  if (finalInfo.name === 'day1_first_reaction') {
    console.log('\n🎉 SUCCESS: Correctly detected direct jump to day1_first_reaction!');
  } else if (finalInfo.isValid && finalInfo.name !== 'unknown') {
    console.log(`\n✅ GOOD: Detected valid knot "${finalInfo.name}"`);
  } else {
    console.log('\n⚠️  Still needs work, but much better than before!');
  }
}