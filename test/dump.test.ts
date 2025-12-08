import { describe, it, assert, sleep } from 'poku';
import { createLRU } from '../src/index.ts';

describe('dump suite', async () => {
  const timer = typeof performance !== 'undefined' ? performance : Date;

  it('should return dump info for a specific key', () => {
    const LRU = createLRU<string, string>({
      max: 5,
    });

    LRU.set('A', 'Value A');
    LRU.set('B', 'Value B');
    LRU.set('C', 'Value C');

    const dump = [...LRU.dump('B')][0];

    assert.strictEqual(dump?.key, 'B');
    assert.strictEqual(dump?.value, 'Value B');
    assert.strictEqual(dump?.staleAt, 'never');
    assert.strictEqual(dump?.isStale, false);
    assert.strictEqual(dump?.position, 1);
  });

  it('should return undefined for non-existent key', () => {
    const LRU = createLRU<string, string>({
      max: 5,
    });

    LRU.set('A', 'Value A');

    const results = [...LRU.dump('Z')];

    assert.strictEqual(results.length, 0);
  });

  it('should return dump info for all keys in order (most recent first)', () => {
    const LRU = createLRU<string, string>({
      max: 5,
    });

    LRU.set('A', 'Value A');
    LRU.set('B', 'Value B');
    LRU.set('C', 'Value C');

    const dumps = [...LRU.dump()];

    assert.strictEqual(dumps.length, 3);

    assert.strictEqual(dumps[0]?.key, 'C');
    assert.strictEqual(dumps[0]?.position, 0);

    assert.strictEqual(dumps[1]?.key, 'B');
    assert.strictEqual(dumps[1]?.position, 1);

    assert.strictEqual(dumps[2]?.key, 'A');
    assert.strictEqual(dumps[2]?.position, 2);
  });

  it('should return empty when cache is empty', () => {
    const LRU = createLRU<string, string>({
      max: 5,
    });

    const dumps = [...LRU.dump()];

    assert.strictEqual(dumps.length, 0);
  });

  it('should update position after accessing a key', () => {
    const LRU = createLRU<string, string>({
      max: 5,
    });

    LRU.set('A', 'Value A');
    LRU.set('B', 'Value B');
    LRU.set('C', 'Value C');

    LRU.get('A'); // Move 'A' to most recent position

    const dumps = [...LRU.dump()];

    assert.strictEqual(dumps[0]?.key, 'A');
    assert.strictEqual(dumps[0]?.position, 0);

    assert.strictEqual(dumps[1]?.key, 'C');
    assert.strictEqual(dumps[1]?.position, 1);

    assert.strictEqual(dumps[2]?.key, 'B');
    assert.strictEqual(dumps[2]?.position, 2);
  });

  it('should show correct staleAt info when maxAge is set', () => {
    const maxAge = 100;
    const LRU = createLRU<string, string>({
      max: 5,
      maxAge,
    });

    LRU.set('A', 'Value A');

    const dump = [...LRU.dump('A')][0];
    if (!dump) assert.fail('Dump info should not be undefined');

    assert.strictEqual(dump.key, 'A');
    assert.strictEqual(dump.isStale, false);
    assert.strictEqual(typeof dump.staleAt, 'number');
    assert(typeof dump.staleAt === 'number' && dump.staleAt > timer.now());
  });

  await it('should detect stale items', async () => {
    const LRU = createLRU<string, string>({
      max: 5,
      maxAge: 50,
    });

    LRU.set('A', 'Value A');

    const beforeDump = [...LRU.dump('A')][0];
    assert.strictEqual(beforeDump?.isStale, false);

    await sleep(100);

    const afterDump = [...LRU.dump('A')][0];
    assert.strictEqual(afterDump?.isStale, true);
  });

  it('should show correct position for single item', () => {
    const LRU = createLRU<string, string>({
      max: 5,
    });

    LRU.set('A', 'Value A');

    const dump = [...LRU.dump('A')][0];

    assert.strictEqual(dump?.position, 0);
  });

  it('should handle dump after eviction', () => {
    const LRU = createLRU<string, string>({
      max: 2,
    });

    LRU.set('A', 'Value A');
    LRU.set('B', 'Value B');
    LRU.set('C', 'Value C');

    const dumps = [...LRU.dump()];

    assert.strictEqual(dumps.length, 2);
    assert.strictEqual(dumps[0]?.key, 'C');
    assert.strictEqual(dumps[1]?.key, 'B');

    const dumpA = [...LRU.dump('A')];
    assert.strictEqual(dumpA.length, 0, "'A' should not exist");
  });

  it('should handle dump after delete', () => {
    const LRU = createLRU<string, string>({
      max: 5,
    });

    LRU.set('A', 'Value A');
    LRU.set('B', 'Value B');
    LRU.set('C', 'Value C');

    LRU.delete('B');

    const dumps = [...LRU.dump()];

    assert.strictEqual(dumps.length, 2);
    assert.strictEqual(dumps[0]?.key, 'C');
    assert.strictEqual(dumps[0]?.position, 0);
    assert.strictEqual(dumps[1]?.key, 'A');
    assert.strictEqual(dumps[1]?.position, 1);
  });
});
