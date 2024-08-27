const process = require('node:process');
const { fork } = require('node:child_process');

const benchmarks = ['lru-cache', 'lru.min'];
const results = new Map();

const runBenchmark = (benchmarkName) => {
  return new Promise((resolve) => {
    const child = fork('worker.cjs', [benchmarkName]);

    child.on('message', (result) => {
      resolve(result);
    });

    child.on('exit', () => {
      resolve(null);
    });
  });
};

(async () => {
  for (const benchmark of benchmarks) {
    const result = await runBenchmark(benchmark);
    results.set(benchmark, result);
  }

  const sortedByTime = [...results.entries()].sort(
    (a, b) => a[1].time - b[1].time
  );
  const sortedByCpu = [...results.entries()].sort(
    (a, b) => a[1].cpu - b[1].cpu
  );

  console.log('Time:');
  for (const [name, result] of sortedByTime)
    console.log(`  ${name}: ${result.time.toFixed(2)}ms`);
  console.log('  quick-lru: not compatible');

  console.log('\nCPU:');
  for (const [name, result] of sortedByCpu)
    console.log(`  ${name}: ${result.cpu.toFixed(2)}µs`);
  console.log('  quick-lru: not compatible');

  if (sortedByTime[0][0] !== 'lru.min' || sortedByCpu[0][0] !== 'lru.min')
    process.exit(1);
})();
