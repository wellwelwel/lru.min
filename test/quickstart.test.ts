import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.ts';

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
});
