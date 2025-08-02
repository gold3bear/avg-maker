#!/usr/bin/env node

// 比较两种编译器的输出
const fs = require('fs');

console.log('🔍 Comparing inklecate vs inkjs compilation outputs...');

// 读取inklecate编译的结果
if (!fs.existsSync('./story/simple_test.json')) {
  console.error('❌ inklecate output not found. Please run: ./bin/inklecate -c -o story/simple_test.json story/simple_test.ink');
  process.exit(1);
}

const inklecateJson = JSON.parse(fs.readFileSync('./story/simple_test.json', 'utf8'));
console.log('✅ Loaded inklecate JSON');

// 尝试用inkjs运行时解析inklecate生成的JSON
try {
  const { Story } = require('./inkjs-fork/dist/ink.js');
  const story = new Story(JSON.stringify(inklecateJson));
  console.log('✅ inkjs runtime successfully parsed inklecate JSON');
  
  // 测试enhanced API
  try {
    const knotInfo = story.getCurrentKnotInfo();
    console.log('✅ Enhanced API works with inklecate JSON:', knotInfo.name);
  } catch (e) {
    console.error('❌ Enhanced API failed with inklecate JSON:', e.message);
    
    // 检查具体的容器状态
    console.log('\n🔍 Debugging container states...');
    const storyState = story.state;
    const currentContainer = storyState.currentContainer;
    if (currentContainer) {
      console.log('Current container visitsShouldBeCounted:', currentContainer.visitsShouldBeCounted);
      console.log('Current container countFlags:', currentContainer.countFlags);
    }
  }
  
} catch (e) {
  console.error('❌ Failed to create Story from inklecate JSON:', e.message);
}