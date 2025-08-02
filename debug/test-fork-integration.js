// Test script to verify our fork integration is working
// This can be run in the browser console when AVG Maker is loaded

console.log('🧪 Testing Fork Integration...\n');

// Function to test if our enhanced API is available
function testEnhancedAPI() {
  try {
    // Check if we can access the current story instance
    if (typeof window.currentStoryForDebug !== 'undefined') {
      const story = window.currentStoryForDebug;
      console.log('✅ Story instance found:', story);
      
      // Test our enhanced methods
      console.log('\n📍 Testing Enhanced API Methods:');
      
      // Test getCurrentKnotName
      if (typeof story.getCurrentKnotName === 'function') {
        const currentKnot = story.getCurrentKnotName();
        console.log('✅ getCurrentKnotName():', currentKnot);
        
        // Check if it's a valid knot name (not internal identifier)
        const isValid = currentKnot !== 'unknown' && 
                       !currentKnot.match(/^[cg]-\d+$/) && 
                       currentKnot !== 'b';
        console.log('   Valid knot name:', isValid ? '✅' : '❌');
      } else {
        console.log('❌ getCurrentKnotName() not available');
      }
      
      // Test getCurrentKnotInfo
      if (typeof story.getCurrentKnotInfo === 'function') {
        const knotInfo = story.getCurrentKnotInfo();
        console.log('✅ getCurrentKnotInfo():', knotInfo);
      } else {
        console.log('❌ getCurrentKnotInfo() not available');
      }
      
      // Test getAllKnotNames
      if (typeof story.getAllKnotNames === 'function') {
        const allKnots = story.getAllKnotNames();
        console.log('✅ getAllKnotNames():', allKnots);
        console.log('   Found knots:', allKnots.length);
      } else {
        console.log('❌ getAllKnotNames() not available');
      }
      
      // Test predictChoiceTarget
      if (typeof story.predictChoiceTarget === 'function' && story.currentChoices.length > 0) {
        const prediction = story.predictChoiceTarget(0);
        console.log('✅ predictChoiceTarget(0):', prediction);
      } else if (typeof story.predictChoiceTarget === 'function') {
        console.log('✅ predictChoiceTarget() available (no choices to test)');
      } else {
        console.log('❌ predictChoiceTarget() not available');
      }
      
      console.log('\n🎉 Enhanced API Test Complete!');
      return true;
      
    } else {
      console.log('❌ No story instance found. Please load a story first.');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Instructions
console.log(`
📋 How to test:
1. Open a story in AVG Maker
2. Open browser developer console (F12)
3. Run: testEnhancedAPI()
4. Check the output for ✅ or ❌ indicators

Expected results with our fork:
- ✅ getCurrentKnotName() should return actual knot names like "character_setup", "profession_choice"
- ❌ Should NOT return internal identifiers like "c-0", "b", "g-0"
- ✅ All enhanced methods should be available
`);

// Make the test function globally available
window.testEnhancedAPI = testEnhancedAPI;

console.log('✅ Test script loaded. Run testEnhancedAPI() to begin testing.');