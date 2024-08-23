export interface LRUCacheOptions<Key extends string, Value> {
  max: number;
  maxAge?: number;
  dispose?: (value: Value, key: Key) => undefined;
}

export interface SetOptions {
  maxAge?: number;
}

interface CacheNode<Key, Value> {
  key: Key;
  value: Value;
  prev: CacheNode<Key, Value> | null;
  next: CacheNode<Key, Value> | null;
  timestamp?: number;
  maxAge?: number;
}

export const createLRU = <Key extends string, Value>(
  options: LRUCacheOptions<Key, Value>
) => {
  let max = options.max;
  let head: CacheNode<Key, Value> | null = null;
  let tail: CacheNode<Key, Value> | null = null;
  let size = 0;
  let maxAgeCount = 0;

  const map = new Map<Key, CacheNode<Key, Value>>();
  const dispose = options?.dispose;
  const maxAge = options?.maxAge;

  const addNode = (node: CacheNode<Key, Value>): undefined => {
    node.next = head;

    if (head) head.prev = node;
    head = node;

    if (!tail) tail = node;
    size++;
  };

  const removeNode = (node: CacheNode<Key, Value>): undefined => {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === head) head = node.next;
    if (node === tail) tail = node.prev;

    size--;
  };

  const moveToHead = (node: CacheNode<Key, Value>): undefined => {
    removeNode(node);
    addNode(node);
  };

  function refresh(key: Key): boolean;
  function refresh(): undefined;
  function refresh(key?: Key): boolean | undefined {
    if (!(maxAge || maxAgeCount)) return true;

    const now = Date.now();

    if (key) {
      const node = map.get(key);
      if (!node?.timestamp) return true;

      const effectiveMaxAge = node.maxAge ?? maxAge;

      if (effectiveMaxAge && now - node.timestamp > effectiveMaxAge) {
        del(node.key);
        return false;
      }

      return true;
    }

    for (let current = tail; current !== null; current = current.prev) {
      if (!current?.timestamp) continue;

      const effectiveMaxAge = current.maxAge ?? maxAge;

      if (effectiveMaxAge && now - current.timestamp > effectiveMaxAge)
        del(current.key);
    }
  }

  const evict = (size = 1): undefined => {
    for (let i = 0; i < size; i++) {
      if (!tail) return;

      const tailKey = tail.key;
      const tailValue = tail.value;

      if (tail.maxAge && maxAgeCount > 0) {
        maxAgeCount--;
      }

      removeNode(tail);
      map.delete(tailKey);

      if (dispose) dispose(tailValue, tailKey);
    }
  };

  const set = (key: Key, value: Value, options?: SetOptions): undefined => {
    let node = map.get(key);

    const now = maxAge || options?.maxAge ? Date.now() : undefined;

    if (options?.maxAge && !map.has(key)) maxAgeCount++;

    if (node) {
      node.value = value;
      node.timestamp = now;
      node.maxAge = options?.maxAge;

      if (head !== node) moveToHead(node);

      return;
    }

    node = {
      key,
      value,
      prev: null,
      next: null,
      timestamp: now,
    };

    map.set(key, node);
    addNode(node);

    if (size > max) evict();
  };

  const get = (key: Key): Value | undefined => {
    const node = map.get(key);
    if (!node) return;
    if (!refresh(key)) return;

    if (head !== node) moveToHead(node);

    return node.value;
  };

  const peek = (key: Key): Value | undefined => {
    const node = map.get(key);
    if (!node) return;
    if (!refresh(key)) return;

    if (node?.timestamp) {
      const now = Date.now();
      const effectiveMaxAge = node.maxAge ?? maxAge;

      if (effectiveMaxAge && now - node.timestamp > effectiveMaxAge) {
        del(key);
        return;
      }
    }

    return node.value;
  };

  const has = (key: Key): boolean => {
    if (!refresh(key)) return false;

    return map.has(key);
  };

  const keys = (): Key[] => {
    const result: Key[] = [];

    for (let current = head; current !== null; current = current.next) {
      if (!refresh(current.key)) continue;

      result.push(current.key);
    }

    return result;
  };

  const values = (): Value[] => {
    const result: Value[] = [];

    for (let current = head; current !== null; current = current.next) {
      if (!refresh(current.key)) continue;

      result.push(current.value);
    }

    return result;
  };

  const entries = (): [Key, Value][] => {
    const result: [Key, Value][] = [];

    for (let current = head; current !== null; current = current.next) {
      if (!refresh(current.key)) continue;

      result.push([current.key, current.value]);
    }

    return result;
  };

  const forEach = (
    callback: (value: Value, key: Key) => undefined
  ): undefined => {
    for (let current = head; current !== null; current = current.next) {
      if (!refresh(current.key)) continue;

      callback(current.value, current.key);
    }
  };

  const del = (key: Key): boolean => {
    const node = map.get(key);
    if (!node) return false;

    if (node.maxAge && maxAgeCount > 0) {
      maxAgeCount--;
    }

    removeNode(node);
    map.delete(key);

    if (dispose) dispose(node.value, key);

    return true;
  };

  const clear = (): undefined => {
    if (dispose) for (const node of map.values()) dispose(node.value, node.key);

    map.clear();

    head = tail = null;
    size = 0;
    maxAgeCount = 0;
  };

  const resize = (newMax: number): undefined => {
    max = newMax;

    for (let i = size; i > max; i--) evict();
  };

  const available = () => {
    refresh();

    return max - map.size;
  };

  const stored = () => {
    refresh();

    return map.size;
  };

  const maxSize = () => max;

  return {
    /** Adds a key-value pair to the cache. Updates the value if the key already exists. */
    set,

    /** Retrieves the value for a given key and moves the key to the most recent position. */
    get,

    /** Retrieves the value for a given key without changing its position in the cache. */
    peek,

    /** Checks if a key exists in the cache. */
    has,

    /** Returns an array of all keys in the cache, from most recent to least recent. */
    keys,

    /** Returns an array of all values in the cache, from most recent to least recent. */
    values,

    /** Returns an array of [key, value] pairs, from most recent to least recent. */
    entries,

    /** Iterates over each key-value pair in the cache, from most recent to least recent. */
    forEach,

    /** Deletes a key-value pair from the cache. */
    del,

    /** Evicts the oldest item or the specified number of the oldest items from the cache. */
    evict,

    /** Clears all key-value pairs from the cache. */
    clear,

    /** Resizes the cache to a new maximum size, evicting items if necessary. */
    resize,

    /** Returns the number of available slots in the cache before reaching the maximum size. */
    available,

    /** Returns the number of items currently stored in the cache. */
    stored,

    /** Returns the maximum number of items that can be stored in the cache. */
    maxSize,
  };
};
