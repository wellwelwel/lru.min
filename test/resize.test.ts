import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.ts';

describe('Resize strict suite', () => {
  it('should trigger onEviction for the actual LRU items after reordering', () => {
    const evicted: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 5,
      onEviction: (key, value) => {
        evicted.push([key, value]);
      },
    });

    LRU.set('A', 'a');
    LRU.set('B', 'b');
    LRU.set('C', 'c');
    LRU.set('D', 'd');
    LRU.set('E', 'e');

    LRU.get('A');
    LRU.get('B');

    evicted.length = 0;

    LRU.resize(3);

    const evictedKeys = evicted.map(([key]) => key);

    assert.strictEqual(evictedKeys.includes('A'), false);
    assert.strictEqual(evictedKeys.includes('B'), false);
    assert.deepStrictEqual(evictedKeys.sort(), ['C', 'D']);
  });

  it('should remove evicted keys from the cache after resize', () => {
    const LRU = createLRU<string, number>({ max: 5 });

    for (let i = 1; i <= 5; i++) LRU.set(`key${i}`, i);

    LRU.resize(3);

    assert.strictEqual(LRU.has('key3'), true);
    assert.strictEqual(LRU.has('key4'), true);
    assert.strictEqual(LRU.has('key5'), true);
    assert.strictEqual(LRU.get('key3'), 3);
    assert.strictEqual(LRU.get('key4'), 4);
    assert.strictEqual(LRU.get('key5'), 5);

    assert.strictEqual(LRU.has('key1'), false);
    assert.strictEqual(LRU.has('key2'), false);
    assert.strictEqual(LRU.peek('key1'), undefined);
    assert.strictEqual(LRU.peek('key2'), undefined);
    assert.strictEqual(LRU.get('key1'), undefined);
    assert.strictEqual(LRU.get('key2'), undefined);
  });

  it('should not corrupt preserved slots when reinserting an evicted key', () => {
    const evicted: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 5,
      onEviction: (key, value) => {
        evicted.push([key, value]);
      },
    });

    for (let i = 1; i <= 5; i++) LRU.set(`key${i}`, `v${i}`);

    evicted.length = 0;

    LRU.resize(3);
    LRU.set('key1', 'new-v1');

    assert.strictEqual(LRU.get('key1'), 'new-v1');
    assert.strictEqual(LRU.get('key4'), 'v4');
    assert.strictEqual(LRU.get('key5'), 'v5');
    assert.strictEqual(LRU.has('key3'), false);

    assert.deepStrictEqual(
      evicted.map(([key]) => key),
      ['key1', 'key2', 'key3']
    );
  });
});
