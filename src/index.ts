export const createLRU = <Key, Value>(options: {
  /** Maximum number of items the cache can hold. */
  max: number;
  /** Function called when an item is evicted from the cache. */
  onEviction?: (key: Key, value: Value) => unknown;
}) => {
  let { max, onEviction } = options;

  if (!(Number.isInteger(max) && max > 0))
    throw new TypeError('`max` must be a positive integer');

  let size = 0;
  let head = 0;
  let tail = 0;
  let free: number[] = [];

  const keyMap: Map<Key, number> = new Map();
  const keyList: (Key | undefined)[] = new Array(max).fill(undefined);
  const valList: (Value | undefined)[] = new Array(max).fill(undefined);
  const next: number[] = new Array(max).fill(0);
  const prev: number[] = new Array(max).fill(0);

  const moveToTail = (index: number): undefined => {
    if (index === tail) return;

    const nextIndex = next[index];

    if (index === head) head = nextIndex;
    else {
      const prevIndex = prev[index];
      next[prevIndex] = nextIndex;
      prev[nextIndex] = prevIndex;
    }

    next[tail] = index;
    prev[index] = tail;
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
    size--;

    return evictHead;
  };

  return {
    /** Adds a key-value pair to the cache. Updates the value if the key already exists. */
    set(key: Key, value: Value): undefined {
      let index = keyMap.get(key);

      if (index === undefined) {
        index = size === max ? _evict() : free.length > 0 ? free.pop()! : size;
        keyMap.set(key, index);
        keyList[index] = key;
        size++;
      } else onEviction?.(key, valList[index]!);

      valList[index] = value;

      moveToTail(index);
    },

    /** Retrieves the value for a given key and moves the key to the most recent position. */
    get(key: Key): Value | undefined {
      const index = keyMap.get(key);

      if (index === undefined) return;

      moveToTail(index);
      return valList[index];
    },

    /** Retrieves the value for a given key without changing its position. */
    peek: (key: Key): Value | undefined => {
      const index = keyMap.get(key);

      return index !== undefined ? valList[index] : undefined;
    },

    /** Checks if a key exists in the cache. */
    has: (key: Key): boolean => keyMap.has(key),

    /** Iterates over all keys in the cache, from least recent to most recent. */
    *keys(): IterableIterator<Key> {
      let current = head;

      for (let i = 0; i < size; i++) {
        yield keyList[current]!;
        current = next[current];
      }
    },

    /** Iterates over all values in the cache, from least recent to most recent. */
    *values(): IterableIterator<Value> {
      let current = head;

      for (let i = 0; i < size; i++) {
        yield valList[current]!;
        current = next[current];
      }
    },

    /** Iterates over `[key, value]` pairs in the cache, from least recent to most recent. */
    *entries(): IterableIterator<[Key, Value]> {
      let current = head;

      for (let i = 0; i < size; i++) {
        yield [keyList[current]!, valList[current]!];
        current = next[current];
      }
    },

    /** Iterates over each key-value pair in the cache, from most recent to least recent. */
    forEach: (callback: (value: Value, key: Key) => unknown): undefined => {
      let current = head;

      for (let i = 0; i < size; i++) {
        const key = keyList[current]!;
        const value = valList[current]!;

        callback(value, key);

        current = next[current];
      }
    },

    /** Deletes a key-value pair from the cache. */
    delete(key: Key): boolean {
      const index = keyMap.get(key);

      if (index !== undefined) {
        onEviction?.(key, valList[index]!);
        keyMap.delete(key);
        free.push(index);

        keyList[index] = undefined;
        valList[index] = undefined;

        size--;

        return true;
      }

      return false;
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
      for (const index of keyMap.values())
        onEviction?.(keyList[index]!, valList[index]!);

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

      max = newMax;

      while (size > max) _evict();
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
