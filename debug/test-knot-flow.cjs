#!/usr/bin/env node

// 测试完整的knot flow
const fs = require('fs');
const { Story } = require('inkjs');

console.log('🔍 Testing complete knot flow...');

const inklecateJson = JSON.parse(fs.readFileSync('./story/simple_test.json', 'utf8'));
const story = new Story(JSON.stringify(inklecateJson));

console.log('✅ Story initialized');

// 测试开始状态
console.log('\n1️⃣ Initial state:');
try {
  const knotInfo = story.getCurrentKnotInfo();
  console.log('   Knot:', knotInfo.name, 'VisitCount:', knotInfo.visitCount);
} catch (e) {
  console.log('   ❌ Enhanced API failed:', e.message);
}

// 开始故事
console.log('\n2️⃣ After Continue():');
const text1 = story.Continue();
console.log('   Text:', text1.trim());
try {
  const knotInfo = story.getCurrentKnotInfo();
  console.log('   Knot:', knotInfo.name, 'VisitCount:', knotInfo.visitCount);
} catch (e) {
  console.log('   ❌ Enhanced API failed:', e.message);
}

// 选择
if (story.currentChoices.length > 0) {
  console.log('\n3️⃣ Available choices:');
  story.currentChoices.forEach((choice, i) => {
    console.log(`   ${i}: ${choice.text.trim()}`);
  });
  
  console.log('\n4️⃣ After making choice 0:');
  story.ChooseChoiceIndex(0);
  const text2 = story.Continue();
  console.log('   Text:', text2.trim());
  
  try {
    const knotInfo = story.getCurrentKnotInfo();
    console.log('   Knot:', knotInfo.name, 'VisitCount:', knotInfo.visitCount);
  } catch (e) {
    console.log('   ❌ Enhanced API failed:', e.message);
  }
}