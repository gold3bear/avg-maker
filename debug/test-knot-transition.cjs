#!/usr/bin/env node

// 测试knot transition detection
const fs = require('fs');
const { Story } = require('inkjs');

console.log('🔍 Testing knot transition detection...');

// 使用test_knot_fix.ink
const storyJsonPath = './story/test_knot_fix.ink.json';

if (!fs.existsSync(storyJsonPath)) {
  console.error('❌ Story JSON not found. Compiling test_knot_fix.ink...');
  const { execSync } = require('child_process');
  try {
    execSync('./bin/inklecate -c -o story/test_knot_fix.ink.json story/test_knot_fix.ink', {cwd: '.'});
    console.log('✅ Compiled test_knot_fix.ink');
  } catch (e) {
    console.error('❌ Compilation failed:', e.message);
    process.exit(1);
  }
}

const storyJson = fs.readFileSync(storyJsonPath, 'utf8');
console.log('✅ Loaded story JSON');

try {
  const story = new Story(storyJson);
  console.log('✅ Story initialized');
  
  // 模拟原始问题：day1_start -> day1_first_reaction
  console.log('\n🔧 Starting story...');
  let currentText = story.Continue();
  console.log('Initial text:', currentText.trim());
  
  let currentKnot = story.getCurrentKnotInfo();
  console.log('Current knot:', currentKnot.name);
  
  if (story.currentChoices.length > 0) {
    console.log('\n🔧 Making choice to trigger direct jump...');
    console.log('Available choices:', story.currentChoices.map(c => c.text));
    
    // 选择第一个选项触发直接跳转
    story.ChooseChoiceIndex(0);
    currentText = story.Continue();
    console.log('After choice text:', currentText.trim());
    
    currentKnot = story.getCurrentKnotInfo();
    console.log('Current knot after direct jump:', currentKnot.name);
    console.log('Visit count:', currentKnot.visitCount);
    
    if (currentKnot.name === 'day1_first_reaction') {
      console.log('✅ Enhanced API correctly detected direct jump to day1_first_reaction');
    } else if (currentKnot.name === 'unknown') {
      console.log('❌ Enhanced API still shows "unknown" - direct jump detection failed');
    } else {
      console.log('🤔 Unexpected knot name:', currentKnot.name);
    }
  }
  
} catch (e) {
  console.error('❌ Test failed:', e.message);
  console.error(e.stack);
}