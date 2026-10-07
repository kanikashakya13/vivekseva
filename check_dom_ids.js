const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

// Find all document.getElementById calls in app.js
const regex = /document\.getElementById\(["']([^"']+)["']\)/g;
let m;
const ids = new Set();
while ((m = regex.exec(appJs)) !== null) {
  ids.add(m[1]);
}

const missingIds = [];
for (const id of ids) {
  const pattern = new RegExp(`id=["']${id}["']`, 'i');
  if (!pattern.test(html)) {
    missingIds.push(id);
  }
}

console.log('Total getElementById queries:', ids.size);
console.log('Missing IDs in index.html:', missingIds);
