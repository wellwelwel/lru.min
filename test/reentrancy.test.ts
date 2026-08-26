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

  it('should keep the counters consistent when evict triggers a clear', () => {
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
      onEviction: () => {
        announced++;
        LRU.set(`after:${announced}`, 'value');
      },
    });

    for (const key of ['a', 'b', 'c']) LRU.set(key, `value:${key}`);

    assert.throws(
      () => LRU.set('d', 'value:d'),
      /exceeded the re-entrancy limit/
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

  it('should let a finite chain of replacements settle', () => {
    let calls = 0;

    const LRU = createLRU<string, string>({
      max: 1,
      onEviction: (key) => {
        calls++;

        if (calls <= 3) LRU.set(key, `value:${calls}`);
      },
    });

    LRU.set('a', 'value:0');
    LRU.set('a', 'value:trigger');

    assert.strictEqual(calls, 4);
    assert.strictEqual(LRU.size, 1);
    assert.strictEqual(LRU.peek('a'), 'value:3');
  });

  it('should let clear announce callbacks that update other entries', () => {
    const LRU = createLRU<string, number>({
      max: 10,
      onEviction: (key) => {
        if (key.startsWith('stats:')) return;

        LRU.set('stats:a', (LRU.peek('stats:a') ?? 0) + 1);
        LRU.set('stats:b', (LRU.peek('stats:b') ?? 0) + 1);
      },
    });

    for (let i = 0; i < 10; i++) LRU.set(`item:${i}`, i);

    LRU.clear();

    assert.strictEqual(LRU.size, 2);
    assert.strictEqual(LRU.peek('stats:a'), 10);
    assert.strictEqual(LRU.peek('stats:b'), 10);
  });

  it('should scale the limit with the work of the operation', () => {
    const LRU = createLRU<string, number>({
      max: 30_000,
      onEviction: (key) => {
        if (key.startsWith('stats:')) return;

        for (let i = 0; i < 3; i++) {
          LRU.set(`stats:${i}`, (LRU.peek(`stats:${i}`) ?? 0) + 1);
        }
      },
    });

    for (let i = 0; i < 30_000; i++) LRU.set(`item:${i}`, i);

    LRU.clear();

    assert.strictEqual(LRU.size, 3);
    assert.strictEqual(LRU.peek('stats:0'), 30_000);
    assert.strictEqual(LRU.peek('stats:2'), 30_000);
  });

  it('should stop a callback that fans out before exhausting memory', () => {
    let calls = 0;

    const LRU = createLRU<string, number>({
      max: 1,
      onEviction: () => {
        calls++;

        for (let i = 0; i < 4096; i++) LRU.set(`fan:${calls}:${i}`, i);
      },
    });

    LRU.set('a', 0);

    assert.throws(() => LRU.set('b', 0), /exceeded the re-entrancy limit/);

    assert.strictEqual(calls < 100, true, 'gives up early');
    assert.strictEqual(LRU.size, 1);
    assert.strictEqual([...LRU.keys()].length, 1);
  });

  it('should keep a callback error as the cause when the limit is hit', () => {
    const failure = new Error('callback failed');
    let announced = 0;

    const LRU = createLRU<string, string>({
      max: 3,
      onEviction: () => {
        announced++;
        LRU.set(`after:${announced}`, 'value');

        if (announced === 1) throw failure;
      },
    });

    for (const key of ['a', 'b', 'c']) LRU.set(key, `value:${key}`);

    let caught: unknown;

    try {
      LRU.set('d', 'value:d');
    } catch (error) {
      caught = error;
    }

    assert.strictEqual(caught instanceof RangeError, true);
    assert.strictEqual(
      caught instanceof RangeError && Reflect.get(caught, 'cause'),
      failure
    );
  });
});
