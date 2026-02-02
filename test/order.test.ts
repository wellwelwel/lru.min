import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.ts';

describe('Order Suite', () => {
  it('should move accessed item to the most recent position', () => {
    const LRU = createLRU<string, string>({ max: 5 });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');
    LRU.set('key4', 'value4');

    assert.strictEqual(LRU.get('key3'), 'value3');

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key3', 'value3'],
        ['key4', 'value4'],
        ['key2', 'value2'],
        ['key1', 'value1'],
      ]
    );

    assert.strictEqual(LRU.get('key2'), 'value2');
    assert.strictEqual(LRU.get('key1'), 'value1');

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key1', 'value1'],
        ['key2', 'value2'],
        ['key3', 'value3'],
        ['key4', 'value4'],
      ]
    );
  });

  it('should not change the order when an item is peeked', () => {
    const LRU = createLRU<string, string>({ max: 5 });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');
    LRU.set('key4', 'value4');

    assert.strictEqual(LRU.peek('key3'), 'value3');
    assert.strictEqual(LRU.peek('key5'), undefined);

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key4', 'value4'],
        ['key3', 'value3'],
        ['key2', 'value2'],
        ['key1', 'value1'],
      ]
    );
  });

  it('should ignore the same tail', () => {
    const LRU = createLRU<string, string>({
      max: 10,
    });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key2', 'value2');

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key2', 'value2'],
        ['key1', 'value1'],
      ]
    );
  });

  it('should preserve iteration order after deleting an item and triggering eviction', () => {
    const LRU = createLRU<string, string>({ max: 3 });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');

    LRU.delete('key2');

    LRU.set('key4', 'value4');
    LRU.set('key5', 'value5');

    assert.deepStrictEqual([...LRU.keys()], ['key5', 'key4', 'key3']);
  });

  it('should preserve iteration order after updating an existing key and triggering eviction', () => {
    const LRU = createLRU<string, string>({ max: 3 });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');

    LRU.set('key2', 'updated');

    LRU.set('key4', 'value4');

    assert.deepStrictEqual([...LRU.keys()], ['key4', 'key2', 'key3']);
  });

  it('should preserve iteration order after reordering items with get', () => {
    const LRU = createLRU<string, string>({ max: 3 });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');

    LRU.get('key1');
    LRU.get('key3');

    assert.deepStrictEqual([...LRU.keys()], ['key3', 'key1', 'key2']);
  });
});
