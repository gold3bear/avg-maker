#!/usr/bin/env node

// 测试visit counting是否正常工作
const fs = require('fs');
const { Story } = require('inkjs');

console.log('🔍 Testing visit counting debug...');

// 使用已编译的simple_test.json
const storyJsonPath = './story/simple_test.json';

if (!fs.existsSync(storyJsonPath)) {
  console.error('❌ Story JSON not found. Please compile story/simple_test.ink first');
  process.exit(1);
}

const storyJson = fs.readFileSync(storyJsonPath, 'utf8');
console.log('✅ Loaded story JSON');

try {
  const story = new Story(storyJson);
  console.log('✅ Story initialized');
  
  // 测试enhanced API
  console.log('\n🔧 Testing enhanced API...');
  
  try {
    const knotInfo = story.getCurrentKnotInfo();
    console.log('✅ getCurrentKnotInfo() succeeded:', knotInfo);
  } catch (e) {
    console.error('❌ getCurrentKnotInfo() failed:', e.message);
  }
  
  try {
    const allKnots = story.getAllKnotNames();
    console.log('✅ getAllKnotNames() succeeded:', allKnots);
  } catch (e) {
    console.error('❌ getAllKnotNames() failed:', e.message);
  }
  
} catch (e) {
  console.error('❌ Story initialization failed:', e.message);
}