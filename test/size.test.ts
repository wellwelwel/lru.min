import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.ts';

describe('Size suite', () => {
  it('should throw when `max` is invalid', () => {
    // @ts-expect-error
    assert.throws(() => createLRU());
    // @ts-expect-error
    assert.throws(() => createLRU({ max: undefined }));
    assert.throws(() => createLRU({ max: 0 }));
  });

  it('should throw when `newMax` is invalid', () => {
    // @ts-expect-error
    assert.throws(() => createLRU());
    // @ts-expect-error
    assert.throws(() => createLRU({ max: 2 }).resize());
    // @ts-expect-error
    assert.throws(() => createLRU({ max: 2 }).resize(undefined));
    assert.throws(() => createLRU({ max: 2 }).resize(0));
  });

  it('should evict the least recently used item when max size is exceeded', () => {
    const LRU = createLRU<string, string>({ max: 2 });

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
  });

  it('should retain items when the same key is set multiple times', () => {
    const LRU = createLRU<string, string>({ max: 2 });

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
  });

  it('should retain only the most recent items within max size', () => {
    const LRU = createLRU<string, string>({ max: 2 });

    for (let i = 1; i <= 100_000; i++) LRU.set(`key${i}`, `value${i}`);

    for (let i = 100_000 - LRU.max; i > 100_000; i--) {
      assert.strictEqual(LRU.has(`key${i}`), false);
    }

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key100000', 'value100000'],
        ['key99999', 'value99999'],
      ]
    );
  });

  it('should evict items when resized to a smaller max size', () => {
    const LRU = createLRU<string, string>({
      max: 10,
    });

    for (let i = 1; i <= 10; i++) LRU.set(`key${i}`, `value${i}`);

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
  });

  it('should evict the specified number of items and update the size', () => {
    const LRU = createLRU<string, string>({
      max: 10,
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
  });

  it('should ignore resize', () => {
    const LRU = createLRU<string, string>({
      max: 10,
    });

    for (let i = 1; i <= 10; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.size, 10);

    LRU.resize(10);

    assert.strictEqual(LRU.size, 10);
  });

  it('should delete specific items', () => {
    const LRU = createLRU<string, string>({
      max: 10,
    });

    for (let i = 1; i <= 10; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.size, 10);

    assert.strictEqual(LRU.delete('key3'), true, 'Valid key');
    assert.strictEqual(LRU.delete('key3'), false, 'Invalid key');

    assert.strictEqual(LRU.size, 9);
  });

  it('should clear the cache', () => {
    const LRU = createLRU<string, string>({
      max: 10,
    });

    for (let i = 1; i <= 10; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.size, 10);

    LRU.clear();

    assert.strictEqual(LRU.size, 0);
  });

  it('should resized to a smaller max size with available slots', () => {
    const LRU = createLRU<string, string>({
      max: 10,
    });

    for (let i = 0; i <= 2; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.max, 10);

    LRU.resize(5);

    assert.strictEqual(LRU.max, 5);
    assert.strictEqual(LRU.size, 3);

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key2', 'value2'],
        ['key1', 'value1'],
        ['key0', 'value0'],
      ]
    );

    for (let i = 3; i <= 5; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.size, 5);

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key5', 'value5'],
        ['key4', 'value4'],
        ['key3', 'value3'],
        ['key2', 'value2'],
        ['key1', 'value1'],
      ]
    );
  });

  it('should keep items when resized to a greater max size with available slots', () => {
    const LRU = createLRU<string, string>({
      max: 10,
    });

    assert.strictEqual(LRU.max, 10);

    LRU.resize(20);

    assert.strictEqual(LRU.max, 20);
    assert.strictEqual(LRU.size, 0);
    assert.deepStrictEqual([...LRU.entries()], []);

    for (let i = 1; i <= 15; i++) LRU.set(`key${i}`, `value${i}`);

    assert.strictEqual(LRU.size, 15);
    assert.strictEqual(LRU.available, 5);

    assert.deepStrictEqual(
      [...LRU.entries()],
      [
        ['key15', 'value15'],
        ['key14', 'value14'],
        ['key13', 'value13'],
        ['key12', 'value12'],
        ['key11', 'value11'],
        ['key10', 'value10'],
        ['key9', 'value9'],
        ['key8', 'value8'],
        ['key7', 'value7'],
        ['key6', 'value6'],
        ['key5', 'value5'],
        ['key4', 'value4'],
        ['key3', 'value3'],
        ['key2', 'value2'],
        ['key1', 'value1'],
      ]
    );
  });
});
