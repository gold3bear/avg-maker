#!/usr/bin/env node

// 测试修复后的enhanced API
const fs = require('fs');
const { Story } = require('inkjs');

console.log('🔍 Testing fixed enhanced API...');

const inklecateJson = JSON.parse(fs.readFileSync('./story/simple_test.json', 'utf8'));
const story = new Story(JSON.stringify(inklecateJson));

function testEnhancedAPI(stage) {
  console.log(`\n📍 ${stage}:`);
  try {
    const knotInfo = story.getCurrentKnotInfo();
    console.log('  ✅ getCurrentKnotInfo():', knotInfo.name, `(visitCount: ${knotInfo.visitCount})`);
    console.log('  📍 Path:', knotInfo.path);
    console.log('  🎯 Valid:', knotInfo.isValid);
  } catch (e) {
    console.log('  ❌ getCurrentKnotInfo() failed:', e.message);
  }
  
  try {
    const allKnots = story.getAllKnotNames();
    console.log('  ✅ getAllKnotNames():', allKnots);
  } catch (e) {
    console.log('  ❌ getAllKnotNames() failed:', e.message);
  }
}

testEnhancedAPI('Initial state');

const text1 = story.Continue();
console.log('\n➡️  After Continue(), text:', JSON.stringify(text1));
testEnhancedAPI('After Continue()');

if (story.currentChoices.length > 0) {
  console.log('\n➡️  Making choice 0...');
  story.ChooseChoiceIndex(0);
  testEnhancedAPI('After choice');
  
  const text2 = story.Continue();
  console.log('\n➡️  After second Continue(), text:', JSON.stringify(text2));
  testEnhancedAPI('After second Continue()');
}