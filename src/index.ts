export type CacheOptions<Key = unknown, Value = unknown> = {
  /** Maximum number of items the cache can hold. */
  max: number;
  /** Function called with the key and the value displaced by an eviction, deletion, or replacement. */
  onEviction?: (key: Key, value: Value) => unknown;
};

type State = {
  size: number;
  head: number;
  tail: number;
  free: number;
  max: number;
  next: Int32Array;
  prev: Int32Array;
};

export const createLRU = <Key, Value>(options: CacheOptions<Key, Value>) => {
  const { max, onEviction = null } = options;

  if (!(Number.isInteger(max) && max > 0))
    throw new TypeError('`max` must be a positive integer');

  let draining = false;

  const states = new WeakMap<object, State>();

  const accessors = {
    /** Returns the maximum number of items that can be stored in the cache. */
    get max(): number {
      return states.get(this)!.max;
    },

    /** Returns the number of items currently stored in the cache. */
    get size(): number {
      return states.get(this)!.size;
    },

    /** Returns the number of currently available slots in the cache before reaching the maximum size. */
    get available(): number {
      const state = states.get(this)!;

      return state.max - state.size;
    },
  };

  const state: State = {
    size: 0,
    head: 0,
    tail: 0,
    free: -1,
    max,
    next: new Int32Array(max),
    prev: new Int32Array(max),
  };

  const keyMap: Map<Key, number> = new Map();
  const keyList: (Key | undefined)[] = new Array(max).fill(undefined);
  const valList: (Value | undefined)[] = new Array(max).fill(undefined);
  const evictedKeys: (Key | undefined)[] = [];
  const evictedValues: (Value | undefined)[] = [];

  const reserve = (count: number): number => {
    const start = evictedKeys.length;

    evictedKeys.length = start + count;
    evictedValues.length = start + count;

    return start;
  };

  const drainQueued = (thrown: boolean, thrownError: unknown): undefined => {
    const limit = evictedKeys.length + state.max;

    let failed = thrown;
    let failure = thrownError;
    let cursor = 0;

    while (cursor < evictedKeys.length) {
      if (cursor === limit) {
        evictedKeys.length = 0;
        evictedValues.length = 0;
        draining = false;

        throw new RangeError(
          '`onEviction` re-entered the cache without settling'
        );
      }

      const key = evictedKeys[cursor]!;
      const value = evictedValues[cursor]!;

      evictedKeys[cursor] = undefined;
      evictedValues[cursor] = undefined;
      cursor++;

      try {
        onEviction!(key, value);
      } catch (error) {
        if (!failed) {
          failure = error;
          failed = true;
        }
      }
    }

    evictedKeys.length = 0;
    evictedValues.length = 0;
    draining = false;

    if (failed) throw failure;
  };

  const drain = (): undefined => {
    if (draining || evictedKeys.length === 0) return;

    draining = true;

    drainQueued(false, undefined);
  };

  const announce = (key: Key, value: Value): undefined => {
    if (draining) {
      evictedKeys.push(key);
      evictedValues.push(value);

      return;
    }

    draining = true;

    let failed = false;
    let failure: unknown;

    try {
      onEviction!(key, value);
    } catch (error) {
      failure = error;
      failed = true;
    }

    if (failed || evictedKeys.length > 0) return drainQueued(failed, failure);

    draining = false;
  };

  const linkTail = (index: number): undefined => {
    const tail = state.tail;

    state.next[tail] = index;
    state.prev[index] = tail;
    state.tail = index;
  };

  const moveToTail = (index: number): undefined => {
    if (index === state.tail) return;

    const { next, prev } = state;
    const nextIndex = next[index];
    const prevIndex = prev[index];

    if (index === state.head) state.head = nextIndex;
    else next[prevIndex] = nextIndex;

    prev[nextIndex] = prevIndex;

    linkTail(index);
  };

  const _shrink = (newMax: number): undefined => {
    const preserve = Math.min(state.size, newMax);
    const remove = state.size - preserve;
    const newKeyList: (Key | undefined)[] = new Array(preserve);
    const newValList: (Value | undefined)[] = new Array(preserve);
    const next = new Int32Array(newMax);
    const prev = new Int32Array(newMax);

    let current = state.tail;
    let slot = onEviction !== null && remove > 0 ? reserve(remove) : 0;

    for (let i = 0; i < remove; i++) {
      const key = keyList[state.head]!;

      if (onEviction !== null) {
        evictedKeys[slot] = key;
        evictedValues[slot] = valList[state.head];
        slot++;
      }

      keyMap.delete(key);
      state.head = state.next[state.head];
    }

    for (let i = preserve - 1; i >= 0; i--) {
      newKeyList[i] = keyList[current];
      newValList[i] = valList[current];
      keyMap.set(keyList[current]!, i);
      current = state.prev[current];
    }

    keyList.length = newMax;
    valList.length = newMax;

    for (let i = 0; i < preserve; i++) {
      keyList[i] = newKeyList[i];
      valList[i] = newValList[i];
      next[i] = i + 1;
      prev[i] = i - 1;
    }

    keyList.fill(undefined, preserve);
    valList.fill(undefined, preserve);

    state.size = preserve;
    state.head = 0;
    state.tail = preserve - 1;
    state.free = -1;
    state.next = next;
    state.prev = prev;
  };

  const _grow = (newMax: number): undefined => {
    const capacity = state.next.length;

    if (newMax > capacity) {
      const reserved = Math.max(newMax, capacity + (capacity >>> 1) + 16);
      const next = new Int32Array(reserved);
      const prev = new Int32Array(reserved);

      next.set(state.next);
      prev.set(state.prev);
      state.next = next;
      state.prev = prev;
    }

    for (let i = state.max; i < newMax; i++) {
      keyList.push(undefined);
      valList.push(undefined);
    }
  };

  const methods = {
    /** Adds a key-value pair to the cache. Updates the value if the key already exists. */
    set(key: Key, value: Value): undefined {
      if (key === undefined) return;

      let index = keyMap.get(key);

      if (index === undefined) {
        if (state.size === state.max) {
          index = state.head;

          const evictedKey = keyList[index]!;
          const evictedValue = onEviction === null ? undefined : valList[index];

          state.head = state.next[index];
          keyList[index] = key;
          valList[index] = value;

          if (state.size === 1) state.head = state.tail = index;
          else linkTail(index);

          keyMap.delete(evictedKey);
          keyMap.set(key, index);

          if (onEviction !== null) announce(evictedKey, evictedValue!);

          return;
        }

        index = state.free;

        if (index === -1) index = state.size;
        else state.free = state.next[index];

        state.size++;
        keyList[index] = key;
        valList[index] = value;

        if (state.size === 1) state.head = state.tail = index;
        else linkTail(index);

        keyMap.set(key, index);

        return;
      }

      const replaced = onEviction === null ? undefined : valList[index];

      valList[index] = value;
      moveToTail(index);

      if (onEviction !== null) announce(key, replaced!);
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

    /** Iterates over all keys in the cache, from most recent to least recent. */
    *keys(): IterableIterator<Key> {
      let current = state.tail;

      for (let i = 0; i < state.size; i++) {
        yield keyList[current]!;
        current = state.prev[current];
      }
    },

    /** Iterates over all values in the cache, from most recent to least recent. */
    *values(): IterableIterator<Value> {
      let current = state.tail;

      for (let i = 0; i < state.size; i++) {
        yield valList[current]!;
        current = state.prev[current];
      }
    },

    /** Iterates over `[key, value]` pairs in the cache, from most recent to least recent. */
    *entries(): IterableIterator<[Key, Value]> {
      let current = state.tail;

      for (let i = 0; i < state.size; i++) {
        yield [keyList[current]!, valList[current]!];
        current = state.prev[current];
      }
    },

    /** Iterates over each value-key pair in the cache, from most recent to least recent. */
    forEach: (callback: (value: Value, key: Key) => unknown): undefined => {
      let current = state.tail;

      for (let i = 0; i < state.size; i++) {
        const key = keyList[current]!;
        const value = valList[current]!;

        callback(value, key);

        current = state.prev[current];
      }
    },

    /** Deletes a key-value pair from the cache. */
    delete(key: Key): boolean {
      const index = keyMap.get(key);

      if (index === undefined) return false;

      const removed = onEviction === null ? undefined : valList[index];

      keyList[index] = undefined;
      valList[index] = undefined;

      const { next, prev } = state;
      const nextIndex = next[index];
      const prevIndex = prev[index];

      if (index === state.head) state.head = nextIndex;
      else next[prevIndex] = nextIndex;

      if (index === state.tail) state.tail = prevIndex;
      else prev[nextIndex] = prevIndex;

      next[index] = state.free;
      state.free = index;
      state.size--;

      keyMap.delete(key);

      if (onEviction !== null) announce(key, removed!);

      return true;
    },

    /** Evicts the oldest item or the specified number of the oldest items from the cache. */
    evict: (number: number): undefined => {
      let toPrune = Math.min(number, state.size);
      let slot = onEviction !== null && toPrune > 0 ? reserve(toPrune) : 0;

      while (toPrune > 0) {
        const evictHead = state.head;
        const key = keyList[evictHead]!;

        if (onEviction !== null) {
          evictedKeys[slot] = key;
          evictedValues[slot] = valList[evictHead];
          slot++;
        }

        keyList[evictHead] = undefined;
        valList[evictHead] = undefined;
        state.head = state.next[evictHead];
        state.next[evictHead] = state.free;
        state.free = evictHead;
        state.size--;
        toPrune--;

        keyMap.delete(key);
      }

      if (state.size === 0) state.head = state.tail = 0;

      if (onEviction !== null) drain();
    },

    /** Clears all key-value pairs from the cache. */
    clear(): undefined {
      if (onEviction !== null && state.size > 0) {
        let current = state.head;
        let slot = reserve(state.size);

        for (let i = 0; i < state.size; i++) {
          evictedKeys[slot] = keyList[current];
          evictedValues[slot] = valList[current];
          slot++;
          current = state.next[current];
        }
      }

      keyMap.clear();
      keyList.fill(undefined);
      valList.fill(undefined);

      state.size = 0;
      state.head = state.tail = 0;
      state.free = -1;

      if (onEviction !== null) drain();
    },

    /** Resizes the cache to a new maximum size, evicting items if necessary. */
    resize: (newMax: number): undefined => {
      if (!(Number.isInteger(newMax) && newMax > 0))
        throw new TypeError('`max` must be a positive integer');

      if (newMax === state.max) return;
      if (newMax < state.max) _shrink(newMax);
      else _grow(newMax);

      state.max = newMax;

      if (onEviction !== null) drain();
    },
  };

  const cache: typeof methods & typeof accessors = Object.setPrototypeOf(
    methods,
    accessors
  );

  states.set(cache, state);

  return cache;
};
