interface CacheNode<Key, Value> {
  key: Key;
  value: Value;
  prev: CacheNode<Key, Value> | undefined;
  next: CacheNode<Key, Value> | undefined;
}

export interface LRUCacheOptions<Key, Value> {
  max: number;
  dispose?: (value: Value, key: Key) => unknown;
}

export function createLRU<Key, Value>(options: LRUCacheOptions<Key, Value>) {
  let max = options.max;
  let head: CacheNode<Key, Value> | undefined;
  let tail: CacheNode<Key, Value> | undefined;
  let size = 0;

  const map = new Map<Key, CacheNode<Key, Value>>();
  const dispose =
    typeof options.dispose === 'function' ? options.dispose : undefined;

  const addNode = (node: CacheNode<Key, Value>): undefined => {
    node.next = head;

    if (head) head.prev = node;
    head = node;

    if (!tail) tail = node;
    size++;
  };

  const removeNode = (node: CacheNode<Key, Value>): undefined => {
    if (node.prev !== undefined) node.prev.next = node.next;
    if (node.next !== undefined) node.next.prev = node.prev;
    if (node === head) head = node.next ?? undefined;
    if (node === tail) tail = node.prev ?? undefined;

    node.prev = node.next = undefined;
    size--;
  };

  const moveToHead = (node: CacheNode<Key, Value>): undefined => {
    if (node.prev === undefined && node.next === undefined) return;

    removeNode(node);
    addNode(node);
  };

  const iterate = <T>(callback: (key: Key, value: Value) => T): T[] => {
    const result: T[] = [];

    for (
      let current = head;
      current !== undefined;
      current = current.next ?? undefined
    ) {
      result.push(callback(current.key, current.value));
    }

    return result;
  };

  const evict = (): undefined => {
    if (!tail) return;

    const tailKey = tail.key;

    removeNode(tail);
    map.delete(tailKey);

    if (dispose) dispose(tail.value, tailKey);
  };

  return {
    /** Adds a key-value pair to the cache. Updates the value if the key already exists. */
    set: (key: Key, value: Value): undefined => {
      let node = map.get(key);

      if (node) {
        node.value = value;

        if (head !== node) moveToHead(node);

        return;
      }

      if (size === max) evict();

      node = {
        key,
        value,
        prev: undefined,
        next: undefined,
      };

      map.set(key, node);
      addNode(node);
    },

    /** Retrieves the value for a given key and moves the key to the most recent position. */
    get: (key: Key): Value | undefined => {
      const node = map.get(key);
      if (!node) return;

      if (head !== node) moveToHead(node);

      return node.value;
    },

    /** Retrieves the value for a given key without changing its position. */
    peek: (key: Key): Value | undefined => {
      const node = map.get(key);
      if (!node) return;

      return node.value;
    },

    /** Checks if a key exists in the cache. */
    has: (key: Key): boolean => map.has(key),

    /** Returns an array of all keys in the cache, from most recent to least recent. */
    keys: (): Key[] => iterate((key) => key),

    /** Returns an array of all values in the cache, from most recent to least recent. */
    values: (): Value[] => iterate((_, value) => value),

    /** Returns an array of `[key, value]` pairs, from most recent to least recent. */
    entries: (): [Key, Value][] => iterate((key, value) => [key, value]),

    /** Iterates over each key-value pair in the cache, from most recent to least recent. */
    forEach: (callback: (value: Value, key: Key) => undefined): undefined => {
      for (
        let current = head;
        current !== undefined;
        current = current.next ?? undefined
      ) {
        callback(current.value, current.key);
      }
    },

    /** Deletes a key-value pair from the cache. */
    delete: (key: Key): boolean => {
      const node = map.get(key);
      if (!node) return false;

      removeNode(node);
      map.delete(key);

      if (dispose) dispose(node.value, key);

      return true;
    },

    /** Prunes the oldest item or the specified number of the oldest items from the cache. */
    prune: (number: number) => {
      let toPrune = number > size ? size : number;

      while (toPrune > 0) {
        evict();
        toPrune--;
      }
    },

    /** Clears all key-value pairs from the cache. */
    clear: (): undefined => {
      if (dispose)
        for (const node of map.values()) dispose(node.value, node.key);

      map.clear();

      head = tail = undefined;
      size = 0;
    },

    /** Resizes the cache to a new maximum size, evicting items if necessary. */
    resize: (newMax: number): undefined => {
      max = newMax;

      while (size > max) evict();
    },

    /** Returns the number of currently available slots in the cache before reaching the maximum size. */
    available: () => max - size,

    /** Returns the number of items currently stored in the cache. */
    size: () => size,

    /** Returns the maximum number of items that can be stored in the cache. */
    max: () => max,
  };
}
