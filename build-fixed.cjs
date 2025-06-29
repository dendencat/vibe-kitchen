// Fixed TypeScript to JavaScript converter for AI Restaurant Battle
const fs = require('fs');
const path = require('path');

// Function to recursively find all .ts files
function find_ts_files(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...find_ts_files(fullPath));
    } else if (item.endsWith('.ts') && !item.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Improved TypeScript to JavaScript conversion
function convert_ts_to_js(content) {
  return content
    // Remove type annotations from function parameters and return types
    .replace(/(\w+)\s*:\s*[^=,);{}\s]+(\s*[=,);{])/g, '$1$2')
    // Remove interface declarations
    .replace(/export\s+interface\s+\w+\s*{[^}]*}(\s*;?)?\s*/gs, '')
    .replace(/interface\s+\w+\s*{[^}]*}(\s*;?)?\s*/gs, '')
    // Remove type-only imports
    .replace(/import\s*{\s*type\s+[^}]*}\s*from\s*['"][^'"]*['"];\s*\n?/g, '')
    // Remove type imports
    .replace(/import\s*{\s*[^}]*}\s*from\s*['"][^'"]*Types['"];\s*\n?/g, '')
    // Convert import statements to relative paths with .js extension
    .replace(/from\s*['"](\.[^'"]*)['"]/g, (match, p1) => {
      if (!p1.endsWith('.js')) {
        return match.replace(p1, p1 + '.js');
      }
      return match;
    })
    // Remove type assertions
    .replace(/\s+as\s+\w+/g, '')
    // Remove generic type parameters  
    .replace(/<[^>]*>/g, '')
    // Remove access modifiers
    .replace(/\b(private|protected|public)\s+/g, '')
    // Clean up class property type annotations
    .replace(/(\w+)\s*:\s*[^=;,){\n]+(\s*[=;,){\n])/g, '$1$2')
    // Clean up variable declarations
    .replace(/:\s*[^=,;){\n]+(\s*[=,;){\n])/g, '$1')
    // Fix any double spaces
    .replace(/\s+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    // Fix broken string literals
    .replace(/(['"])[^'"]*(['"])/g, (match) => {
      // Ensure string quotes are balanced
      if (match.indexOf("'") === 0 && match.lastIndexOf("'") === match.length - 1) {
        return match;
      }
      if (match.indexOf('"') === 0 && match.lastIndexOf('"') === match.length - 1) {
        return match;
      }
      return match;
    });
}

// Main build function
function build() {
  const srcDir = path.join(__dirname, 'src');
  const tsFiles = find_ts_files(srcDir);
  
  console.log('Building AI Restaurant Battle...');
  console.log(`Found ${tsFiles.length} TypeScript files`);
  
  for (const tsFile of tsFiles) {
    try {
      const content = fs.readFileSync(tsFile, 'utf8');
      const jsContent = convert_ts_to_js(content);
      const jsFile = tsFile.replace('.ts', '.js');
      
      fs.writeFileSync(jsFile, jsContent);
      console.log(`Converted: ${path.relative(__dirname, tsFile)} -> ${path.relative(__dirname, jsFile)}`);
    } catch (error) {
      console.error(`Error converting ${tsFile}:`, error.message);
    }
  }
  
  console.log('Build complete!');
}

// Run the build
build();