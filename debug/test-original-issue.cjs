#!/usr/bin/env node

// 测试原始的knot transition问题
const fs = require('fs');
const { Story } = require('inkjs');

console.log('🔍 Testing original knot transition issue...');

// 编译test_knot_fix.ink
const { execSync } = require('child_process');
try {
  execSync('./bin/inklecate -c -o story/test_knot_fix.ink.json story/test_knot_fix.ink', {cwd: '.'});
  console.log('✅ Compiled test_knot_fix.ink');
} catch (e) {
  console.error('❌ Compilation failed:', e.message);
  process.exit(1);
}

const storyJson = fs.readFileSync('./story/test_knot_fix.ink.json', 'utf8');
const story = new Story(storyJson);

function logKnotState(stage) {
  console.log(`\n📍 ${stage}:`);
  try {
    const knotInfo = story.getCurrentKnotInfo();
    console.log(`  🎯 Current knot: "${knotInfo.name}" (visitCount: ${knotInfo.visitCount})`);
    console.log(`  📍 Path: "${knotInfo.path}"`);
    console.log(`  ✅ Valid: ${knotInfo.isValid}`);
  } catch (e) {
    console.log(`  ❌ Enhanced API failed: ${e.message}`);
  }
}

logKnotState('Initial state');

// 开始故事
console.log('\n➡️  Starting story...');
const text1 = story.Continue();
console.log(`Text: "${text1.trim()}"`);
logKnotState('After initial Continue()');

// 检查是否有选择
if (story.currentChoices.length > 0) {
  console.log('\n📋 Available choices:');
  story.currentChoices.forEach((choice, i) => {
    console.log(`  [${i}] ${choice.text.trim()}`);
  });
  
  // 选择触发直接跳转的选项
  console.log('\n➡️  Making choice 0 (should trigger day1_start -> day1_first_reaction)...');
  story.ChooseChoiceIndex(0);
  logKnotState('After choice (before Continue)');
  
  const text2 = story.Continue();
  console.log(`Text: "${text2.trim()}"`);
  logKnotState('After Continue (should be in day1_first_reaction)');
  
  // 这里应该检测出正确的knot名称
  const finalKnotInfo = story.getCurrentKnotInfo();
  if (finalKnotInfo.name === 'day1_first_reaction') {
    console.log('\n🎉 SUCCESS: Enhanced API correctly detected direct jump to day1_first_reaction');
  } else if (finalKnotInfo.name === 'unknown') {
    console.log('\n⚠️  PARTIAL: Enhanced API returned "unknown" (timing issue, but no crash)');
  } else {
    console.log(`\n❓ UNEXPECTED: Enhanced API returned "${finalKnotInfo.name}"`);
  }
}