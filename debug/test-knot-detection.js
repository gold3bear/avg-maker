// Test script for knot detection functionality
// Run this in the browser console when the AVG Maker app is loaded

console.log('🧪 Starting Knot Detection Test...');

// Test the UnifiedKnotManager functionality if available
function testUnifiedKnotManager() {
  try {
    // Check if we can access the UnifiedKnotManager
    if (typeof window.__DEV_TESTING__ !== 'undefined') {
      console.log('✅ Development testing utilities are available');
    }
    
    // Check if currentStoryForDebug is available (set by Preview component)
    if (typeof window.currentStoryForDebug !== 'undefined') {
      const story = window.currentStoryForDebug;
      console.log('✅ Current story instance found:', story);
      
      // Test basic story state inspection
      console.log('📊 Story State Analysis:');
      console.log('  - canContinue:', story.canContinue);
      console.log('  - currentChoices:', story.currentChoices?.length || 0);
      console.log('  - currentPathString:', story.state?.currentPathString);
      
      if (story.state?.callStack?.elements?.length > 0) {
        const topElement = story.state.callStack.elements[story.state.callStack.elements.length - 1];
        console.log('  - top callStack container:', topElement.currentPointer?.container?.name);
      }
      
      return true;
    } else {
      console.log('❌ No story instance found. Load a story first.');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing UnifiedKnotManager:', error);
    return false;
  }
}

// Test function to be called manually
function runKnotDetectionTest() {
  console.log('🚀 Running Knot Detection Test Suite...');
  
  const results = {
    unifiedManager: testUnifiedKnotManager(),
  };
  
  console.log('📋 Test Results Summary:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${test}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return results;
}

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:
1. Load an Ink story in the Preview panel
2. Make some choices to navigate through the story
3. Open the History panel to verify knot names are correct
4. Run: runKnotDetectionTest()
5. Check console output for detailed analysis

Expected behavior:
- Knot names should show actual knot names like "character_setup", "profession_choice"
- NOT internal identifiers like "c-0", "b", "g-0"
- History records should have meaningful knot names
`);

// Make the test function globally available
window.runKnotDetectionTest = runKnotDetectionTest;
window.testUnifiedKnotManager = testUnifiedKnotManager;

console.log('✅ Test script loaded. Run runKnotDetectionTest() to begin testing.');