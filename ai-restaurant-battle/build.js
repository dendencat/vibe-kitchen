// Simple TypeScript to JavaScript converter for AI Restaurant Battle
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
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Simple TypeScript to JavaScript conversion
function convert_ts_to_js(content) {
  return content
    // Remove type annotations
    .replace(/:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*(\s*=|,|\)|;)/g, (match) => {
      return match.replace(/:\s*[^=,);]+/, '');
    })
    // Remove interface declarations
    .replace(/export\s+interface\s+\w+\s*{[^}]*}/gs, '')
    .replace(/interface\s+\w+\s*{[^}]*}/gs, '')
    // Remove type imports
    .replace(/import\s*{\s*[^}]*}\s*from\s*['"][^'"]*Types['"];?\n?/g, '')
    // Convert import statements to relative paths with .js extension
    .replace(/from\s*['"](\.[^'"]*)['"]/g, (match, p1) => {
      if (!p1.endsWith('.js')) {
        return match.replace(p1, p1 + '.js');
      }
      return match;
    })
    // Remove type assertions
    .replace(/as\s+\w+/g, '')
    // Remove generic type parameters
    .replace(/<[^>]*>/g, '')
    // Remove access modifiers
    .replace(/\b(private|protected|public)\s+/g, '')
    // Handle class property type annotations
    .replace(/(\w+):\s*[^=;,)]+(\s*[=;,)])/g, '$1$2');
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