const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Check script tags
const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/gi;
let m;
const scripts = [];
while ((m = scriptRegex.exec(html)) !== null) {
  scripts.push(m[1]);
}
console.log('Scripts:', scripts);

// Check link tags
const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*>/gi;
const links = [];
while ((m = linkRegex.exec(html)) !== null) {
  links.push(m[1]);
}
console.log('Links:', links);

// Check images
const imgRegex = /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;
const imgs = [];
while ((m = imgRegex.exec(html)) !== null) {
  imgs.push(m[1]);
}
console.log('Images:', imgs);

// Check all inline handlers
const handlerRegex = /\b(on[a-z]+)=["']([^"']+)["']/gi;
const handlers = [];
while ((m = handlerRegex.exec(html)) !== null) {
  handlers.push({ event: m[1], code: m[2] });
}
console.log('Total inline handlers:', handlers.length);

// Extract window.app.* method calls
const appCalls = new Set();
handlers.forEach(h => {
  const matches = h.code.matchAll(/window\.app\.([a-zA-Z0-9_]+)\s*\(/g);
  for (const match of matches) {
    appCalls.add(match[1]);
  }
});
console.log('Called window.app methods:', [...appCalls]);

// Now check if each method exists in VivekSevaApp
const appJs = fs.readFileSync('js/app.js', 'utf8');
const missingMethods = [];
for (const method of appCalls) {
  const methodRegex = new RegExp(`\\b${method}\\s*\\(`, 'g');
  if (!methodRegex.test(appJs)) {
    missingMethods.push(method);
  }
}
console.log('Missing methods in app.js:', missingMethods);
