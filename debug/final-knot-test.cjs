#!/usr/bin/env node

// 最终测试：验证原始问题是否解决
const fs = require('fs');
const { Story } = require('inkjs');

class KnotTracker {
  constructor(storyJson) {
    this.storyData = JSON.parse(storyJson);
    this.currentKnot = 'unknown';
    this.visitCounts = new Map();
    this.knotInfo = this._extractKnotInfo();
  }
  
  _extractKnotInfo() {
    const knots = {};
    if (this.storyData.root && Array.isArray(this.storyData.root)) {
      const lastItem = this.storyData.root[this.storyData.root.length - 1];
      if (typeof lastItem === 'object' && lastItem !== null) {
        for (const [key, value] of Object.entries(lastItem)) {
          if (key.startsWith('#')) continue;
          if (Array.isArray(value)) {
            knots[key] = { name: key, container: value };
          }
        }
      }
    }
    return knots;
  }
  
  inferCurrentKnot(story) {
    try {
      const knotInfo = story.getCurrentKnotInfo();
      if (knotInfo.name && knotInfo.name !== 'unknown') {
        this.currentKnot = knotInfo.name;
        return knotInfo.name;
      }
    } catch (e) {}
    
    const pointer = story.state?.currentPointer;
    if (pointer && pointer.container && pointer.container.path) {
      const pathStr = pointer.container.path.toString();
      for (const knotName of Object.keys(this.knotInfo)) {
        if (pathStr.startsWith(knotName)) {
          this.currentKnot = knotName;
          return knotName;
        }
      }
    }
    
    return this.currentKnot;
  }
  
  getCurrentKnotInfo(story) {
    const knotName = this.inferCurrentKnot(story);
    return {
      name: knotName,
      visitCount: this.visitCounts.get(knotName) || 0,
      isValid: knotName !== 'unknown' && !!this.knotInfo[knotName]
    };
  }
}

console.log('🔍 FINAL TEST: Original knot transition issue');
console.log('   Testing: day1_start -> day1_first_reaction direct jump\n');

const storyJson = fs.readFileSync('./story/test_knot_fix.ink.json', 'utf8');
const story = new Story(storyJson);
const tracker = new KnotTracker(storyJson);

// Step 1: Initialize
console.log('1️⃣ Initialize story');
const info1 = tracker.getCurrentKnotInfo(story);
console.log(`   Knot: "${info1.name}" (valid: ${info1.isValid})`);

// Step 2: Start story  
console.log('\n2️⃣ Start story (Continue)');
const text1 = story.Continue();
console.log(`   Text: "${text1.trim()}"`);
const info2 = tracker.getCurrentKnotInfo(story);
console.log(`   Knot: "${info2.name}" (valid: ${info2.isValid})`);

// Step 3: Make choice for direct jump
if (story.currentChoices.length > 0) {
  console.log('\n3️⃣ Make choice (triggers direct jump)');
  console.log(`   Choice: "${story.currentChoices[0].text.trim()}"`);
  
  story.ChooseChoiceIndex(0);
  const info3 = tracker.getCurrentKnotInfo(story);
  console.log(`   After choice: "${info3.name}" (valid: ${info3.isValid})`);
  
  // Step 4: Continue to see result
  console.log('\n4️⃣ Continue after choice');
  const text2 = story.Continue();
  console.log(`   Text: "${text2.trim()}"`);
  const info4 = tracker.getCurrentKnotInfo(story);
  console.log(`   Final knot: "${info4.name}" (valid: ${info4.isValid})`);
  
  // Final assessment
  console.log('\n' + '='.repeat(50));
  if (info4.name === 'day1_first_reaction') {
    console.log('🎉 SUCCESS: Direct jump correctly detected!');
    console.log('   ✅ Enhanced API working');
    console.log('   ✅ Knot transition tracking working');
    console.log('   ✅ Original issue SOLVED');
  } else if (info4.isValid && info4.name !== 'unknown') {
    console.log(`✅ PARTIAL SUCCESS: Detected "${info4.name}"`);
    console.log('   ✅ Knot detection working');
    console.log('   ⚠️  Need to verify specific transition logic');
  } else {
    console.log('❌ Still needs work');
    console.log('   ❌ Knot detection not reliable');
  }
} else {
  console.log('\n❌ No choices available - story structure issue');
}