#!/usr/bin/env node

// 调试knot-content对齐问题
const fs = require('fs');
const { Story } = require('../inkjs-fork/dist/ink.js');

class DebugKnotTracker {
  constructor(storyJson) {
    this.storyData = JSON.parse(storyJson);
    this.currentKnot = 'unknown';
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
            knots[key] = { name: key };
          }
        }
      }
    }
    return knots;
  }
  
  getCurrentKnotInfo(story) {
    try {
      const knotInfo = story.getCurrentKnotInfo?.();
      if (knotInfo && knotInfo.name && knotInfo.name !== 'unknown') {
        this.currentKnot = knotInfo.name;
        return { name: knotInfo.name, isValid: true };
      }
    } catch (e) {}
    
    const pointer = story.state?.currentPointer;
    if (pointer && pointer.container && pointer.container.path) {
      const pathStr = pointer.container.path.toString();
      for (const knotName of Object.keys(this.knotInfo)) {
        if (pathStr.startsWith(knotName)) {
          this.currentKnot = knotName;
          return { name: knotName, isValid: true };
        }
      }
    }
    
    return { name: this.currentKnot, isValid: this.currentKnot !== 'unknown' };
  }
}

console.log('🔍 DEBUGGING: Knot-Content Alignment Issues');
console.log('   Analyzing timing of knot detection vs content generation\n');

const storyJson = fs.readFileSync('./story/test_knot_fix.ink.json', 'utf8');
const story = new Story(storyJson);
const tracker = new DebugKnotTracker(storyJson);

let stepCount = 0;
const debugHistory = [];

console.log('='.repeat(80));
console.log('🎯 STEP-BY-STEP ANALYSIS');
console.log('='.repeat(80));

while (story.canContinue && stepCount < 10) {
  stepCount++;
  
  // 1. 记录Continue()前的状态
  const beforeKnot = tracker.getCurrentKnotInfo(story);
  const beforeCanContinue = story.canContinue;
  const beforeChoices = story.currentChoices.length;
  
  console.log(`\n📍 STEP ${stepCount} - BEFORE Continue():`);
  console.log(`   Current knot: "${beforeKnot.name}" (valid: ${beforeKnot.isValid})`);
  console.log(`   Can continue: ${beforeCanContinue}`);
  console.log(`   Choices: ${beforeChoices}`);
  
  // 2. 执行Continue()并立即检查结果
  const line = story.Continue();
  
  // 3. 记录Continue()后的状态
  const afterKnot = tracker.getCurrentKnotInfo(story);
  const afterCanContinue = story.canContinue;
  const afterChoices = story.currentChoices.length;
  
  console.log(`\n📍 STEP ${stepCount} - AFTER Continue():`);
  console.log(`   Generated line: "${line?.trim() || 'empty'}"`);
  console.log(`   Current knot: "${afterKnot.name}" (valid: ${afterKnot.isValid})`);
  console.log(`   Can continue: ${afterCanContinue}`);
  console.log(`   Choices: ${afterChoices}`);
  
  // 4. 分析knot变化和内容归属
  const knotChanged = beforeKnot.name !== afterKnot.name;
  console.log(`\n🔬 ANALYSIS:`);
  console.log(`   Knot changed: ${knotChanged} (${beforeKnot.name} → ${afterKnot.name})`);
  
  if (line && line.trim()) {
    if (knotChanged) {
      console.log(`   ⚠️  CONTENT ATTRIBUTION ISSUE:`);
      console.log(`      Line "${line.trim()}" generated during knot transition`);
      console.log(`      Question: Does this belong to "${beforeKnot.name}" or "${afterKnot.name}"?`);
      console.log(`      Current logic assigns it to: "${afterKnot.name}"`);
    } else {
      console.log(`   ✅ Content attribution clear: "${line.trim()}" belongs to "${afterKnot.name}"`);
    }
  }
  
  // 5. 记录调试信息
  debugHistory.push({
    step: stepCount,
    beforeKnot: beforeKnot.name,
    afterKnot: afterKnot.name,
    line: line?.trim() || 'empty',
    knotChanged,
    contentAttribution: knotChanged ? 'UNCLEAR' : 'CLEAR'
  });
  
  console.log(`   ${'─'.repeat(60)}`);
  
  // 如果有选择出现，停止分析
  if (afterChoices > 0) {
    console.log(`\n🎯 CHOICES APPEARED - Analysis will continue with choice handling`);
    break;
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY OF ISSUES FOUND');
console.log('='.repeat(80));

const contentIssues = debugHistory.filter(entry => entry.contentAttribution === 'UNCLEAR');
const knotTransitions = debugHistory.filter(entry => entry.knotChanged);

console.log(`\n🔍 Analysis Results:`);
console.log(`   Total steps analyzed: ${debugHistory.length}`);
console.log(`   Knot transitions detected: ${knotTransitions.length}`);
console.log(`   Content attribution issues: ${contentIssues.length}`);

if (contentIssues.length > 0) {
  console.log(`\n⚠️  PROBLEMATIC STEPS:`);
  contentIssues.forEach(issue => {
    console.log(`   Step ${issue.step}: "${issue.line}" (${issue.beforeKnot} → ${issue.afterKnot})`);
  });
  
  console.log(`\n💡 ROOT CAUSE:`);
  console.log(`   The Continue() method may generate content that belongs to the NEW knot,`);
  console.log(`   but our logic tries to attribute it based on timing, which is unreliable.`);
  
  console.log(`\n🔧 PROPOSED SOLUTION:`);
  console.log(`   1. Pre-analyze story structure to predict content ownership`);
  console.log(`   2. Use Ink's internal state to determine content source`);
  console.log(`   3. Separate content generation from knot detection`);
  console.log(`   4. Buffer content properly based on actual ownership`);
} else {
  console.log(`\n✅ No content attribution issues found in this scenario`);
}

console.log(`\n📋 DETAILED LOG:`);
debugHistory.forEach(entry => {
  const status = entry.contentAttribution === 'UNCLEAR' ? '⚠️ ' : '✅ ';
  console.log(`   ${status}Step ${entry.step}: ${entry.beforeKnot} → ${entry.afterKnot} | "${entry.line}"`);
});