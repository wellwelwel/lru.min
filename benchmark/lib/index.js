import { execSync } from 'node:child_process';
import Benchmark from 'benchmark';

const exec = (command) => {
  // execSync(command, { stdio: 'inherit' });
  execSync(command, { stdio: 'ignore' });
};

console.log();

console.log('› \x1b[1mNode.js\x1b[0m');
{
  const suite = new Benchmark.Suite();
  const results = new Map();

  suite
    .add('lru-cache  ', () => {
      exec('node ./lib/lru-cache.js');
    })
    .add('quick-lru  ', () => {
      exec('node ./lib/quick-lru.js');
    })
    .add('lru.min    ', () => {
      exec('node ./lib/lru.min.js');
    })
    .on('cycle', (event) => {
      const name = event.target.name.trim();
      const result = {
        opsPerSec: event.target.hz,
        percentage: event.target.stats.rme,
      };

      results.set(name, result);
      console.log(
        `${event.target.name} x ${result.opsPerSec.toFixed(2)} ops/sec — ±${result.percentage.toFixed(2)}% (${event.target.stats.sample.length} runs sampled)`
      );
    })
    .on('complete', function () {
      const fatest = String(this.filter('fastest').map('name')).trim();

      console.log(`\n🚀 Fastest is \x1b[1m${fatest}\x1b[0m\n`);

      if (!/^lru.min/.test(fatest)) {
        process.exit(1);
      }
    })
    .run({ async: false });
}

console.log('› \x1b[1mBun\x1b[0m');
{
  const suite = new Benchmark.Suite();
  const results = new Map();

  suite
    .add('lru-cache  ', () => {
      exec('bun ./lib/lru-cache.js');
    })
    .add('quick-lru  ', () => {
      exec('bun ./lib/quick-lru.js');
    })
    .add('lru.min    ', () => {
      exec('bun ./lib/lru.min.js');
    })
    .on('cycle', (event) => {
      const name = event.target.name.trim();
      const result = {
        opsPerSec: event.target.hz,
        percentage: event.target.stats.rme,
      };

      results.set(name, result);
      console.log(
        `${event.target.name} x ${result.opsPerSec.toFixed(2)} ops/sec — ±${result.percentage.toFixed(2)}% (${event.target.stats.sample.length} runs sampled)`
      );
    })
    .on('complete', function () {
      const fatest = String(this.filter('fastest').map('name')).trim();

      console.log(`\n🚀 Fastest is \x1b[1m${fatest}\x1b[0m\n`);

      if (!/^lru.min/.test(fatest)) {
        process.exit(1);
      }
    })
    .run({ async: false });
}

console.log('› \x1b[1mDeno\x1b[0m');
{
  const suite = new Benchmark.Suite();
  const results = new Map();

  suite
    .add('lru-cache  ', () => {
      exec('deno run ./lib/lru-cache.js');
    })
    .add('quick-lru  ', () => {
      exec('deno run ./lib/quick-lru.js');
    })
    .add('lru.min    ', () => {
      exec('deno run ./lib/lru.min.js');
    })
    .on('cycle', (event) => {
      const name = event.target.name.trim();
      const result = {
        opsPerSec: event.target.hz,
        percentage: event.target.stats.rme,
      };

      results.set(name, result);
      console.log(
        `${event.target.name} x ${result.opsPerSec.toFixed(2)} ops/sec — ±${result.percentage.toFixed(2)}% (${event.target.stats.sample.length} runs sampled)`
      );
    })
    .on('complete', function () {
      const fatest = String(this.filter('fastest').map('name')).trim();

      console.log(`\n🚀 Fastest is \x1b[1m${fatest}\x1b[0m\n`);

      if (!/^lru.min/.test(fatest)) {
        process.exit(1);
      }
    })
    .run({ async: false });
}
