import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.ts';

describe('Eviction callback re-entrancy suite', () => {
  it('should stay within max when a shrinking resize triggers an insert', () => {
    const evicteds: string[] = [];
    let reentered = false;

    const LRU = createLRU<string, string>({
      max: 4,
      onEviction: (key) => {
        evicteds.push(key);

        if (reentered) return;

        reentered = true;
        LRU.set('x', 'value:x');
      },
    });

    for (const key of ['a', 'b', 'c', 'd']) LRU.set(key, `value:${key}`);

    LRU.resize(2);

    const keys = [...LRU.keys()];

    assert.strictEqual(LRU.max, 2);
    assert.strictEqual(LRU.size, 2);
    assert.strictEqual(keys.length, 2, 'stores no more than max');
    assert.strictEqual(new Set(keys).size, 2, 'yields each key once');
    assert.strictEqual(LRU.available, 0);

    for (const key of keys) {
      assert.strictEqual(LRU.peek(key), `value:${key}`, 'no aliased slot');
    }

    assert.strictEqual(
      new Set(evicteds).size,
      evicteds.length,
      'announces each entry once'
    );
  });

  it('should announce every entry when clear triggers an insert', () => {
    const evicteds: string[] = [];
    let reentered = false;

    const LRU = createLRU<string, string>({
      max: 3,
      onEviction: (key) => {
        evicteds.push(key);

        if (reentered) return;

        reentered = true;
        LRU.set('x', 'value:x');
      },
    });

    for (const key of ['a', 'b', 'c']) LRU.set(key, `value:${key}`);

    LRU.clear();

    assert.deepStrictEqual(evicteds, ['a', 'b', 'c']);
    assert.strictEqual(LRU.size, 1);
    assert.strictEqual(LRU.peek('x'), 'value:x');
  });

  it('should keep the counters possible when evict triggers a clear', () => {
    const evicteds: string[] = [];
    let reentered = false;

    const LRU = createLRU<string, string>({
      max: 4,
      onEviction: (key) => {
        evicteds.push(key);

        if (reentered) return;

        reentered = true;
        LRU.clear();
      },
    });

    for (const key of ['a', 'b', 'c', 'd']) LRU.set(key, `value:${key}`);

    LRU.evict(2);

    assert.deepStrictEqual(evicteds, ['a', 'b', 'c', 'd']);
    assert.strictEqual(LRU.size, 0);
    assert.strictEqual(LRU.available, 4);
  });

  it('should terminate when the callback re-enters unguarded', () => {
    const evicteds: string[] = [];

    const LRU = createLRU<string, string>({
      max: 3,
      onEviction: (key) => {
        evicteds.push(key);
        LRU.clear();
      },
    });

    for (const key of ['a', 'b', 'c']) LRU.set(key, `value:${key}`);

    LRU.clear();

    assert.deepStrictEqual(evicteds, ['a', 'b', 'c']);
    assert.strictEqual(LRU.size, 0);
  });

  it('should refuse a callback that never stops causing evictions', () => {
    let announced = 0;

    const LRU = createLRU<string, string>({
      max: 3,
      onEviction: (key) => {
        announced++;
        LRU.set(`after:${key}`, 'value');
      },
    });

    for (const key of ['a', 'b', 'c']) LRU.set(key, `value:${key}`);

    assert.throws(
      () => LRU.set('d', 'value:d'),
      /re-entered the cache without settling/
    );

    const keys = [...LRU.keys()];

    assert.strictEqual(announced > 0, true, 'announced before giving up');
    assert.strictEqual(LRU.size <= LRU.max, true, 'stays within max');
    assert.strictEqual(keys.length, LRU.size, 'iterates what it reports');
    assert.strictEqual(new Set(keys).size, keys.length, 'yields each key once');
    assert.strictEqual(LRU.available, LRU.max - LRU.size, 'counters agree');

    for (const key of keys) {
      assert.strictEqual(LRU.has(key), true, 'holds every iterated key');
      assert.notStrictEqual(LRU.peek(key), undefined, 'resolves every key');
    }
  });

  it('should announce the remaining entries when a callback throws', () => {
    const evicteds: string[] = [];

    const LRU = createLRU<string, string>({
      max: 3,
      onEviction: (key) => {
        evicteds.push(key);

        if (key === 'b') throw new Error('callback failed');
      },
    });

    for (const key of ['a', 'b', 'c']) LRU.set(key, `value:${key}`);

    assert.throws(() => LRU.clear(), /callback failed/);

    assert.deepStrictEqual(evicteds, ['a', 'b', 'c']);
    assert.strictEqual(LRU.size, 0);
    assert.strictEqual(LRU.available, 3);
  });
});
