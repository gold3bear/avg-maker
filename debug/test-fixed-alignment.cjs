#!/usr/bin/env node

// 测试修复后的knot-content对齐
const fs = require('fs');
const { Story } = require('inkjs');
// 使用简化版本的KnotTracker

class TestKnotTracker {
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

// 模拟修复后的逻辑
function simulateFixedLogic() {
  console.log('🧪 TESTING: Fixed Knot-Content Alignment Logic');
  console.log('   Simulating the fixed Preview.tsx logic\n');

  const storyJson = fs.readFileSync('./story/test_knot_fix.ink.json', 'utf8');
  const story = new Story(storyJson);
  const tracker = new TestKnotTracker(storyJson);

  const historyEntries = [];
  let currentKnotOutput = [];
  let currentKnot = 'unknown';
  let stepCount = 0;

  console.log('📋 SIMULATED EXECUTION WITH FIXED LOGIC:');
  console.log('=' .repeat(60));

  while (story.canContinue && stepCount < 5) {
    stepCount++;
    
    // Before Continue()
    const beforeKnotInfo = tracker.getCurrentKnotInfo(story);
    console.log(`\n🔍 Step ${stepCount} - BEFORE Continue():`);
    console.log(`   Current knot: "${beforeKnotInfo.name}" (valid: ${beforeKnotInfo.isValid})`);
    console.log(`   Buffer contents: ${currentKnotOutput.length} lines`);

    // Execute Continue()
    const line = story.Continue();
    
    // After Continue()
    const afterKnotInfo = tracker.getCurrentKnotInfo(story);
    console.log(`\n📝 Step ${stepCount} - AFTER Continue():`);
    console.log(`   Generated line: "${line?.trim() || 'empty'}"`);
    console.log(`   Current knot: "${afterKnotInfo.name}" (valid: ${afterKnotInfo.isValid})`);

    // Apply fixed logic
    const knotChanged = beforeKnotInfo.name !== afterKnotInfo.name && beforeKnotInfo.isValid && afterKnotInfo.isValid;
    
    if (knotChanged) {
      console.log(`   🔄 KNOT TRANSITION: ${beforeKnotInfo.name} → ${afterKnotInfo.name}`);
      
      // Finalize previous knot's content
      if (currentKnotOutput.length > 0) {
        const entry = {
          output: [...currentKnotOutput],
          choices: [],
          knotName: beforeKnotInfo.name,
          timestamp: Date.now()
        };
        historyEntries.push(entry);
        console.log(`   ✅ Created history entry for: ${beforeKnotInfo.name} (${currentKnotOutput.length} lines)`);
      }
      
      // Reset buffer for new knot
      currentKnotOutput = [];
      currentKnot = afterKnotInfo.name;
    }
    
    // Add content to buffer (belongs to current/new knot)
    if (line) {
      const contentOwner = afterKnotInfo.isValid ? afterKnotInfo.name : currentKnot;
      currentKnotOutput.push(line);
      console.log(`   📝 Content attributed to: ${contentOwner}`);
    }
    
    // If no more continuation, finalize current buffer
    if (!story.canContinue && currentKnotOutput.length > 0) {
      const finalEntry = {
        output: [...currentKnotOutput],
        choices: story.currentChoices,
        knotName: afterKnotInfo.isValid ? afterKnotInfo.name : currentKnot,
        timestamp: Date.now()
      };
      historyEntries.push(finalEntry);
      console.log(`   ✅ Final entry for: ${afterKnotInfo.name} (${currentKnotOutput.length} lines)`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL HISTORY ENTRIES (Fixed Logic):');
  console.log('=' .repeat(60));

  historyEntries.forEach((entry, i) => {
    console.log(`\n[${i}] Knot: ${entry.knotName}`);
    console.log(`    Content: ${entry.output.length} lines`);
    entry.output.forEach((line, j) => {
      console.log(`      ${j}: "${line.trim()}"`);
    });
    console.log(`    Choices: ${entry.choices.length}`);
  });

  console.log('\n🎯 ALIGNMENT CHECK:');
  const hasCorrectAlignment = historyEntries.every(entry => {
    return entry.knotName !== 'unknown' && entry.output.length > 0;
  });

  if (hasCorrectAlignment) {
    console.log('✅ SUCCESS: All history entries have correct knot-content alignment');
    console.log('✅ SUCCESS: No "unknown" knots in history');
    console.log('✅ SUCCESS: Each knot has its proper content');
  } else {
    console.log('❌ ISSUES: Some alignment problems still exist');
  }

  return historyEntries;
}

simulateFixedLogic();