export type CacheOptions<Key = unknown, Value = unknown> = {
  /** Maximum number of items the cache can hold. */
  max: number;
  /**
   * Maximum age (in ms) for items before they are considered stale.
   *
   * @default undefined
   */
  stale?: number;
  /**
   * When `true` and `stale` is set, items remain stale based on their initial expiration.
   *
   * @default undefined
   */
  keepStale?: boolean;
  /**
   * Function called when an item is evicted from the cache.
   *
   * @default undefined
   */
  onEviction?: (key: Key, value: Value) => unknown;
};

export const createLRU = <Key, Value>(options: CacheOptions<Key, Value>) => {
  let { max, onEviction, stale, keepStale } = options;

  if (!(Number.isInteger(max) && max > 0))
    throw new TypeError('`max` must be a positive integer');

  if (
    (typeof stale !== 'undefined' && typeof stale !== 'number') ||
    (typeof stale === 'number' && stale <= 0)
  )
    throw new TypeError('`stale` must be a positive number');

  const Age = (() => {
    try {
      return typeof performance.now === 'function' ? performance : Date;
    } catch {
      return Date;
    }
  })();

  let size = 0;
  let head = 0;
  let tail = 0;
  let free: number[] = [];

  const keyMap: Map<Key, number> = new Map();
  const keyList: (Key | undefined)[] = new Array(max).fill(undefined);
  const valList: (Value | undefined)[] = new Array(max).fill(undefined);
  const expList: number[] = new Array(max).fill(0);
  const ageList: number[] = new Array(max).fill(0);
  const next: number[] = new Array(max).fill(0);
  const prev: number[] = new Array(max).fill(0);

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
    expList[evictHead] = 0;
    ageList[evictHead] = 0;
    head = next[evictHead];

    if (head !== 0) prev[head] = 0;

    size--;

    if (size === 0) head = tail = 0;

    free.push(evictHead);

    return evictHead;
  };

  const _delete = (key: Key): boolean => {
    const index = keyMap.get(key);

    if (index === undefined) return false;

    onEviction?.(key, valList[index]!);
    keyMap.delete(key);
    free.push(index);

    keyList[index] = undefined;
    valList[index] = undefined;
    expList[index] = 0;
    ageList[index] = 0;

    const prevIndex = prev[index];
    const nextIndex = next[index];

    if (prevIndex !== 0) next[prevIndex] = nextIndex;
    if (nextIndex !== 0) prev[nextIndex] = prevIndex;

    if (index === head) head = nextIndex;
    if (index === tail) tail = prevIndex;

    size--;

    return true;
  };

  const _checkAge = (key: Key): boolean => {
    const index = keyMap.get(key);

    if (index !== undefined) {
      const expiresAt = expList[index];

      if (expiresAt !== 0 && Age.now() > expiresAt) {
        _delete(key);
        return false;
      }
    }

    return true;
  };

  const _debug = (key: Key) => {
    const index = keyMap.get(key);

    if (index === undefined) return;

    const ageItem = ageList[index];
    const expiresAt = expList[index];
    const now = Age.now();
    const timeRemaining = expiresAt !== 0 ? expiresAt - now : 0;
    const isStale = expiresAt !== 0 && now > expiresAt;

    let current = tail;
    let position = 0;

    while (current !== index && current !== 0) {
      current = prev[current];
      position++;
    }

    return {
      key,
      value: valList[index],
      maxAge: ageItem,
      expiresAt: timeRemaining > 0 ? timeRemaining : 0,
      isStale,
      position,
    };
  };

  return {
    /** Adds a key-value pair to the cache. Updates the value if the key already exists. */
    set(key: Key, value: Value, options?: { stale?: number }): undefined {
      if (key === undefined) return;

      let index = keyMap.get(key);

      if (index === undefined) {
        index = size === max ? _evict() : free.length > 0 ? free.pop()! : size;
        keyMap.set(key, index);
        keyList[index] = key;
        size++;
      } else onEviction?.(key, valList[index]!);

      valList[index] = value;

      const keyMaxAge = options?.stale !== undefined ? options.stale : stale;

      if (keyMaxAge !== undefined) {
        if (
          (typeof stale !== 'undefined' && typeof stale !== 'number') ||
          (typeof stale === 'number' && stale <= 0)
        )
          throw new TypeError('`stale` must be a positive number');

        expList[index] = Age.now() + keyMaxAge;
        ageList[index] = keyMaxAge;
      } else {
        expList[index] = 0;
        ageList[index] = 0;
      }

      if (size === 1) head = tail = index;
      else setTail(index, 'set');
    },

    /** Retrieves the value for a given key and moves the key to the most recent position. */
    get(key: Key): Value | undefined {
      const index = keyMap.get(key);

      if (index === undefined) return;
      if (!_checkAge(key)) return;

      if (index !== tail) setTail(index, 'get');

      if (keepStale !== true) {
        const itemMaxAge = ageList[index];

        if (itemMaxAge !== 0) {
          expList[index] = Age.now() + itemMaxAge;
        }
      }

      return valList[index];
    },

    /** Retrieves the value for a given key without changing its position. */
    peek: (key: Key): Value | undefined => {
      const index = keyMap.get(key);

      if (!_checkAge(key)) return;
      return index !== undefined ? valList[index] : undefined;
    },

    /** Checks if a key exists in the cache. */
    has: (key: Key): boolean => {
      const index = keyMap.get(key);

      if (index === undefined) return false;
      if (!_checkAge(key)) return false;

      if (keepStale !== true) {
        const itemMaxAge = ageList[index];

        if (itemMaxAge !== 0) {
          expList[index] = Age.now() + itemMaxAge;
        }
      }

      return true;
    },

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

    /** Iterates over the cache and retrieves debug information for a specific key or all keys. */
    *debug(key?: Key): Generator<
      | {
          /** Item key. */
          key: Key;
          /** Item value. */
          value: Value | undefined;
          /** Time in milliseconds. */
          maxAge: number;
          /** Time in milliseconds. */
          expiresAt: number;
          /** When `true`, the next interaction with the key will evict it. */
          isStale: boolean;
          /** From the most recent (`0`) to the oldest (`max`). */
          position: number;
        }
      | undefined
    > {
      if (key !== undefined) {
        const result = _debug(key);

        if (result) yield result;

        return;
      }

      let current = tail;

      for (let i = 0; i < size; i++) {
        yield _debug(keyList[current]!);
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
    delete: _delete,

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
        const iterator = keyMap.values();

        for (
          let result = iterator.next();
          !result.done;
          result = iterator.next()
        )
          onEviction(keyList[result.value]!, valList[result.value]!);
      }

      keyMap.clear();
      keyList.fill(undefined);
      valList.fill(undefined);
      expList.fill(0);
      ageList.fill(0);

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
        const newKeyList: (Key | undefined)[] = new Array(newMax).fill(
          undefined
        );
        const newValList: (Value | undefined)[] = new Array(newMax).fill(
          undefined
        );
        const newExpList: number[] = new Array(newMax).fill(0);
        const newAgeList: number[] = new Array(newMax).fill(0);
        const newNext: number[] = new Array(newMax).fill(0);
        const newPrev: number[] = new Array(newMax).fill(0);

        for (let i = 1; i <= remove; i++)
          onEviction?.(keyList[i]!, valList[i]!);

        for (let i = preserve - 1; i >= 0; i--) {
          newKeyList[i] = keyList[current];
          newValList[i] = valList[current];
          newExpList[i] = expList[current];
          newAgeList[i] = ageList[current];
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
        expList.length = newMax;
        ageList.length = newMax;
        next.length = newMax;
        prev.length = newMax;

        for (let i = 0; i < preserve; i++) {
          keyList[i] = newKeyList[i];
          valList[i] = newValList[i];
          expList[i] = newExpList[i];
          ageList[i] = newAgeList[i];
          next[i] = newNext[i];
          prev[i] = newPrev[i];
        }

        free = [];

        for (let i = preserve; i < newMax; i++) free.push(i);
      } else {
        const fill = newMax - max;

        keyList.push(...new Array(fill).fill(undefined));
        valList.push(...new Array(fill).fill(undefined));
        expList.push(...new Array(fill).fill(0));
        ageList.push(...new Array(fill).fill(0));
        next.push(...new Array(fill).fill(0));
        prev.push(...new Array(fill).fill(0));
      }

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
