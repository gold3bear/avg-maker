// Debug module resolution to see which inkjs is being loaded
console.log('🔍 Debugging Module Resolution...\n');

try {
    // Import from the exact path that AVG Maker uses
    const { Story } = await import('inkjs');
    console.log('✅ InkJS imported successfully');
    
    // Check Story constructor and prototype
    console.log('📊 Story Analysis:');
    console.log('- Story constructor:', typeof Story);
    console.log('- Story.name:', Story.name);
    console.log('- Story.length:', Story.length);
    
    // Create an instance and check methods
    console.log('\n🧪 Creating Story Instance...');
    
    // Use a real story JSON file
    const fs = await import('fs');
    const storyJson = fs.readFileSync('./story/temp.ink.json', 'utf8');
    
    const story = new Story(storyJson);
    console.log('✅ Story instance created');
    
    // Check all methods on the story instance
    console.log('\n🔍 Story Instance Methods:');
    const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(story));
    console.log('- All methods:', allMethods.length);
    console.log('- Methods list:', allMethods.slice(0, 10), '...'); // First 10 methods
    
    // Specifically check for our enhanced methods
    console.log('\n🎯 Enhanced Method Check:');
    const enhancedMethods = [
        'getCurrentKnotName',
        'getCurrentKnotInfo',
        'getAllKnotNames', 
        'predictChoiceTarget',
        'getKnotInfo'
    ];
    
    enhancedMethods.forEach(method => {
        const exists = typeof story[method] === 'function';
        console.log(`- ${method}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        
        if (exists) {
            console.log(`  Type: ${typeof story[method]}`);
            console.log(`  Function length: ${story[method].length}`);
        }
    });
    
    // Test a method if it exists
    if (typeof story.getAllKnotNames === 'function') {
        try {
            const knots = story.getAllKnotNames();
            console.log('\n📋 getAllKnotNames result:', knots);
        } catch (e) {
            console.warn('Error calling getAllKnotNames:', e.message);
        }
    }
    
    // Check which file was actually loaded
    console.log('\n📁 Module Resolution Info:');
    try {
        const module = await import.meta.resolve('inkjs');
        console.log('- Resolved module path:', module);
    } catch (e) {
        console.warn('Could not resolve module path:', e.message);
    }
    
} catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
}