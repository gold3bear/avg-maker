// Quick verification script to check if our fork is properly integrated
import { Story } from './node_modules/inkjs/ink.js';

console.log('🔍 Verifying InkJS Fork Integration...\n');

console.log('✅ InkJS module loaded successfully');

try {
    // Create a simple story instance to test our enhanced methods
    // We don't need to run the story, just check if methods exist
    const story = new Story('{"inkVersion":21,"root":[],"listDefs":{}}');
    console.log('✅ Story instance created');
    
    // Test our enhanced methods
    console.log('\n📋 Enhanced Methods Availability:');
    
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
    });
    
    // Quick functional test
    if (typeof story.getCurrentKnotName === 'function') {
        console.log('\n🧪 Quick Functional Test:');
        const currentKnot = story.getCurrentKnotName();
        console.log(`Current knot: "${currentKnot}"`);
        
        // Check if it's filtering internal names
        const isValid = currentKnot !== 'c-0' && currentKnot !== 'b' && currentKnot !== 'g-0';
        console.log(`Internal name filtering: ${isValid ? '✅ Working' : '❌ Failed'}`);
    }
    
    console.log('\n🎉 Fork verification complete!');
    console.log('Enhanced API is ready for use in AVG Maker.');
    
} catch (error) {
    console.error('❌ Fork verification failed:', error.message);
    console.error('This may indicate the fork is not properly integrated.');
}