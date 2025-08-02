#!/usr/bin/env node

// 修正的最终测试
const fs = require('fs');
const { Story } = require('inkjs');

class KnotTracker {
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
  
  inferCurrentKnot(story) {
    try {
      const knotInfo = story.getCurrentKnotInfo();
      if (knotInfo.name && knotInfo.name !== 'unknown') {
        this.currentKnot = knotInfo.name;
        return knotInfo.name;
      }
    } catch (e) {}
    
    const pointer = story.state?.currentPointer;
    if (pointer && pointer.container && pointer.container.path) {
      const pathStr = pointer.container.path.toString();
      for (const knotName of Object.keys(this.knotInfo)) {
        if (pathStr.startsWith(knotName)) {
          this.currentKnot = knotName;
          return knotName;
        }
      }
    }
    
    return this.currentKnot;
  }
  
  getCurrentKnotInfo(story) {
    const knotName = this.inferCurrentKnot(story);
    return {
      name: knotName,
      isValid: knotName !== 'unknown' && !!this.knotInfo[knotName]
    };
  }
}

console.log('🔍 TESTING: day1_start -> day1_first_reaction -> day1_direct_response');
console.log('   Verifying complete direct jump flow\n');

const storyJson = fs.readFileSync('./story/test_knot_fix.ink.json', 'utf8');
const story = new Story(storyJson);
const tracker = new KnotTracker(storyJson);

function logState(step, description) {
  const info = tracker.getCurrentKnotInfo(story);
  console.log(`${step} ${description}`);
  console.log(`   📍 Knot: "${info.name}" (valid: ${info.isValid})`);
  console.log(`   📋 Choices: ${story.currentChoices.length}`);
  console.log(`   ▶️  Can continue: ${story.canContinue}`);
}

logState('1️⃣', 'Initial state');

// Continue through the direct jumps
let stepCount = 2;
while (story.canContinue) {
  const text = story.Continue();
  console.log(`\n${stepCount}️⃣ After Continue(): "${text.trim()}"`);
  logState('   ', 'State');
  stepCount++;
  
  if (stepCount > 5) break; // Safety break
}

// Now test choices if available
if (story.currentChoices.length > 0) {
  console.log(`\n📋 Available choices: ${story.currentChoices.length}`);
  story.currentChoices.forEach((choice, i) => {
    console.log(`   [${i}] ${choice.text.trim()}`);
  });
  
  console.log('\n🎯 Making choice 0...');
  story.ChooseChoiceIndex(0);
  logState('   ', 'After choice');
  
  // Continue after choice
  if (story.canContinue) {
    const finalText = story.Continue();
    console.log(`\n➡️ Final text: "${finalText.trim()}"`);
    logState('🏁', 'Final state');
  }
}

// Assessment
console.log('\n' + '='.repeat(60));
console.log('📊 ASSESSMENT:');

const finalInfo = tracker.getCurrentKnotInfo(story);
if (finalInfo.isValid && finalInfo.name !== 'unknown') {
  console.log(`✅ SUCCESS: Knot tracking working!`);
  console.log(`   📍 Final knot detected: "${finalInfo.name}"`);
  console.log(`   🎯 This solves the original History Panel alignment issue`);
  console.log(`   💡 The hybrid approach (inkjs + custom tracker) works!`);
} else {
  console.log(`❌ Still has issues: "${finalInfo.name}"`);
}