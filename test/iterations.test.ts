import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.js';

describe('Iterations Suite', () => {
  it('Keys', () => {
    const LRU = createLRU<string, string>({ max: 5 });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');
    LRU.set('key4', 'value4');

    assert.deepStrictEqual([...LRU.keys()], ['key4', 'key3', 'key2', 'key1']);
  });

  it('Values', () => {
    const LRU = createLRU<string, string>({ max: 5 });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');
    LRU.set('key4', 'value4');

    assert.deepStrictEqual(
      [...LRU.values()],
      ['value4', 'value3', 'value2', 'value1']
    );
  });

  it('Entries', () => {
    const LRU = createLRU<string, string>({ max: 5 });

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');
    LRU.set('key4', 'value4');

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

  it('For Each', () => {
    const LRU = createLRU<string, string>({ max: 5 });
    const iterations: [string, string][] = [];

    LRU.set('key1', 'value1');
    LRU.set('key2', 'value2');
    LRU.set('key3', 'value3');
    LRU.set('key4', 'value4');

    LRU.forEach((value, key) => iterations.push([value, key]));

    assert.deepStrictEqual(iterations, [
      ['value4', 'key4'],
      ['value3', 'key3'],
      ['value2', 'key2'],
      ['value1', 'key1'],
    ]);
  });
});
