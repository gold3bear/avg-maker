// Direct test of enhanced inkjs methods
console.log('🔍 Direct Testing Enhanced InkJS...\n');

// Try importing from the compiled file directly
try {
    const inkjsModule = await import('inkjs');
    console.log('✅ Direct import successful');
    console.log('Module exports:', Object.keys(inkjsModule));
    
    const { Story } = inkjsModule;
    console.log('✅ Story class imported');
    
    // Create a test story
    const testJSON = {
        "inkVersion": 21,
        "root": [
            "^Hello World!",
            "\n",
            ["done", {"#f": 5}]
        ],
        "listDefs": {}
    };
    
    const story = new Story(JSON.stringify(testJSON));
    console.log('✅ Story instance created');
    
    // Test our enhanced methods
    console.log('\n📍 Testing Enhanced Methods:');
    
    const methods = [
        'getCurrentKnotName',
        'getCurrentKnotInfo', 
        'getAllKnotNames',
        'predictChoiceTarget',
        'getKnotInfo'
    ];
    
    methods.forEach(method => {
        const available = typeof story[method] === 'function';
        console.log(`${available ? '✅' : '❌'} ${method}(): ${available ? 'Available' : 'Missing'}`);
        
        if (available) {
            try {
                if (method === 'getCurrentKnotName') {
                    const result = story[method]();
                    console.log(`  Result: "${result}"`);
                } else if (method === 'getAllKnotNames') {
                    const result = story[method]();
                    console.log(`  Result: ${JSON.stringify(result)}`);
                }
            } catch (e) {
                console.log(`  Error calling ${method}: ${e.message}`);
            }
        }
    });
    
} catch (error) {
    console.error('❌ Direct test failed:', error.message);
}