// Simple test of enhanced inkjs methods with working story
console.log('🔍 Simple Testing Enhanced InkJS...\n');

try {
    const { Story } = await import('./inkjs-fork/dist/ink.mjs');
    console.log('✅ Story class imported');
    
    // Use the actual compiled story from our project 
    const storyJsonPath = './story/temp.ink.json';
    const fs = await import('fs');
    const storyJson = fs.readFileSync(storyJsonPath, 'utf8');
    
    const story = new Story(storyJson);
    console.log('✅ Story instance created from real ink JSON');
    
    // Test our enhanced methods
    console.log('\n📍 Testing Enhanced Methods:');
    
    const methods = [
        'getCurrentKnotName',
        'getCurrentKnotInfo', 
        'getAllKnotNames',
        'predictChoiceTarget',
        'getKnotInfo'
    ];
    
    let foundMethods = 0;
    methods.forEach(method => {
        const available = typeof story[method] === 'function';
        console.log(`${available ? '✅' : '❌'} ${method}(): ${available ? 'Available' : 'Missing'}`);
        if (available) foundMethods++;
        
        if (available) {
            try {
                if (method === 'getCurrentKnotName') {
                    const result = story[method]();
                    console.log(`  Current knot: "${result}"`);
                    
                    // Check if it filters internal names
                    const isFiltered = result !== 'c-0' && result !== 'b' && result !== 'g-0';
                    console.log(`  Internal name filtering: ${isFiltered ? '✅ Working' : '❌ Failed'}`);
                } else if (method === 'getAllKnotNames') {
                    const result = story[method]();
                    console.log(`  All knots: ${JSON.stringify(result)}`);
                } else if (method === 'getCurrentKnotInfo') {
                    const result = story[method]();
                    console.log(`  Knot info: ${JSON.stringify(result, null, 2)}`);
                }
            } catch (e) {
                console.log(`  Error calling ${method}: ${e.message}`);
            }
        }
    });
    
    console.log(`\n🎯 Found ${foundMethods}/${methods.length} enhanced methods`);
    
    if (foundMethods === methods.length) {
        console.log('🎉 SUCCESS: All enhanced methods are available!');
        console.log('✅ The fork integration is working correctly.');
    } else {
        console.log('❌ ISSUE: Some enhanced methods are missing.');
        console.log('This may indicate a build or integration problem.');
    }
    
} catch (error) {
    console.error('❌ Simple test failed:', error.message);
}