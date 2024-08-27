import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.ts';

describe('On eviction suite', () => {
  it('should evict the least recently used item when max size is exceeded and trigger onEviction', () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 2,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');

    assert.strictEqual(LRU.has('key1'), false);
    assert.strictEqual(LRU.has('key2'), true);
    assert.strictEqual(LRU.has('key3'), true);

    assert.strictEqual(LRU.get('key1'), undefined);
    assert.strictEqual(LRU.get('key2'), 'value2');
    assert.strictEqual(LRU.get('key3'), 'value3');

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key3', 'value3'],
        ['key2', 'value2'],
      ]
    );

    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);
  });

  it('should retain items when the same key is set multiple times and trigger onEviction', () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 2,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');

    assert.strictEqual(LRU.has('key1'), true);
    assert.strictEqual(LRU.has('key2'), true);

    assert.strictEqual(LRU.get('key1'), 'value1');
    assert.strictEqual(LRU.get('key2'), 'value2');

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key2', 'value2'],
        ['key1', 'value1'],
      ]
    );

    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);
  });

  it('should retain only the most recent items within max size and trigger onEviction', () => {
    const salt =
      'V$IE@Uz+=fCMnl/FctdRjDf#amCmnvsEf1R031^MT8Mv6Pykjq:wgFYtvnbZ1|dWJQYHef3Av!wh0joP&ABdUVGQC%Xrya9vMvt3KA22`TYXcAUNiKaQZIG1"Hq1FFYu0n,SCCJZZGCQIq"uF2V8O9t*U7qRmJQm[rVR2Z}pl';
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 2,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    for (let i = 1; i <= 100_000; i++) LRU.set(`key:${salt}:${i}`, `value${i}`);

    for (let i = 100_000 - LRU.max; i > 100_000; i--) {
      assert.strictEqual(LRU.has(`key${i}`), false);
    }

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        [`key:${salt}:100000`, 'value100000'],
        [`key:${salt}:99999`, 'value99999'],
      ]
    );

    assert.strictEqual(evicteds.length, 100_000 - LRU.max);
  });

  it('should evict items and trigger onEviction when resized to a smaller max size', () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    for (let i = 0; i <= 10; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.max, 10);

    LRU.resize(5);

    assert.strictEqual(LRU.max, 5);
    assert.strictEqual(LRU.size, 5);

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key10', 'value10'],
        ['key9', 'value9'],
        ['key8', 'value8'],
        ['key7', 'value7'],
        ['key6', 'value6'],
      ]
    );

    assert.deepStrictEqual(evicteds, [
      ['key0', 'value0'],
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
      ['key4', 'value4'],
      ['key5', 'value5'],
    ]);
  });

  it('should evict the specified number of items and update the size and trigger onEviction', () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    for (let i = 1; i <= 10; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.size, 10);

    LRU.evict(3);

    assert.strictEqual(LRU.size, 7);

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key10', 'value10'],
        ['key9', 'value9'],
        ['key8', 'value8'],
        ['key7', 'value7'],
        ['key6', 'value6'],
        ['key5', 'value5'],
        ['key4', 'value4'],
      ]
    );

    assert.deepStrictEqual(evicteds, [
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]);
  });

  it('should delete specific items and trigger onEviction', () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    for (let i = 1; i <= 10; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.size, 10);

    assert.strictEqual(LRU.delete('key3'), true, 'Valid key');
    assert.strictEqual(LRU.delete('key3'), false, 'Invalid key');

    assert.strictEqual(LRU.size, 9);

    assert.deepStrictEqual(evicteds, [['key3', 'value3']]);
  });

  it('should clear the cache and trigger onEviction', () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    for (let i = 1; i <= 10; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.size, 10);

    LRU.clear();

    assert.strictEqual(LRU.size, 0);

    assert.deepStrictEqual(evicteds, [
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
      ['key4', 'value4'],
      ['key5', 'value5'],
      ['key6', 'value6'],
      ['key7', 'value7'],
      ['key8', 'value8'],
      ['key9', 'value9'],
      ['key10', 'value10'],
    ]);
  });

  it('should clear the cache and trigger onEviction', () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 1,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key1', 'value1');
    LRU.evict(1);

    assert.strictEqual(LRU.size, 0);

    assert.deepStrictEqual(evicteds, [
      ['key1', 'value1'],
      ['key1', 'value1'],
    ]);
  });
});
