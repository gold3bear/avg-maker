// Debug enhanced InkJS API
console.log('🔍 Debugging Enhanced InkJS API...\n');

try {
    const { Story } = await import('inkjs');
    const fs = await import('fs');
    
    // Use a real story JSON
    const storyJson = fs.readFileSync('./story/temp.ink.json', 'utf8');
    const story = new Story(storyJson);
    
    console.log('✅ Story created successfully');
    
    // Debug story state before any execution
    console.log('\n📊 Initial Story State:');
    console.log('- canContinue:', story.canContinue);
    console.log('- currentChoices length:', story.currentChoices.length);
    console.log('- state.currentPointer.isNull:', story.state.currentPointer.isNull);
    
    if (!story.state.currentPointer.isNull) {
        console.log('- currentPointer.container:', !!story.state.currentPointer.container);
        if (story.state.currentPointer.container) {
            console.log('- container.name:', story.state.currentPointer.container.name);
            console.log('- container.path:', story.state.currentPointer.container.path?.componentsString);
            console.log('- container.path.length:', story.state.currentPointer.container.path?.length);
        }
    }
    
    // Test enhanced API before execution
    console.log('\n🧪 Enhanced API Before Execution:');
    if (typeof story.getCurrentKnotName === 'function') {
        const currentKnot = story.getCurrentKnotName();
        console.log('- getCurrentKnotName():', `"${currentKnot}"`);
    }
    
    if (typeof story.getAllKnotNames === 'function') {
        const allKnots = story.getAllKnotNames();
        console.log('- getAllKnotNames():', allKnots);
        console.log('- knot count:', allKnots.length);
    }
    
    // Execute the story a bit
    console.log('\n▶️ Executing Story...');
    let stepCount = 0;
    while (story.canContinue && stepCount < 3) {
        const text = story.Continue();
        stepCount++;
        console.log(`Step ${stepCount}:`, text.trim().substring(0, 50) + '...');
        
        // Check knot name after each step
        if (typeof story.getCurrentKnotName === 'function') {
            const currentKnot = story.getCurrentKnotName();
            console.log(`  Current knot: "${currentKnot}"`);
        }
        
        // Debug current pointer state
        if (!story.state.currentPointer.isNull && story.state.currentPointer.container) {
            const container = story.state.currentPointer.container;
            console.log(`  Container name: "${container.name || 'null'}"`);
            console.log(`  Container path: "${container.path?.componentsString || 'null'}"`);
            
            if (container.path && container.path.length > 0) {
                console.log('  Path components:');
                for (let i = 0; i < container.path.length; i++) {
                    const component = container.path.GetComponent(i);
                    if (component) {
                        console.log(`    [${i}]: "${component.toString()}"`);
                    }
                }
            }
        }
        
        console.log('---');
    }
    
    // Show choices if available
    if (story.currentChoices.length > 0) {
        console.log('\n🔀 Available Choices:');
        story.currentChoices.forEach((choice, index) => {
            console.log(`${index}: ${choice.text}`);
        });
        
        // Test choice prediction
        if (typeof story.predictChoiceTarget === 'function') {
            const prediction = story.predictChoiceTarget(0);
            console.log(`\n🎯 Choice 0 prediction:`, prediction);
        }
    }
    
} catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
}