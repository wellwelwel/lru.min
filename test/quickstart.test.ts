import { describe, it, assert } from 'poku';
import { createLRU, type CacheOptions } from '../src/index.ts';

describe('Quickstart example test', () => {
  it('Default', () => {
    const evicteds: string[] = [];
    const max = 2;
    const onEviction = (key: string, value: string) =>
      evicteds.push(`Key "${key}" with value "${value}" has been evicted.`);

    const LRU = createLRU<string, string>({
      max,
      onEviction,
    });

    LRU.set('A', 'My Value');
    LRU.set('B', 'Other Value');
    LRU.set('C', 'Another Value');

    assert.deepStrictEqual(evicteds, [
      'Key "A" with value "My Value" has been evicted.',
    ]);

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['C', 'Another Value'],
        ['B', 'Other Value'],
      ]
    );

    assert.strictEqual(LRU.has('B'), true);
    assert.strictEqual(LRU.get('B'), 'Other Value');
    assert.strictEqual(LRU.delete('B'), true);

    assert.deepStrictEqual(evicteds, [
      'Key "A" with value "My Value" has been evicted.',
      'Key "B" with value "Other Value" has been evicted.',
    ]);
    assert.deepStrictEqual([...LRU.entries()], [['C', 'Another Value']]);

    assert.strictEqual(LRU.peek('C'), 'Another Value');

    LRU.clear();

    assert.deepStrictEqual(evicteds, [
      'Key "A" with value "My Value" has been evicted.',
      'Key "B" with value "Other Value" has been evicted.',
      'Key "C" with value "Another Value" has been evicted.',
    ]);
    assert.deepStrictEqual([...LRU.entries()], []);

    LRU.set('D', "You're amazing 💛");

    assert.deepStrictEqual([...LRU.entries()], [['D', "You're amazing 💛"]]);

    assert.strictEqual(LRU.size, 1);
    assert.strictEqual(LRU.max, 2);
    assert.strictEqual(LRU.available, 1);

    LRU.resize(10);

    assert.strictEqual(LRU.size, 1);
    assert.strictEqual(LRU.max, 10);
    assert.strictEqual(LRU.available, 9);
    assert.deepStrictEqual([...LRU.entries()], [['D', "You're amazing 💛"]]);
    assert.deepStrictEqual(evicteds, [
      'Key "A" with value "My Value" has been evicted.',
      'Key "B" with value "Other Value" has been evicted.',
      'Key "C" with value "Another Value" has been evicted.',
    ]);
  });

  it('Alternative', () => {
    const evicteds: string[] = [];
    const max = 2;
    const onEviction = (key: string, value: string) =>
      evicteds.push(`Key "${key}" with value "${value}" has been evicted.`);

    const LRU = createLRU<string, string>({
      max,
      onEviction,
    });

    LRU.set('A', 'My Value');
    LRU.set('B', 'Other Value');
    LRU.set('C', 'Another Value');

    assert.deepStrictEqual(evicteds, [
      'Key "A" with value "My Value" has been evicted.',
    ]);

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['C', 'Another Value'],
        ['B', 'Other Value'],
      ]
    );

    assert.strictEqual(LRU.has('B'), true);
    assert.strictEqual(LRU.get('B'), 'Other Value');
    assert.strictEqual(LRU.delete('B'), true);

    assert.deepStrictEqual(evicteds, [
      'Key "A" with value "My Value" has been evicted.',
      'Key "B" with value "Other Value" has been evicted.',
    ]);
    assert.deepStrictEqual([...LRU.entries()], [['C', 'Another Value']]);

    assert.strictEqual(LRU.peek('C'), 'Another Value');

    LRU.evict(max);

    assert.deepStrictEqual(evicteds, [
      'Key "A" with value "My Value" has been evicted.',
      'Key "B" with value "Other Value" has been evicted.',
      'Key "C" with value "Another Value" has been evicted.',
    ]);
    assert.deepStrictEqual([...LRU.entries()], []);

    LRU.set('D', "You're amazing 💛");

    assert.deepStrictEqual([...LRU.entries()], [['D', "You're amazing 💛"]]);

    assert.strictEqual(LRU.size, 1);
    assert.strictEqual(LRU.max, 2);
    assert.strictEqual(LRU.available, 1);

    LRU.resize(10);

    assert.strictEqual(LRU.size, 1);
    assert.strictEqual(LRU.max, 10);
    assert.strictEqual(LRU.available, 9);
    assert.deepStrictEqual([...LRU.entries()], [['D', "You're amazing 💛"]]);
    assert.deepStrictEqual(evicteds, [
      'Key "A" with value "My Value" has been evicted.',
      'Key "B" with value "Other Value" has been evicted.',
      'Key "C" with value "Another Value" has been evicted.',
    ]);
  });

  it('Type Test', () => {
    const options: CacheOptions = {
      max: 10,
      onEviction(key, value) {
        console.log(key, value);
      },
    };

    createLRU(options);
  });

  it('Type Test: Params on `CacheOptions`', () => {
    const options: CacheOptions<number, string> = {
      max: 10,
      onEviction(key, value) {
        console.log(key, value);
      },
    };

    createLRU(options).set(1, 'Test');
    // @ts-expect-error
    createLRU<number, string>(options).set('2', 'Test');
  });

  it('Type Test: Params in `createLRU`', () => {
    const options: CacheOptions = {
      max: 10,
      onEviction(key, value) {
        console.log(key, value);
      },
    };

    createLRU<number, string>(options).set(1, 'Test');
    // @ts-expect-error
    createLRU<number, string>(options).set('2', 'Test');
  });

  it('Type Test: README.md', () => {
    type Key = number;

    type Value = {
      name: string;
    };

    const options: CacheOptions<Key, Value> = {
      max: 10,
      onEviction(key, value) {
        console.log(key, value);
      },
    };

    const LRU = createLRU(options);

    LRU.set(1, { name: 'Peter' });
    LRU.set(2, { name: 'Mary' });
  });
});
