#!/usr/bin/env node

// 测试Ink的执行模型，理解内容生成和knot跳转的关系
const fs = require('fs');
const { Story } = require('inkjs');

console.log('🔬 TESTING: Ink Execution Model');
console.log('   Understanding the relationship between Continue() and knot transitions\n');

// 创建一个更简单的测试用例来理解执行模型
const testInkContent = `
-> start

=== start ===
This is start content.
-> middle

=== middle ===  
This is middle content.
-> end

=== end ===
This is end content.
-> END
`;

// 编译测试内容
const { execSync } = require('child_process');
fs.writeFileSync('./test-execution-model.ink', testInkContent);

try {
  execSync('./bin/inklecate -c -o test-execution-model.json test-execution-model.ink');
  console.log('✅ Compiled test story');
} catch (e) {
  console.error('❌ Compilation failed:', e.message);
  process.exit(1);
}

const storyJson = fs.readFileSync('./test-execution-model.json', 'utf8');
const story = new Story(storyJson);

class SimpleKnotTracker {
  getCurrentKnotInfo(story) {
    try {
      const knotInfo = story.getCurrentKnotInfo?.();
      if (knotInfo && knotInfo.name && knotInfo.name !== 'unknown') {
        return { name: knotInfo.name, isValid: true };
      }
    } catch (e) {}
    
    return { name: 'unknown', isValid: false };
  }
}

const tracker = new SimpleKnotTracker();

console.log('📋 EXPECTED BEHAVIOR:');
console.log('   Step 1: Continue() should output "This is start content." (from start knot)');
console.log('   Step 2: Continue() should output "This is middle content." (from middle knot)');  
console.log('   Step 3: Continue() should output "This is end content." (from end knot)');
console.log('');

console.log('🔍 ACTUAL EXECUTION:');

let step = 0;
while (story.canContinue && step < 10) {
  step++;
  
  // 检查Continue()前的状态
  const beforeKnot = tracker.getCurrentKnotInfo(story);
  
  // 获取一些内部状态信息
  const beforePointer = story.state?.currentPointer;
  const beforePath = beforePointer?.container?.path?.toString() || 'no path';
  
  console.log(`\n--- Step ${step} ---`);
  console.log(`BEFORE Continue():`);
  console.log(`  Current knot: "${beforeKnot.name}" (valid: ${beforeKnot.isValid})`);
  console.log(`  Pointer path: "${beforePath}"`);
  console.log(`  Can continue: ${story.canContinue}`);
  
  // 执行Continue()
  const output = story.Continue();
  
  // 检查Continue()后的状态
  const afterKnot = tracker.getCurrentKnotInfo(story);
  const afterPointer = story.state?.currentPointer;
  const afterPath = afterPointer?.container?.path?.toString() || 'no path';
  
  console.log(`AFTER Continue():`);
  console.log(`  Generated output: "${output?.trim() || 'empty'}"`);
  console.log(`  Current knot: "${afterKnot.name}" (valid: ${afterKnot.isValid})`);
  console.log(`  Pointer path: "${afterPath}"`);
  console.log(`  Can continue: ${story.canContinue}`);
  
  // 分析内容归属
  console.log(`ANALYSIS:`);
  if (beforeKnot.name !== afterKnot.name) {
    console.log(`  🔄 Knot transition: ${beforeKnot.name} → ${afterKnot.name}`);
    console.log(`  📝 Content "${output?.trim()}" was generated during transition`);
    console.log(`  🤔 Question: Which knot does this content belong to?`);
    
    // 分析路径变化
    if (beforePath !== afterPath) {
      console.log(`  📍 Path changed: "${beforePath}" → "${afterPath}"`);
    }
  } else {
    console.log(`  ✅ No knot change, content clearly belongs to: ${afterKnot.name}`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log('💡 INSIGHTS FROM EXECUTION MODEL TEST:');
console.log(`${'='.repeat(60)}`);

console.log(`
Based on this test, we can understand:

1. 🎯 CONTENT OWNERSHIP TIMING:
   - Continue() generates content that belongs to the knot it's ENTERING
   - The "before" knot state may be misleading for content attribution
   - Content should be attributed to the "after" knot state

2. 🔄 KNOT TRANSITION DETECTION:
   - Knot changes are detected by comparing before/after states
   - But content generated during transition belongs to the target knot
   - We need to buffer content correctly based on target knot

3. 🛠️ FIXING STRATEGY:
   - Always attribute Continue() output to the resulting knot state
   - Handle knot transitions by finalizing previous knot's content BEFORE adding new content
   - Use proper buffering to ensure content-knot alignment
`);

// 清理测试文件
try {
  fs.unlinkSync('./test-execution-model.ink');
  fs.unlinkSync('./test-execution-model.json');
} catch (e) {
  // 忽略清理错误
}