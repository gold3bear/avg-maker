// build-preload-fix.js
// Script to convert preload.js from ES modules to CommonJS

const fs = require('fs');
const path = require('path');

const preloadFile = path.join(__dirname, 'dist/electron/preload.js');

if (fs.existsSync(preloadFile)) {
  let content = fs.readFileSync(preloadFile, 'utf8');
  
  // Replace ES6 import with CommonJS require
  content = content.replace(
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"](electron)['"];?/g,
    'const { $1 } = require("$2");'
  );
  
  // Remove any export statements since preload scripts don't export
  content = content.replace(/export\s*{\s*[^}]*\s*};?/g, '');
  content = content.replace(/export\s+interface\s+\w+[^}]*}/g, '');
  content = content.replace(/export\s+type\s+\w+[^;]*;/g, '');
  
  fs.writeFileSync(preloadFile, content);
  console.log('✅ Converted preload.js to CommonJS format');
} else {
  console.log('❌ preload.js not found');
}