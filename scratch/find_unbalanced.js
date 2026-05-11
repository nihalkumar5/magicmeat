const fs = require('fs');
const content = fs.readFileSync('/Users/nihalkumar/Magicmeat/app.js', 'utf8');
let stack = [];
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') stack.push({ line: i + 1, char: j + 1 });
    if (line[j] === '}') stack.pop();
  }
}
console.log('Unclosed braces opened at:');
stack.forEach(b => console.log(`Line ${b.line}, char ${b.char}`));
