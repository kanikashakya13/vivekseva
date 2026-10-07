const fs = require('fs');

const files = ['index.html', 'css/styles.css', 'js/data.js', 'js/matching.js', 'js/app.js'];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // check for assets
  const assetMatches = content.match(/assets\/[^\s"'()]+/g);
  if (assetMatches) console.log(f, 'assets matches:', assetMatches);

  // check for any absolute Windows paths
  const winPaths = content.match(/[a-zA-Z]:\\[^\s"'()]+/g);
  if (winPaths) console.log(f, 'Windows paths:', winPaths);

  // check for localhost
  const localhostMatches = content.match(/localhost:[0-9]+/g);
  if (localhostMatches) console.log(f, 'localhost matches:', localhostMatches);
});

console.log('Path check finished.');
