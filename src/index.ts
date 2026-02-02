export type CacheOptions<Key = unknown, Value = unknown> = {
  /** Maximum number of items the cache can hold. */
  max: number;
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

  const { onEviction } = options;
  const keyMap: Map<Key, number> = new Map();
  const keyList: (Key | undefined)[] = new Array(max).fill(undefined);
  const valList: (Value | undefined)[] = new Array(max).fill(undefined);
  const next: number[] = new Array(max).fill(0);
  const prev: number[] = new Array(max).fill(0);

  const setTail = (index: number): undefined => {
    if (index === tail) return;

    const nextIndex = next[index];
    const prevIndex = prev[index];

    if (index === head) head = nextIndex;
    else next[prevIndex] = nextIndex;

    prev[nextIndex] = prevIndex;

    next[tail] = index;
    prev[index] = tail;
    next[index] = 0;
    tail = index;
  };

  const _shrink = (newMax: number): undefined => {
    let current = tail;

    const preserve = Math.min(size, newMax);
    const remove = size - preserve;
    const newKeyList: (Key | undefined)[] = new Array(preserve);
    const newValList: (Value | undefined)[] = new Array(preserve);

    for (let i = 0; i < remove; i++) {
      const key = keyList[head]!;

      onEviction?.(key, valList[head]!);
      keyMap.delete(key);
      head = next[head];
    }

    for (let i = preserve - 1; i >= 0; i--) {
      newKeyList[i] = keyList[current];
      newValList[i] = valList[current];
      keyMap.set(keyList[current]!, i);
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
      next[i] = i + 1;
      prev[i] = i - 1;
    }

    free = [];

    for (let i = preserve; i < newMax; i++) free.push(i);
  };

  const _grow = (newMax: number): undefined => {
    keyList.length = newMax;
    valList.length = newMax;
    next.length = newMax;
    prev.length = newMax;

    keyList.fill(undefined, max);
    valList.fill(undefined, max);
    next.fill(0, max);
    prev.fill(0, max);
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
        valList[index] = value;

        if (size === 1) head = tail = index;
        else {
          next[tail] = index;
          prev[index] = tail;
          next[index] = 0;
          tail = index;
        }
      } else {
        onEviction?.(key, valList[index]!);
        valList[index] = value;
        setTail(index);
      }
    },

    /** Retrieves the value for a given key and moves the key to the most recent position. */
    get(key: Key): Value | undefined {
      const index = keyMap.get(key);

      if (index === undefined) return;
      if (index !== tail) setTail(index);

      return valList[index];
    },

    /** Retrieves the value for a given key without changing its position. */
    peek: (key: Key): Value | undefined => {
      const index = keyMap.get(key);

      return index !== undefined ? valList[index] : undefined;
    },

    /** Checks if a key exists in the cache. */
    has: (key: Key): boolean => keyMap.has(key),

    /** Iterates over all keys in the cache, from most recent to least recent. */
    *keys(): IterableIterator<Key> {
      let current = tail;

      for (let i = 0; i < size; i++) {
        yield keyList[current]!;
        current = prev[current];
      }
    },

    /** Iterates over all values in the cache, from most recent to least recent. */
    *values(): IterableIterator<Value> {
      let current = tail;

      for (let i = 0; i < size; i++) {
        yield valList[current]!;
        current = prev[current];
      }
    },

    /** Iterates over `[key, value]` pairs in the cache, from most recent to least recent. */
    *entries(): IterableIterator<[Key, Value]> {
      let current = tail;

      for (let i = 0; i < size; i++) {
        yield [keyList[current]!, valList[current]!];
        current = prev[current];
      }
    },

    /** Iterates over each value-key pair in the cache, from most recent to least recent. */
    forEach: (callback: (value: Value, key: Key) => unknown): undefined => {
      let current = tail;

      for (let i = 0; i < size; i++) {
        const key = keyList[current]!;
        const value = valList[current]!;

        callback(value, key);

        current = prev[current];
      }
    },

    /** Deletes a key-value pair from the cache. */
    delete(key: Key): boolean {
      const index = keyMap.get(key);

      if (index === undefined) return false;

      onEviction?.(key, valList[index]!);
      keyMap.delete(key);
      free.push(index);

      keyList[index] = undefined;
      valList[index] = undefined;

      const prevIndex = prev[index];
      const nextIndex = next[index];

      if (index === head) head = nextIndex;
      else next[prevIndex] = nextIndex;

      if (index === tail) tail = prevIndex;
      else prev[nextIndex] = prevIndex;

      size--;

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
      if (newMax < max) _shrink(newMax);
      else _grow(newMax);

      max = newMax;
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
