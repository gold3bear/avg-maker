#!/usr/bin/env node

// 调试故事状态变化
const fs = require('fs');
const { Story } = require('inkjs');

console.log('🔍 Debugging story state changes...');

const inklecateJson = JSON.parse(fs.readFileSync('./story/simple_test.json', 'utf8'));
const story = new Story(JSON.stringify(inklecateJson));

function checkPointerState(stage) {
  console.log(`\n📍 ${stage}:`);
  const pointer = story.state.currentPointer;
  console.log('  - Pointer isNull:', pointer.isNull);
  console.log('  - Container exists:', !!pointer.container);
  console.log('  - Story can continue:', story.canContinue);
  console.log('  - Current choices:', story.currentChoices.length);
  
  if (pointer.container) {
    console.log('  - Container name:', pointer.container.name);
    console.log('  - Container path:', pointer.container.path?.toString() || 'no path');
  }
}

checkPointerState('Initial state');

console.log('\n➡️  Calling Continue()...');
const text = story.Continue();
console.log('Text output:', JSON.stringify(text));

checkPointerState('After Continue()');

if (story.currentChoices.length > 0) {
  console.log('\n➡️  Making choice 0...');
  story.ChooseChoiceIndex(0);
  checkPointerState('After choice');
  
  const text2 = story.Continue();
  console.log('Text output:', JSON.stringify(text2));
  checkPointerState('After second Continue()');
}