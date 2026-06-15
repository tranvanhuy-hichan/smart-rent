const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.js') || file.endsWith('.vue')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(srcDir);
console.log(`Found ${files.length} js/vue files.`);

let consoleErrorCount = 0;
let catchCount = 0;
const details = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const hasConsoleError = content.includes('console.error');
  const hasCatch = content.includes('catch');
  
  if (hasConsoleError || hasCatch) {
    let ceMatches = (content.match(/console\.error/g) || []).length;
    let catchMatches = (content.match(/catch\s*\(/g) || []).length;
    consoleErrorCount += ceMatches;
    catchCount += catchMatches;
    details.push({
      file: path.relative(srcDir, file),
      consoleErrors: ceMatches,
      catches: catchMatches
    });
  }
});

console.log(`Total console.error: ${consoleErrorCount}`);
console.log(`Total catches: ${catchCount}`);
console.log(`Files to modify: ${details.length}`);
console.log(JSON.stringify(details, null, 2));
