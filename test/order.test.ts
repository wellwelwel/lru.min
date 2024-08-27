import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.js';

describe('Order Suite', () => {
  it('should move accessed item to the most recent position', () => {
    const LRU = createLRU<string, string>({ max: 5, debug: true });

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
});
