// Test the getCurrentKnotName method with debugging
import { Story } from 'inkjs';
import fs from 'fs';

console.log('🔧 Testing getCurrentKnotName debugging...\n');

try {
  const storyJson = fs.readFileSync('./story/story.ink.json', 'utf8');
  const story = new Story(storyJson);
  
  console.log('📊 Initial story state:');
  console.log('  - canContinue:', story.canContinue);
  console.log('  - currentChoices:', story.currentChoices.length);
  
  console.log('\n🔄 Testing getCurrentKnotName during story progression:');
  
  // Test 1: Initial state
  console.log('\n1. Initial state:');
  const initialKnotName = story.getCurrentKnotName?.();
  console.log('  - getCurrentKnotName():', initialKnotName);
  
  // Test 2: After first Continue
  if (story.canContinue) {
    console.log('\n2. After first Continue():');
    const line1 = story.Continue();
    console.log('  - Content:', line1.trim());
    const knotName1 = story.getCurrentKnotName?.();
    console.log('  - getCurrentKnotName():', knotName1);
  }
  
  // Test 3: After second Continue  
  if (story.canContinue) {
    console.log('\n3. After second Continue():');
    const line2 = story.Continue();
    console.log('  - Content:', line2.trim());
    const knotName2 = story.getCurrentKnotName?.();
    console.log('  - getCurrentKnotName():', knotName2);
  }
  
  // Test 4: Continue until choices appear
  let step = 4;
  while (story.canContinue && step <= 10) {
    console.log(`\n${step}. Continue step ${step}:`);
    const line = story.Continue();
    console.log('  - Content:', line.trim());
    const knotName = story.getCurrentKnotName?.();
    console.log('  - getCurrentKnotName():', knotName);
    
    if (story.currentChoices.length > 0) {
      console.log('  - Choices found:', story.currentChoices.length);
      break;
    }
    step++;
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}