import { performance } from 'node:perf_hooks';
import { LRUCache } from 'lru-cache';
import { createLRU } from '../lib/index.mjs';
import QuickLRU from 'quick-lru';

const results = new Map();

const measurePerformance = (fn) => {
  const startTime = performance.now();

  fn();

  const endTime = performance.now();

  return {
    time: endTime - startTime,
  };
};

const times = 10;
const max = 100000;
const brute = 1000000;

const benchmark = (createCache) => {
  const cache = createCache();
  const results = { time: 0 };

  for (let i = 0; i < times; i++) {
    const result = measurePerformance(() => {
      for (let j = 0; j < brute; j++) {
        cache.set(`key-${j}`, j);

        if (j > 0 && j % 3 === 0) {
          const randomIndex = Math.floor(Math.random() * j);
          cache.get(`key-${randomIndex}`);
        }

        if (j > 0 && j % 5 === 0) {
          const randomIndex = Math.floor(Math.random() * j);
          cache.delete(`key-${randomIndex}`);
        }
      }
    });

    results.time += result.time;

    cache.clear();
  }

  return {
    time: results.time / times,
  };
};

results.set(
  'lru-cache',
  benchmark(() => new LRUCache({ max }))
);
results.set(
  'quick-lru',
  benchmark(() => new QuickLRU({ maxSize: max }))
);
results.set(
  'lru.min',
  benchmark(() => createLRU({ max }))
);

const time = [...results.entries()].sort((a, b) => a[1].time - b[1].time);

console.log('ES Modules');

for (const [name, result] of time)
  console.log(`${name}: ${result.time.toFixed(2)}ms`);
