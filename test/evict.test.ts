import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.ts';

describe('Evict count suite', () => {
  for (const withCallback of [false, true]) {
    it(`should round a fractional count up ${withCallback ? 'with' : 'without'} onEviction`, () => {
      const evicted: string[] = [];
      const LRU = createLRU<string, number>({
        max: 5,
        onEviction: withCallback
          ? (key) => {
              evicted.push(key);
            }
          : undefined,
      });

      for (let i = 1; i <= 5; i++) LRU.set(`key${i}`, i);

      LRU.evict(1.5);

      assert.strictEqual(LRU.size, 3);
      assert.deepStrictEqual([...LRU.keys()], ['key5', 'key4', 'key3']);
      assert.deepStrictEqual(evicted, withCallback ? ['key1', 'key2'] : []);

      LRU.evict(0.5);

      assert.strictEqual(LRU.size, 2);
      assert.deepStrictEqual(
        evicted,
        withCallback ? ['key1', 'key2', 'key3'] : []
      );
    });
  }
});
