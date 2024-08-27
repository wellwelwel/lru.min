import { describe, it, assert } from 'poku';
import { createLRU } from '../src/index.ts';

const snapshop = {
  level1: {
    stringProperty:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas odio, vitae scelerisque enim ligula venenatis dolor.',
    numberProperty: 9876543210,
    arrayProperty: [
      {
        deepNestedArray: [
          {
            deeperLevel: [new Set([1, 2, 3]), new Map([['key1', 'value1']])],
          },
          new Array(10).fill('string').map((_, i) => Symbol(`symbol_${i}`)),
          new Map([
            [
              '38KijMDwYyYC9P9b1dYJgKmfvscVerilhkhzzYtXlIZh8AyVKe',
              {
                furtherNesting: new Map([
                  [
                    Symbol('unique3'),
                    {
                      evenDeeper: [
                        'A',
                        'B',
                        'C',
                        new Map([
                          [Symbol('deepKey'), [1, 2, 3]],
                          [Symbol('deepKey2'), { a: 'a', b: 'b' }],
                        ]),
                      ],
                    },
                  ],
                ]),
              },
            ],
          ]),
        ],
      },
      {
        anotherNestedArray: new Array(5).fill(0).map(() => Math.random()),
      },
    ],
    mapProperty: new Map<unknown, unknown>([
      ['key1', 'value1'],
      [
        'key2',
        {
          subMap: new Map([
            [
              'subKey2',
              {
                veryDeep: {
                  level3: {
                    setExample: new Set([
                      1,
                      2,
                      3,
                      { nestedSet: new Set(['A', 'B', 'C']) },
                    ]),
                    complexObjectInside: {
                      deeplyNestedArray: new Array(3).fill(0).map(() => ({
                        deeperLevel: {
                          arrayInArray: [
                            [1, 2, 3],
                            [4, 5, 6],
                          ],
                          mapInArray: [
                            new Map([
                              ['mapKey2', new Set(['set1', 'set2', 'set3'])],
                            ]),
                            Symbol('deepSymbol'),
                          ],
                        },
                      })),
                    },
                  },
                },
              },
            ],
          ]),
        },
      ],
    ]),
  },
  anotherLevel1: {
    complexArray: new Array(10).fill(null).map((_, index) => ({
      nestedMap: new Map([
        [
          `key_${index}`,
          new Set([
            Symbol(`symbol_${index}`),
            Symbol(`another_symbol_${index}`),
          ]),
        ],
      ]),
    })),
  },
  functionInObject: () =>
    'This is a string returned by a function in the object.',
  anotherFunctionInObject: () => ({
    deeplyNestedFuncReturn: {
      deeplyNestedArray: [
        'String element',
        123456,
        new Map([
          [
            Symbol('nestedMapKey'),
            {
              anotherLevelDown: [
                new Set([1, 2, 3]),
                new Array(5).fill('deeplyNestedString'),
              ],
            },
          ],
        ]),
      ],
    },
  }),
  [Symbol('uniqueSymbolKey')]: {
    deeplyNestedWithSymbolKey: {
      level2: {
        level3: {
          setInsideSymbolKey: new Set([1, 2, 3]),
          mapInsideSymbolKey: new Map([['key1', 'value1']]),
        },
      },
    },
  },
};

describe('Types Suite', () => {
  it('should not match an undefined key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = undefined;

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), undefined);

    assert.deepStrictEqual([...LRU.entries()], []);
  });

  it('should match a symbol key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = Symbol('undefined');

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);

    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match an object key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = {
      test: true,
    };

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match an number key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = 941235;

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match a number key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = 941235;

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match a big int key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = 941283745934857639487563945235n;

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match a multi line key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = `
      ln
    `;

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match a `false` key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = false;

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match a `true` key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = true;

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match a complex key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });

    LRU.set(snapshop, snapshop);

    assert.deepStrictEqual(LRU.get(snapshop), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[snapshop, snapshop]]);
  });

  it('should match an emoji key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = '🧑🏻‍🔬';

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match an emoji key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = '🧑🏻‍🔬';

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });

  it('should match an ideogram key', () => {
    const LRU = createLRU<unknown, unknown>({ max: 5 });
    const key = 'テスト試験בדיקה测试測試тест';

    LRU.set(key, snapshop);

    assert.deepStrictEqual(LRU.get(key), snapshop);
    assert.deepStrictEqual([...LRU.entries()], [[key, snapshop]]);
  });
});
