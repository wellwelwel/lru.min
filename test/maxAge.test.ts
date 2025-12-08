import { describe, it, assert, sleep } from 'poku';
import { createLRU } from '../src/index.ts';

describe('maxAge suite', async () => {
  it('should throw when `maxAge` is invalid', () => {
    assert.throws(() => createLRU({ max: 100, maxAge: 0 }));
  });

  await it('should expire items after maxAge on get', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
    });

    LRU.set('key1', 'value1');

    assert.strictEqual(LRU.get('key1'), 'value1');

    await sleep(100);

    assert.strictEqual(LRU.get('key1'), undefined);
    assert.strictEqual(LRU.size, 0);
  });

  await it('should expire items after maxAge on has', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
    });

    LRU.set('key1', 'value1');

    assert.strictEqual(LRU.has('key1'), true);

    await sleep(100);

    assert.strictEqual(LRU.has('key1'), false);
    assert.strictEqual(LRU.size, 0);
  });

  await it('should not expire items before maxAge', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 200,
    });

    LRU.set('key1', 'value1');

    await sleep(50);

    assert.strictEqual(LRU.get('key1'), 'value1');
    assert.strictEqual(LRU.has('key1'), true);
    assert.strictEqual(LRU.size, 1);
  });

  await it('should trigger onEviction when maxAge expires an item on get', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');

    await sleep(100);

    LRU.get('key1');

    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);
  });

  await it('should trigger onEviction when maxAge expires an item on has', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');

    await sleep(100);

    LRU.has('key1');

    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);
  });

  await it('should refresh timestamp when setting the same key', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 100,
    });

    LRU.set('key1', 'value1');

    await sleep(60);

    LRU.set('key1', 'value1-updated');

    await sleep(60);

    assert.strictEqual(LRU.get('key1'), 'value1-updated');
    assert.strictEqual(LRU.size, 1);
  });

  await it('should expire multiple items independently', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 100,
    });

    LRU.set('key1', 'value1');

    await sleep(60);

    LRU.set('key2', 'value2');

    await sleep(60);

    assert.strictEqual(LRU.get('key1'), undefined);
    assert.strictEqual(LRU.get('key2'), 'value2');
    assert.strictEqual(LRU.size, 1);
  });

  await it('should return undefined on peek when maxAge expires item and remove it', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');

    await sleep(100);

    assert.strictEqual(LRU.peek('key1'), undefined);
    assert.strictEqual(LRU.size, 0, 'Item should be removed from cache');
    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);
  });

  await it('should handle maxAge with eviction due to max size', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 2,
      maxAge: 100,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');

    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);

    await sleep(150);

    LRU.get('key2');
    LRU.get('key3');

    assert.deepStrictEqual(evicteds, [
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]);

    assert.strictEqual(LRU.size, 0);
  });

  await it('should maintain correct order after maxAge expiration', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 100,
    });

    LRU.set('key1', 'value1');

    await sleep(60);

    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');

    await sleep(60);

    LRU.get('key1');

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key3', 'value3'],
        ['key2', 'value2'],
      ]
    );
  });

  await it('should work with iterators when items are expired and remove them', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');

    await sleep(100);

    assert.deepStrictEqual([...LRU.keys()], []);
    assert.strictEqual(LRU.size, 0);
    assert.deepStrictEqual(evicteds, [
      ['key2', 'value2'],
      ['key1', 'value1'],
    ]);
  });

  await it('should remove expired items via values iterator', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');

    await sleep(100);

    assert.deepStrictEqual([...LRU.values()], []);
    assert.strictEqual(LRU.size, 0);
    assert.deepStrictEqual(evicteds, [
      ['key2', 'value2'],
      ['key1', 'value1'],
    ]);
  });

  await it('should remove expired items via entries iterator', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');

    await sleep(100);

    assert.deepStrictEqual([...LRU.entries()], []);
    assert.strictEqual(LRU.size, 0);
    assert.deepStrictEqual(evicteds, [
      ['key2', 'value2'],
      ['key1', 'value1'],
    ]);
  });

  await it('should remove expired items via forEach', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');

    await sleep(100);

    const forEachItems: [string, string][] = [];
    LRU.forEach((value, key) => {
      forEachItems.push([key, value]);
    });

    assert.deepStrictEqual(forEachItems, []);
    assert.strictEqual(LRU.size, 0);
    assert.deepStrictEqual(evicteds, [
      ['key2', 'value2'],
      ['key1', 'value1'],
    ]);
  });

  await it('should handle delete on expired items', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');

    await sleep(100);

    assert.strictEqual(LRU.delete('key1'), true);
    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);
  });

  await it('should handle clear with expired items', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');

    await sleep(100);

    LRU.clear();

    assert.deepStrictEqual(evicteds, [
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);
  });

  await it('should handle evict method with expired items', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');

    await sleep(100);

    LRU.evict(1);

    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);
    assert.strictEqual(LRU.size, 1);
  });

  await it('should refresh timestamp on get (sliding expiration)', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 100,
    });

    LRU.set('key1', 'value1');

    await sleep(40);
    assert.strictEqual(
      LRU.get('key1'),
      'value1',
      'Access at 40ms - should refresh timestamp'
    );

    await sleep(40);
    assert.strictEqual(
      LRU.get('key1'),
      'value1',
      'Access at 80ms (40ms after refresh) - should still be valid and refresh again'
    );

    await sleep(40);
    assert.strictEqual(
      LRU.get('key1'),
      'value1',
      'Access at 120ms (40ms after last refresh) - should still be valid'
    );

    assert.strictEqual(
      LRU.size,
      1,
      'Total time: 120ms, but item is still alive due to sliding expiration'
    );
  });

  await it('should not refresh timestamp on has', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 100,
    });

    LRU.set('key1', 'value1');

    await sleep(40);
    assert.strictEqual(
      LRU.has('key1'),
      true,
      'Check at 40ms - should NOT refresh timestamp'
    );

    await sleep(40);
    assert.strictEqual(
      LRU.has('key1'),
      true,
      'Check at 80ms - should NOT refresh timestamp'
    );

    // Check at 120ms - should be expired (has does not refresh)
    await sleep(40);
    assert.strictEqual(LRU.has('key1'), false);
    assert.strictEqual(LRU.size, 0);
  });

  await it('should not refresh timestamp on peek but remove when expired', async () => {
    const evicteds: [string, string][] = [];
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 100,
      onEviction: (key, value) => {
        evicteds.push([key, value]);
      },
    });

    LRU.set('key1', 'value1');

    await sleep(40);
    assert.strictEqual(
      LRU.peek('key1'),
      'value1',
      'Peek at 40ms - should not refresh timestamp'
    );

    await sleep(20);
    assert.strictEqual(
      LRU.peek('key1'),
      'value1',
      'Peek at 60ms - should not refresh timestamp'
    );

    await sleep(50);
    assert.strictEqual(
      LRU.peek('key1'),
      undefined,
      'Peek at 110ms - should return undefined for expired item'
    );

    // peek should have removed the item
    assert.strictEqual(LRU.size, 0);
    assert.deepStrictEqual(evicteds, [['key1', 'value1']]);
  });

  await it('should keep item alive with repeated get calls', async () => {
    const LRU = createLRU<string, string>({
      max: 10,
      maxAge: 50,
    });

    LRU.set('key1', 'value1');

    for (let i = 0; i < 5; i++) {
      await sleep(30);
      assert.strictEqual(
        LRU.get('key1'),
        'value1',
        `Keep accessing every 30ms for 150ms total (${i + 1}/5)`
      );
    }

    assert.strictEqual(
      LRU.size,
      1,
      'Item should still be alive after 150ms because of sliding expiration'
    );

    // Now wait for expiration without accessing
    await sleep(100);
    assert.strictEqual(LRU.get('key1'), undefined);
    assert.strictEqual(LRU.size, 0);
  });
});
