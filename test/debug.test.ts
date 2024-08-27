import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.js';

describe('Debug Suite', () => {
  it('ensure debug is undefined by default', () => {
    const LRU = createLRU({ max: 5 });

    assert.strictEqual(LRU.debug, undefined);
  });

  it('ensure default states', () => {
    const LRU = createLRU({ max: 5, debug: true });

    assert.deepStrictEqual(LRU.debug, {
      tail: 0,
      head: 0,
      keyMap: new Map(),
      keyList: [undefined, undefined, undefined, undefined, undefined],
      valList: [undefined, undefined, undefined, undefined, undefined],
      prev: [0, 0, 0, 0, 0],
      next: [0, 0, 0, 0, 0],
      free: [],
    });
  });
});
