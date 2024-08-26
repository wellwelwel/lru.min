<h1 align="center">lru.min</h1>
<div align="center">

🔥 An extremely fast and efficient <strong><a href="https://en.m.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29">LRU</a> Cache</strong> for <strong>JavaScript</strong> (<strong>Browser</strong> compatible) — **4.8KB**.

</div>

>

## Why

#### 🤝 Compatibility

- **lru.min** ensures is fully compatible with both **Node.js** _(8+)_, **Bun**, **Deno** and, browser environments.

🎖️ Performance

- [Check comparisons between **Node.js**, **Bun** and **Deno**](#performance).

> Note that although performance is indeed important, the main purpose behind **lru.min** is the high compatibility level.

---

## Install

```bash
# Node.js
npm i lru.min
```

```bash
# Bun
bun add lru.min
```

```bash
# Deno
deno add npm:lru.min
```

---

## Usage

> - ⚠️ Please wait until `v1.x.x` before using this package.
> - 📘 Public repository coming soon.

### Import

#### ES Modules

```js
import { createLRU } from 'lru.min';
```

#### CommonJS

```js
const { createLRU } = require('lru.min');
```

#### Browser

```html
<script src="https://cdn.jsdelivr.net/npm/lru.min/browser/lru.min.js"></script>
```

### Create a new LRU Cache

> Set maximum size when creating **LRU**.

```ts
import { createLRU } from 'lru.min';

const LRU = createLRU({ max: 1000 });
```

Also, you can set a callback for every deletion:

```ts
const LRU = createLRU({
  max: 1000,
  dispose: (key, value) => {
    // do something
  },
});
```

### Set a cache

Adds a key-value pair to the cache. Updates the value if the key already exists

```ts
LRU.set('key', 'value');
```

### Get a cache

Retrieves the value for a given key and moves the key to the most recent position.

```ts
LRU.get('key');
```

### Peek a cache

Retrieves the value for a given key without changing its position.

```ts
LRU.get('key');
```

### Check if a key exists

```ts
LRU.has('key');
```

### Delete a cache

```ts
LRU.delete('key');
```

### Evict from the oldest cache

Evicts the specified number of the oldest items from the cache.

```ts
LRU.evict(10);
```

### Resize the cache

Resizes the cache to a new maximum size, evicting items if necessary.

```ts
LRU.resize(500);
```

### Clear the cache

Clears and disposes (if used) all key-value pairs from the cache.

```ts
LRU.clear();
```

### Debugging

#### Get the max size of the cache

```ts
LRU.max;
```

#### Get the current size of the cache

```ts
LRU.size;
```

#### Get the available slots in the cache

```ts
LRU.available;
```

#### Get all keys

Iterates over all keys in the cache, from least recent to most recent.

```ts
const keys = [...LRU.keys()];
```

#### Get all values

Iterates over all values in the cache, from least recent to most recent.

```ts
const keys = [...LRU.values()];
```

#### Get all entries

Iterates over `[key, value]` pairs in the cache, from least recent to most recent.

```ts
const entries = [...LRU.entries()];
```

#### Get all entries

Iterates over `[key, value]` pairs in the cache, from least recent to most recent.

```ts
const entries = [...LRU.entries()];
```

#### Run a callback for each entry

Iterates over each key-value pair in the cache, from most recent to least recent.

```ts
LRU.forEach((key, value) => {
  // do something
});
```

---

### Performance

The benchmark is performed by comparing `1,000,000` runs through a maximum cache limit of `100,000`, getting `333,333` caches and delenting `200,000` keys 10 consecutive times, clearing the cache every run.

> You can see how the tests are run and compared in the [benchmark](https://github.com/wellwelwel/lru.min/tree/main/benchmark) directory.
>
> - [**lru-cache**](https://github.com/isaacs/node-lru-cache) `v11.0.0`
> - [**quick-lru**](https://github.com/sindresorhus/quick-lru) `v7.0.0`

#### Node.js

```sh
# ES Modules
lru.min: 247.45ms
lru-cache: 255.93ms
quick-lru: 312.90ms
```

```sh
# CommonJS
lru.min: 236.35ms
lru-cache: 258.74ms
quick-lru: not compatible
```

#### Bun

```sh
# ES Modules
lru.min: 298.42ms
quick-lru: 315.37ms
lru-cache: 359.23ms
```

```sh
# CommonJS
lru.min: 363.79ms
lru-cache: 371.39ms
quick-lru: not compatible
```

#### Deno

```sh
# ES Modules
lru.min: 222.60ms
lru-cache: 227.80ms
quick-lru: 253.00ms
```

[**lru-cache**](https://github.com/isaacs/node-lru-cache) `v11.x.x`

---

## Security Policy

Please check the [**SECURITY.md**](https://github.com/wellwelwel/lru.min/blob/main/SECURITY.md).

---

## Acknowledgements

> **lru.min** is based on the architecture and code of [**lru-cache**](https://github.com/isaacs/node-lru-cache) and [**quick-lru**](https://github.com/sindresorhus/quick-lru), simplifying their core concepts for enhanced performance and compatibility.
>
> For more comprehensive features such as **TTL** support, consider using and supporting them 🤝

- [@isaacs](https://github.com/isaacs) and [lru-cache](https://github.com/isaacs/node-lru-cache).
- [@sindresorhus](https://github.com/sindresorhus) and [quick-lru](https://github.com/sindresorhus/quick-lru).
- [![Contributors](https://img.shields.io/github/contributors/wellwelwel/lru.min?label=Contributors)](https://github.com/wellwelwel/lru.min/graphs/contributors)

---

## License

**lru.min** is under the [**MIT License**](https://github.com/wellwelwel/lru.min/blob/main/LICENSE).<br />
Copyright © 2024-present [Weslley Araújo](https://github.com/wellwelwel) and **lru.min** [contributors](https://github.com/wellwelwel/lru.min/graphs/contributors).

**lru-cache** is licensed under the [**ISC License**](https://github.com/isaacs/node-lru-cache/blob/main/LICENSE).<br />
Copyright © 2010-2023 Isaac Z. Schlueter and Contributors.

**quick-lru** is licensed under the [**MIT License**](https://github.com/sindresorhus/quick-lru/blob/main/license).<br />
Copyright © Sindre Sorhus.
