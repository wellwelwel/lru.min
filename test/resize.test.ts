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

  it('should keep order and evictions intact across repeated growth', () => {
    const evicted: string[] = [];
    const LRU = createLRU<string, number>({
      max: 5,
      onEviction: (key) => {
        evicted.push(key);
      },
    });

    for (let i = 1; i <= 5; i++) LRU.set(`key${i}`, i);

    LRU.resize(6);
    LRU.set('key6', 6);
    LRU.resize(7);
    LRU.set('key7', 7);
    LRU.get('key2');
    LRU.set('key8', 8);
    LRU.set('key9', 9);

    assert.strictEqual(LRU.max, 7);
    assert.strictEqual(LRU.size, 7);
    assert.deepStrictEqual(
      [...LRU.keys()],
      ['key9', 'key8', 'key2', 'key7', 'key6', 'key5', 'key4']
    );
    assert.deepStrictEqual(evicted, ['key1', 'key3']);

    LRU.delete('key6');
    LRU.resize(3);

    assert.deepStrictEqual([...LRU.keys()], ['key9', 'key8', 'key2']);
    assert.deepStrictEqual(evicted, [
      'key1',
      'key3',
      'key6',
      'key4',
      'key5',
      'key7',
    ]);

    LRU.resize(9);
    LRU.resize(12);

    for (let i = 10; i <= 19; i++) LRU.set(`key${i}`, i);

    assert.strictEqual(LRU.max, 12);
    assert.strictEqual(LRU.size, 12);
    assert.deepStrictEqual(
      [...LRU.keys()],
      [
        'key19',
        'key18',
        'key17',
        'key16',
        'key15',
        'key14',
        'key13',
        'key12',
        'key11',
        'key10',
        'key9',
        'key8',
      ]
    );
    assert.deepStrictEqual(evicted, [
      'key1',
      'key3',
      'key6',
      'key4',
      'key5',
      'key7',
      'key2',
    ]);
    assert.deepStrictEqual(
      [...LRU.values()].reverse(),
      [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    );
  });
});
