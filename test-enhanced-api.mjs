// Comprehensive test for enhanced inkjs API
import { Story } from 'inkjs';
import fs from 'fs';

console.log('🧪 Enhanced API Comprehensive Test\n');

try {
  const storyJson = fs.readFileSync('./story/temp.ink.json', 'utf8');
  const story = new Story(storyJson);
  
  console.log('📍 Testing All Enhanced Methods:');
  console.log('1. getCurrentKnotName():', story.getCurrentKnotName());
  
  const knotInfo = story.getCurrentKnotInfo();
  console.log('2. getCurrentKnotInfo():', {
    name: knotInfo.name,
    isValid: knotInfo.isValid,
    visitCount: knotInfo.visitCount
  });
  
  const allKnots = story.getAllKnotNames();
  console.log('3. getAllKnotNames() - Total:', allKnots.length);
  console.log('   First 5 knots:', allKnots.slice(0, 5));
  
  const validKnots = allKnots.filter(k => !k.match(/^[cg]-\d+$/) && k !== 'b');
  console.log('   Valid knots found:', validKnots.length);
  
  // Test getKnotInfo for a specific knot
  if (validKnots.length > 0) {
    const testKnot = validKnots[0];
    console.log('4. getKnotInfo("' + testKnot + '"):', story.getKnotInfo(testKnot));
  }
  
  // Execute story to get to choices
  let steps = 0;
  console.log('\n▶️ Executing Story:');
  while (story.canContinue && story.currentChoices.length === 0 && steps < 10) {
    const text = story.Continue();
    steps++;
    const currentKnot = story.getCurrentKnotName();
    console.log(`Step ${steps}: Currently in "${currentKnot}"`);
    console.log(`  Text: ${text.trim().substring(0, 50)}...`);
  }
  
  console.log('\n🔀 Testing Choice Prediction:');
  console.log('Available choices:', story.currentChoices.length);
  if (story.currentChoices.length > 0) {
    story.currentChoices.forEach((choice, i) => {
      console.log(`Choice ${i}: ${choice.text.substring(0, 40)}...`);
      const prediction = story.predictChoiceTarget(i);
      console.log(`  → Target: ${prediction.targetKnot} (confidence: ${prediction.confidence})`);
    });
  }
  
  console.log('\n🎯 Testing Key Features:');
  console.log('✅ Enhanced methods available:', [
    'getCurrentKnotName',
    'getCurrentKnotInfo', 
    'getAllKnotNames',
    'getKnotInfo',
    'predictChoiceTarget'
  ].every(method => typeof story[method] === 'function'));
  
  console.log('✅ Smart filtering working:', 
    !allKnots.some(k => k.match(/^[cg]-\d+$/) || k === 'b' || k === 'global decl'));
  
  console.log('✅ Real knot names detected:', validKnots.length > 0);
  
  console.log('\n✅ Enhanced API test completed successfully!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}