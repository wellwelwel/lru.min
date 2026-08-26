import { setFlagsFromString } from 'node:v8';
import { runInNewContext } from 'node:vm';
import { describe, it, assert, skip } from 'poku';
import { createLRU } from '../src/index.ts';

type Key = { id: number };
type Value = { token: string };
type Refs = { key: WeakRef<Key>; value: WeakRef<Value> };

const runtime = globalThis as typeof globalThis & {
  gc?: () => void;
  Bun?: { gc: (force: boolean) => void };
};

const resolveGC = (): (() => void) | undefined => {
  const { Bun } = runtime;

  if (Bun) return () => Bun.gc(true);
  if (runtime.gc) return runtime.gc;

  try {
    setFlagsFromString('--expose-gc');

    const exposed: (() => void) | undefined = runInNewContext('gc');

    return exposed;
  } catch {
    return undefined;
  }
};

const gc = resolveGC();

if (!gc) skip('this runtime cannot force garbage collection');

const collectGarbage = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));

  gc();
  gc();
};

describe('Memory release suite', () => {
  it('should release keys and values from slots vacated by a shrinking resize', async () => {
    const fill = () => {
      const LRU = createLRU<Key, Value>({ max: 10 });
      const keys: Key[] = [];

      for (let i = 0; i < 10; i++) {
        const key = { id: i };

        keys.push(key);
        LRU.set(key, { token: `token${i}` });
      }

      for (const key of keys.slice(0, 5)) LRU.delete(key);

      LRU.resize(8);

      const survivor = keys[5]!;
      const refs: Refs = {
        key: new WeakRef(survivor),
        value: new WeakRef(LRU.peek(survivor)!),
      };

      LRU.delete(survivor);

      return { LRU, refs };
    };

    const { LRU, refs } = fill();

    await collectGarbage();

    assert.strictEqual(LRU.size, 4);
    assert.strictEqual(refs.key.deref(), undefined);
    assert.strictEqual(refs.value.deref(), undefined);
  });

  it('should release keys and values dropped by a shrinking resize', async () => {
    const fill = () => {
      const LRU = createLRU<Key, Value>({ max: 5 });
      const refs: Refs[] = [];

      for (let i = 0; i < 5; i++) {
        const key = { id: i };
        const value = { token: `token${i}` };

        refs.push({ key: new WeakRef(key), value: new WeakRef(value) });
        LRU.set(key, value);
      }

      LRU.resize(2);

      return { LRU, refs };
    };

    const { LRU, refs } = fill();

    await collectGarbage();

    assert.strictEqual(LRU.size, 2);

    for (const ref of refs.slice(0, 3)) {
      assert.strictEqual(ref.key.deref(), undefined);
      assert.strictEqual(ref.value.deref(), undefined);
    }

    for (const ref of refs.slice(3)) {
      assert.notStrictEqual(ref.key.deref(), undefined);
      assert.notStrictEqual(ref.value.deref(), undefined);
    }
  });

  it('should release re-entrant notifications as they are delivered', async () => {
    const pending: Value[] = [{ token: 'x' }, { token: 'y' }, { token: 'z' }];
    const refs = pending.map((value) => new WeakRef(value));
    const seen: string[] = [];

    const LRU = createLRU<string, Value>({
      max: 3,
      onEviction: (key) => {
        seen.push(key);

        if (key === 'a') {
          while (pending.length > 0) {
            const value = pending.shift()!;

            LRU.set(value.token, value);
            LRU.set(value.token, { token: `${value.token}:2` });
          }

          return;
        }

        if (key === 'z') {
          gc!();
          gc!();

          assert.strictEqual(refs[0]!.deref(), undefined);
        }
      },
    });

    for (const key of ['a', 'b', 'c']) LRU.set(key, { token: key });

    await new Promise((resolve) => setTimeout(resolve, 0));

    LRU.clear();

    assert.deepStrictEqual(seen, ['a', 'b', 'c', 'x', 'y', 'z']);
  });
});
