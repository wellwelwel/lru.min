import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { LRUCache } from 'lru-cache';
import QuickLRU from 'quick-lru';
import { createLRU } from '../lib/index.mjs';

const benchmarkName = process.argv[2];

const measurePerformance = (fn) => {
  const startTime = performance.now();
  const startCpu = process.cpuUsage();

  fn();

  const endTime = performance.now();
  const endCpu = process.cpuUsage(startCpu);

  return {
    time: endTime - startTime,
    cpu: endCpu.user + endCpu.system,
  };
};

const times = 10;
const max = 100000;
const brute = 1000000;

const benchmarks = {
  'lru-cache': () => {
    let event = 0;
    return new LRUCache({ max, ttl: 1000, dispose: () => event++ });
  },
  'quick-lru': () => {
    let event = 0;
    return new QuickLRU({
      maxSize: max,
      maxAge: 1000,
      onEviction: () => event++,
    });
  },
  'lru.min': () => {
    let event = 0;
    return createLRU({ max, staleAt: 1000, onEviction: () => event++ });
  },
};

const benchmark = (createCache) => {
  if (global?.gc) global.gc();

  const cache = createCache();
  const results = { time: 0, cpu: 0 };

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
    results.cpu += result.cpu;

    // cache.clear(); // quick-lru doesn't evict on `clear`
  }

  return {
    time: results.time / times,
    cpu: results.cpu / times,
  };
};

const result = benchmark(benchmarks[benchmarkName]);

process.send(result);
process.exit();
