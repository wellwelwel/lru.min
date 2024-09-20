import { createLRU } from './src/index.js';

const LRU = createLRU({
  max: 100,
  maxAge: 1000,
});

LRU.set('A', 'Value');

setTimeout(() => {
  console.log(LRU.get('A'));
}, 2000);
