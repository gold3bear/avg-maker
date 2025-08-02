#!/usr/bin/env node

// 深度调试knot检测逻辑
const fs = require('fs');
const { Story } = require('../inkjs-fork/dist/ink.js');

console.log('🔍 Deep debugging knot detection...');

const inklecateJson = JSON.parse(fs.readFileSync('./story/simple_test.json', 'utf8'));
const story = new Story(JSON.stringify(inklecateJson));

// 开始故事
story.Continue();

console.log('\n📍 Debugging current pointer state:');
const pointer = story.state.currentPointer;
console.log('  - Pointer isNull:', pointer.isNull);
console.log('  - Container exists:', !!pointer.container);

if (pointer.container) {
  const container = pointer.container;
  console.log('  - Container name:', container.name);
  console.log('  - Container path length:', container.path?.length || 0);
  
  if (container.path && container.path.length > 0) {
    console.log('  - Path components:');
    for (let i = 0; i < container.path.length; i++) {
      const component = container.path.GetComponent(i);
      const componentStr = component ? component.toString() : 'null';
      console.log(`    [${i}]: "${componentStr}"`);
    }
  }
  
  // 检查父容器链
  console.log('  - Parent chain:');
  let parent = container.parent;
  let level = 0;
  while (parent && level < 10) {
    console.log(`    Parent[${level}]:`, parent.name || 'unnamed', typeof parent);
    parent = parent.parent;
    level++;
  }
}