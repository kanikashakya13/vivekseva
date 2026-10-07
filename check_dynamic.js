const fs = require('fs');
const appJs = fs.readFileSync('js/app.js', 'utf8');

// Find all onclick/onchange/onsubmit in template strings in app.js
const regex = /\b(on[a-z]+)=["']([^"']+)["']/gi;
let m;
const dynamicCalls = new Set();
while ((m = regex.exec(appJs)) !== null) {
  const code = m[2];
  const matches = code.matchAll(/(?:window\.)?app\.([a-zA-Z0-9_]+)\s*\(/g);
  for (const match of matches) {
    dynamicCalls.add(match[1]);
  }
}

console.log('Dynamic calls in app.js templates:', [...dynamicCalls]);

// Check which ones are defined on VivekSevaApp
const missingDynamic = [];
for (const method of dynamicCalls) {
  const methodRegex = new RegExp(`\\b${method}\\s*\\(`, 'g');
  // Check if defined as a method
  const matchCount = (appJs.match(methodRegex) || []).length;
  // If only 1 occurrence (the call itself), it might be missing
  if (matchCount <= 1) {
    missingDynamic.push(method);
  }
}
console.log('Potentially missing dynamic methods:', missingDynamic);
