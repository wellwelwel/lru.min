interface CacheNode<Key, Value> {
  key: Key;
  value: Value;
  prev: CacheNode<Key, Value> | null;
  next: CacheNode<Key, Value> | null;
  timestamp: number | undefined;
  ttl?: number;
}

export interface LRUCacheOptions<Key extends string, Value> {
  max: number;
  ttl?: number;
  dispose?: (value: Value, key: Key) => unknown;
}

export interface LRUSetOptions {
  ttl?: number;
}

export const createLRU = <Key extends string, Value>(
  options: LRUCacheOptions<Key, Value>
) => {
  if (!(options.max && options.max > 0)) {
    throw new TypeError('`max` must be a number greater than 0');
  }

  if (typeof options.ttl === 'number' && options.ttl === 0) {
    throw new TypeError('`ttl` must be a number greater than 0');
  }

  let max = options.max;
  let head: CacheNode<Key, Value> | null = null;
  let tail: CacheNode<Key, Value> | null = null;
  let size = 0;

  const map = new Map<Key, CacheNode<Key, Value>>();
  const ttl = options?.ttl;
  const dispose =
    typeof options.dispose === 'function' ? options?.dispose : undefined;

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

  const refresh = (key: Key): boolean => {
    const node = map.get(key);
    if (!node?.timestamp) return true;

    const TTL = node.ttl ?? ttl;
    if (!TTL) return true;

    const now = Date.now();

    if (now - node.timestamp > TTL) {
      del(node.key);
      return false;
    }

    return true;
  };

  const iterate = <T>(callback: (key: Key, value: Value) => T): T[] => {
    const result: T[] = [];

    for (let current = head; current !== null; current = current.next) {
      if (!refresh(current.key)) continue;

      result.push(callback(current.key, current.value));
    }

    return result;
  };

  const set = (key: Key, value: Value, options?: LRUSetOptions): undefined => {
    if (typeof options?.ttl === 'number' && options.ttl === 0) {
      throw new TypeError('`ttl` must be a number greater than 0');
    }

    let node = map.get(key);

    const now = ttl || options?.ttl ? Date.now() : undefined;

    if (node) {
      node.value = value;
      node.timestamp = now;
      node.ttl = options?.ttl;

      if (head !== node) moveToHead(node);

      return;
    }

    if (size === max) evict();

    node = {
      key,
      value,
      prev: null,
      next: null,
      timestamp: now,
    };

    map.set(key, node);
    addNode(node);
  };

  const get = (key: Key): Value | undefined => {
    const node = map.get(key);
    if (!node || !refresh(key)) return;

    if (head !== node) moveToHead(node);

    return node.value;
  };

  const peek = (key: Key): Value | undefined => {
    const node = map.get(key);
    if (!node || !refresh(key)) return;

    return node.value;
  };

  const has = (key: Key): boolean => {
    if (!refresh(key)) return false;

    return map.has(key);
  };

  const keys = (): Key[] => iterate((key) => key);

  const values = (): Value[] => iterate((_, value) => value);

  const entries = (): [Key, Value][] => iterate((key, value) => [key, value]);

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

    removeNode(node);
    map.delete(key);

    if (dispose) dispose(node.value, key);

    return true;
  };

  const evict = (size = 1): undefined => {
    for (let i = 0; i < size; i++) {
      if (!tail) return;

      const tailKey = tail.key;
      const tailValue = tail.value;

      removeNode(tail);
      map.delete(tailKey);

      if (dispose) dispose(tailValue, tailKey);
    }
  };

  const clear = (): undefined => {
    if (dispose) for (const node of map.values()) dispose(node.value, node.key);

    map.clear();

    head = tail = null;
    size = 0;
  };

  const resize = (newMax: number): undefined => {
    max = newMax;

    for (let i = size; i > max; i--) evict();
  };

  const available = () => max - map.size;

  const stored = () => map.size;

  const maxSize = () => max;

  return {
    /** Adds a key-value pair to the cache. Updates the value if the key already exists. */
    set,

    /** Retrieves the value for a given key and moves the key to the most recent position. */
    get,

    /** Retrieves the value for a given key without changing its position. */
    peek,

    /** Checks if a key exists in the cache. */
    has,

    /** Returns an array of all keys in the cache, from most recent to least recent. */
    keys,

    /** Returns an array of all values in the cache, from most recent to least recent. */
    values,

    /** Returns an array of `[key, value]` pairs, from most recent to least recent. */
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

    /** Returns the number of currently available slots in the cache before reaching the maximum size. */
    available,

    /** Returns the number of items currently stored in the cache. */
    stored,

    /** Returns the maximum number of items that can be stored in the cache. */
    max: maxSize,
  };
};
