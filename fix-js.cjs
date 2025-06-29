// Final JavaScript fix script
const fs = require('fs');
const path = require('path');

function fixJavaScriptFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix common TypeScript to JavaScript conversion issues
  content = content
    // Fix property declarations without =
    .replace(/^(\s+)(\w+)\s+(new\s|[\w\[\]]+\s*;)/gm, '$1$2 = $3')
    .replace(/^(\s+)(\w+)\s+(\d+);/gm, '$1$2 = $3;')
    .replace(/^(\s+)(\w+)\s+(true|false);/gm, '$1$2 = $3;')
    .replace(/^(\s+)(\w+)\s+\[\];/gm, '$1$2 = [];')
    
    // Remove return type annotations
    .replace(/\)\s*:\s*[\w\[\]|&<>]+(\s*{)/g, ')$1')
    .replace(/\)\s*:\s*[\w\[\]|&<>]+\s+(\||\&)\s*[\w\[\]|&<>]+(\s*{)/g, ')$2')
    
    // Fix broken comparison operators
    .replace(/(\w+)\s+(<|>|<=|>=)\s*(\w+)/g, '$1 $2 $3')
    .replace(/if\s*\(\s*Math\.random\(\)\s+</g, 'if (Math.random() <')
    .replace(/if\s*\(\s*(\w+)\s+>/g, 'if ($1 >')
    .replace(/if\s*\(\s*(\w+)\s+</g, 'if ($1 <')
    
    // Fix method signatures
    .replace(/(\w+)\(([^)]*)\)\s*:\s*[\w\[\]|&<>]+(\s*{)/g, '$1($2)$3')
    
    // Fix variable declarations
    .replace(/(const|let|var)\s+(\w+)\s*:\s*[\w\[\]|&<>]+(\s*=)/g, '$1 $2$3')
    
    // Fix RegExp issues
    .replace(/\/\//g, '\\/\\/')
    
    // Clean up any remaining type annotations
    .replace(/:\s*[\w\[\]|&<>]+(\s*[;,=)])/g, '$1')
    
    // Fix non-null assertions
    .replace(/!/g, '')
    
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .replace(/;\s*;/g, ';')
    .replace(/\s*\n\s*/g, '\n');
    
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Find and fix all JS files
function findAndFixFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findAndFixFiles(fullPath);
    } else if (file.endsWith('.js') && !file.endsWith('.test.js')) {
      try {
        fixJavaScriptFile(fullPath);
      } catch (error) {
        console.error(`Error fixing ${fullPath}:`, error.message);
      }
    }
  }
}

console.log('Fixing JavaScript files...');
findAndFixFiles(path.join(__dirname, 'src'));
console.log('Fix complete!');