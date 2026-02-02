export type CacheOptions<Key = unknown, Value = unknown> = {
  /** Maximum number of items the cache can hold. */
  max: number;
  /** Maximum age in milliseconds before an item is considered stale. */
  maxAge?: number;
  /** Function called when an item is evicted from the cache. */
  onEviction?: (key: Key, value: Value) => unknown;
};

export const createLRU = <Key, Value>(options: CacheOptions<Key, Value>) => {
  let { max } = options;

  if (!(Number.isInteger(max) && max > 0))
    throw new TypeError('`max` must be a positive integer');

  let size = 0;
  let head = 0;
  let tail = 0;
  let free: number[] = [];
  let timestamps: number[];
  let timer: { now: () => number };

  const { onEviction, maxAge } = options;
  const keyMap: Map<Key, number> = new Map();
  const keyList: (Key | undefined)[] = new Array(max).fill(undefined);
  const valList: (Value | undefined)[] = new Array(max).fill(undefined);
  const next: number[] = new Array(max).fill(0);
  const prev: number[] = new Array(max).fill(0);

  if (
    typeof maxAge !== 'undefined' &&
    !(Number.isInteger(maxAge) && maxAge > 0)
  )
    throw new TypeError('`maxAge` must be a positive integer');

  if (maxAge && maxAge > 0) {
    timer = typeof performance !== 'undefined' ? performance : Date;
    timestamps = new Array(max).fill(0);
  }

  const setTail = (index: number, type: 'set' | 'get'): undefined => {
    if (index === tail) return;

    const nextIndex = next[index];
    const prevIndex = prev[index];

    if (index === head) head = nextIndex;
    else if (type === 'get' || prevIndex !== 0) next[prevIndex] = nextIndex;

    if (nextIndex !== 0) prev[nextIndex] = prevIndex;

    next[tail] = index;
    prev[index] = tail;
    next[index] = 0;
    tail = index;
  };

  const _evict = (): number => {
    const evictHead = head;
    const key = keyList[evictHead]!;

    onEviction?.(key, valList[evictHead]!);
    keyMap.delete(key);

    keyList[evictHead] = undefined;
    valList[evictHead] = undefined;
    head = next[evictHead];

    prev[head] = 0;

    size--;

    if (size === 0) head = tail = 0;

    free.push(evictHead);

    return evictHead;
  };

  const _deleteByIndex = (index: number, key: Key): undefined => {
    onEviction?.(key, valList[index]!);
    keyMap.delete(key);
    free.push(index);

    keyList[index] = undefined;
    valList[index] = undefined;

    const prevIndex = prev[index];
    const nextIndex = next[index];

    if (prevIndex !== 0) next[prevIndex] = nextIndex;
    if (nextIndex !== 0) prev[nextIndex] = prevIndex;

    if (index === head) head = nextIndex;
    if (index === tail) tail = prevIndex;

    size--;
  };

  const _isStale = (index: number): boolean =>
    !!maxAge && timer.now() - timestamps[index] > maxAge;

  const _isExpired = (index: number, key: Key, refresh?: boolean): boolean => {
    if (_isStale(index)) {
      _deleteByIndex(index, key);
      return true;
    }

    if (refresh) timestamps[index] = timer.now();

    return false;
  };

  const _dump = (key: Key) => {
    const index = keyMap.get(key);
    if (index === undefined) return;

    let position = 0;
    let current = tail;

    while (current !== index && position < size) {
      current = prev[current];
      position++;
    }

    const staleAt = timestamps
      ? timestamps[index] + maxAge!
      : ('never' as const);

    return {
      key,
      value: valList[index],
      staleAt,
      isStale: timestamps ? _isStale(index) : false,
      position,
    };
  };

  return {
    /** Adds a key-value pair to the cache. Updates the value if the key already exists. */
    set(key: Key, value: Value): undefined {
      if (key === undefined) return;

      let index = keyMap.get(key);

      if (index === undefined) {
        index = size === max ? _evict() : free.length > 0 ? free.pop()! : size;
        keyMap.set(key, index);
        keyList[index] = key;
        size++;
      } else onEviction?.(key, valList[index]!);

      valList[index] = value;
      if (timestamps) timestamps[index] = timer.now();

      if (size === 1) head = tail = index;
      else setTail(index, 'set');
    },

    /** Retrieves the value for a given key and moves the key to the most recent position. */
    get(key: Key): Value | undefined {
      const index = keyMap.get(key);

      if (index === undefined) return;
      if (timestamps && _isExpired(index, key, true)) return;
      if (index !== tail) setTail(index, 'get');

      return valList[index];
    },

    /** Retrieves the value for a given key without changing its position. */
    peek: (key: Key): Value | undefined => {
      const index = keyMap.get(key);

      if (index === undefined) return undefined;
      if (timestamps && _isExpired(index, key)) return undefined;

      return valList[index];
    },

    /** Checks if a key exists in the cache. */
    has(key: Key): boolean {
      const index = keyMap.get(key);

      if (index === undefined) return false;
      if (timestamps && _isExpired(index, key)) return false;

      return true;
    },

    /** Iterates over all keys in the cache, from most recent to least recent. */
    *keys(): IterableIterator<Key> {
      let current = tail;
      const expiredKeys: Key[] = [];

      for (let i = 0; i < size; i++) {
        const key = keyList[current]!;
        if (timestamps && _isStale(current)) expiredKeys.push(key);
        else yield key;

        current = prev[current];
      }

      for (const key of expiredKeys) {
        const idx = keyMap.get(key);
        if (idx !== undefined) _deleteByIndex(idx, key);
      }
    },

    /** Iterates over all values in the cache, from most recent to least recent. */
    *values(): IterableIterator<Value> {
      let current = tail;
      const expiredKeys: Key[] = [];

      for (let i = 0; i < size; i++) {
        const key = keyList[current]!;
        if (timestamps && _isStale(current)) expiredKeys.push(key);
        else yield valList[current]!;

        current = prev[current];
      }

      for (const key of expiredKeys) {
        const idx = keyMap.get(key);
        if (idx !== undefined) _deleteByIndex(idx, key);
      }
    },

    /** Iterates over `[key, value]` pairs in the cache, from most recent to least recent. */
    *entries(): IterableIterator<[Key, Value]> {
      let current = tail;
      const expiredKeys: Key[] = [];

      for (let i = 0; i < size; i++) {
        const key = keyList[current]!;
        if (timestamps && _isStale(current)) expiredKeys.push(key);
        else yield [key, valList[current]!];

        current = prev[current];
      }

      for (const key of expiredKeys) {
        const idx = keyMap.get(key);
        if (idx !== undefined) _deleteByIndex(idx, key);
      }
    },

    /** Iterates over each value-key pair in the cache, from most recent to least recent. */
    forEach: (callback: (value: Value, key: Key) => unknown): undefined => {
      let current = tail;
      const expiredKeys: Key[] = [];

      for (let i = 0; i < size; i++) {
        const key = keyList[current]!;
        if (timestamps && _isStale(current)) expiredKeys.push(key);
        else {
          const value = valList[current]!;
          callback(value, key);
        }

        current = prev[current];
      }

      for (const key of expiredKeys) {
        const idx = keyMap.get(key);
        if (idx !== undefined) _deleteByIndex(idx, key);
      }
    },

    /** Deletes a key-value pair from the cache. */
    delete(key: Key): boolean {
      const index = keyMap.get(key);

      if (index === undefined) return false;

      _deleteByIndex(index, key);

      return true;
    },

    /** Evicts the oldest item or the specified number of the oldest items from the cache. */
    evict: (number: number): undefined => {
      let toPrune = Math.min(number, size);

      while (toPrune > 0) {
        _evict();
        toPrune--;
      }
    },

    /** Clears all key-value pairs from the cache. */
    clear(): undefined {
      if (typeof onEviction === 'function') {
        let current = head;

        for (let i = 0; i < size; i++) {
          onEviction(keyList[current]!, valList[current]!);
          current = next[current];
        }
      }

      keyMap.clear();
      keyList.fill(undefined);
      valList.fill(undefined);

      free = [];
      size = 0;
      head = tail = 0;
    },

    /** Resizes the cache to a new maximum size, evicting items if necessary. */
    resize: (newMax: number): undefined => {
      if (!(Number.isInteger(newMax) && newMax > 0))
        throw new TypeError('`max` must be a positive integer');

      if (newMax === max) return;

      if (newMax < max) {
        let current = tail;

        const preserve = Math.min(size, newMax);
        const remove = size - preserve;
        const newKeyList: (Key | undefined)[] = new Array(newMax);
        const newValList: (Value | undefined)[] = new Array(newMax);
        const newNext: number[] = new Array(newMax);
        const newPrev: number[] = new Array(newMax);

        for (let i = 0; i < remove; i++) {
          const key = keyList[head]!;

          onEviction?.(key, valList[head]!);
          keyMap.delete(key);
          head = next[head];
        }

        for (let i = preserve - 1; i >= 0; i--) {
          newKeyList[i] = keyList[current];
          newValList[i] = valList[current];
          newNext[i] = i + 1;
          newPrev[i] = i - 1;
          keyMap.set(newKeyList[i]!, i);
          current = prev[current];
        }

        head = 0;
        tail = preserve - 1;
        size = preserve;

        keyList.length = newMax;
        valList.length = newMax;
        next.length = newMax;
        prev.length = newMax;

        for (let i = 0; i < preserve; i++) {
          keyList[i] = newKeyList[i];
          valList[i] = newValList[i];
          next[i] = newNext[i];
          prev[i] = newPrev[i];
        }

        free = [];

        for (let i = preserve; i < newMax; i++) free.push(i);
      } else {
        const fill = newMax - max;

        keyList.push(...new Array(fill).fill(undefined));
        valList.push(...new Array(fill).fill(undefined));
        next.push(...new Array(fill).fill(0));
        prev.push(...new Array(fill).fill(0));
      }

      max = newMax;
    },

    /** Iterates over the cache and retrieves dump information for a specific key or all keys. */
    *dump(key?: Key): Generator<
      | {
          /** Item key. */
          key: Key;
          /** Item value. */
          value: Value | undefined;
          /** Time in milliseconds. */
          staleAt: number | 'never';
          /** When `true`, the next interaction with the key will evict it. */
          isStale: boolean;
          /** From the most recent (`0`) to the oldest (`max`). */
          position: number;
        }
      | undefined
    > {
      if (key !== undefined) {
        const result = _dump(key);

        if (result) yield result;

        return;
      }

      let current = tail;

      for (let i = 0; i < size; i++) {
        yield _dump(keyList[current]!);
        current = prev[current];
      }
    },

    /** Returns the maximum number of items that can be stored in the cache. */
    get max() {
      return max;
    },

    /** Returns the number of items currently stored in the cache. */
    get size() {
      return size;
    },

    /** Returns the number of currently available slots in the cache before reaching the maximum size. */
    get available() {
      return max - size;
    },
  };
};
