const fs = require('fs');
const path = require('path');

const projectDir = '.';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    // Skip node_modules, .git, dist, etc.
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.idea' || file === 'find_invalid_utf8.js') {
      return;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      const ext = path.extname(file);
      if (['.vue', '.js', '.ts', '.css', '.html', '.json', '.svg'].includes(ext)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('Scanning project files for UTF-8 encoding errors...');
const files = walk(projectDir);
let invalidFilesCount = 0;

files.forEach(file => {
  try {
    const buffer = fs.readFileSync(file);
    const str = buffer.toString('utf8');
    const backToBuffer = Buffer.from(str, 'utf8');
    
    if (Buffer.compare(buffer, backToBuffer) !== 0) {
      console.log(`\nInvalid UTF-8 sequence found in: ${file}`);
      invalidFilesCount++;
      
      const minLength = Math.min(buffer.length, backToBuffer.length);
      for (let i = 0; i < minLength; i++) {
        if (buffer[i] !== backToBuffer[i]) {
          console.log(`  Mismatch at byte offset ${i}: original byte 0x${buffer[i].toString(16)}, decoded/re-encoded sequence: 0x${backToBuffer[i].toString(16)}`);
          const start = Math.max(0, i - 50);
          const end = Math.min(buffer.length, i + 50);
          console.log(`  Surrounding context: "${buffer.slice(start, end).toString('utf8').replace(/\r?\n/g, ' ')}"`);
          break;
        }
      }
    }
  } catch (err) {
    console.error(`Error reading file ${file}:`, err.message);
  }
});

console.log(`\nScan finished. Found ${invalidFilesCount} invalid UTF-8 files.`);
