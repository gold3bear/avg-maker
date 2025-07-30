// 简单的测试脚本来验证预览服务器
const http = require('http');

function testServer(port, path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data.substring(0, 200) + (data.length > 200 ? '...' : '')
                });
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function runTests() {
    console.log('Testing Preview Server...\n');
    
    const tests = [
        { port: 3001, path: '/api/current-file', name: 'Current File API' },
        { port: 3001, path: '/preview', name: 'Preview Page' },
        { port: 5173, path: '/', name: 'Vite Dev Server' }
    ];
    
    for (const test of tests) {
        try {
            console.log(`Testing ${test.name} (${test.port}${test.path})...`);
            const result = await testServer(test.port, test.path);
            console.log(`✅ Status: ${result.status}`);
            console.log(`📄 Content preview: ${result.body.replace(/\n/g, ' ')}\n`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}\n`);
        }
    }
}

runTests().then(() => {
    console.log('Tests completed');
    process.exit(0);
}).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
});