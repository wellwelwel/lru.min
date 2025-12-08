const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { exit } = require('node:process');

(async () => {
  const [cjsResults, mjsResults] = await Promise.all([
    readFile(join(__dirname, 'results/cjs.json'), 'utf-8').then(JSON.parse),
    readFile(join(__dirname, 'results/mjs.json'), 'utf-8').then(JSON.parse),
  ]);

  const compare = (results) => {
    const lruCache = results.results.find((r) => r.command === 'lru-cache');
    const lruMin = results.results.find((r) => r.command === 'lru.min');

    return lruMin.mean < lruCache.mean;
  };

  if (!compare(cjsResults) || !compare(mjsResults)) exit(1);
})();
