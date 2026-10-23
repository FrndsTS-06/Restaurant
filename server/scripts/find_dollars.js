const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
      results.push(full);
    }
  });
  return results;
}

const files = [
  ...walk(path.resolve(__dirname, '../../client/src')),
  ...walk(path.resolve(__dirname, '../src')),
  ...walk(path.resolve(__dirname, '../scripts'))
];
const dollarMatches = [];


files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const regex = /\$(?!\{)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      dollarMatches.push({ file: path.relative(path.resolve(__dirname, '../../'), f), line: idx + 1, content: line.trim() });
    }
  });
});

console.log('Total non-template $ occurrences in client/src:', dollarMatches.length);
dollarMatches.forEach(m => console.log(`${m.file}:${m.line} -> ${m.content}`));
