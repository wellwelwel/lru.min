import { createLRU } from '../../lib/index.mjs';

const max = 100000;
const maxAge = 1000;
const brute = 1000000;

{
  const lru = createLRU({ max });

  for (let i = 0; i < brute; i++) {
    lru.set(`key-${i}`, i);

    if (i > 0 && i % 3 === 0) {
      const randomIndex = Math.floor(Math.random() * i);
      lru.get(`key-${randomIndex}`);
    }

    if (i > 0 && i % 5 === 0) {
      const randomIndex = Math.floor(Math.random() * i);
      lru.delete(`key-${randomIndex}`);
    }
  }

  lru.clear();
}

{
  const lru = createLRU({ max, maxAge });

  for (let i = 0; i < brute; i++) {
    lru.set(`key-${i}`, i);

    if (i > 0 && i % 3 === 0) {
      const randomIndex = Math.floor(Math.random() * i);
      lru.get(`key-${randomIndex}`);
    }

    if (i > 0 && i % 5 === 0) {
      const randomIndex = Math.floor(Math.random() * i);
      lru.delete(`key-${randomIndex}`);
    }
  }

  lru.clear();
}
