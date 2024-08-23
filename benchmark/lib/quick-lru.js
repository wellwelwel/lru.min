import QuickLRU from 'quick-lru';

const cache = new QuickLRU({
  maxSize: 3,
  // onEviction: (key) => {
  //   console.log(key);
  // },
});

cache.set('a', 1);
cache.set('b', 2);
cache.set('c', 3);
cache.get('a');
cache.set('d', 4); // remove 'b'
cache.get('b');
cache.get('c');
cache.get('d');
cache.delete('c');

// console.log([...cache.keys()]);
