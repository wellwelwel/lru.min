<h1 align="center">lru.min</h1>
<div align="center">

[![NPM Version](https://img.shields.io/npm/v/lru.min.svg?label=&color=70a1ff&logo=npm&logoColor=white)](https://www.npmjs.com/package/lru.min)
[![Coverage](https://img.shields.io/codecov/c/github/wellwelwel/lru.min?label=&logo=codecov&logoColor=white&color=98cc00)](https://github.com/wellwelwel/lru.min/tree/main/.nycrc)<br />
[![GitHub Workflow Status (Node.js)](https://img.shields.io/github/actions/workflow/status/wellwelwel/lru.min/ci_node.yml?event=push&label=&branch=main&logo=nodedotjs&logoColor=535c68&color=badc58)](https://github.com/wellwelwel/lru.min/actions/workflows/ci_node.yml?query=branch%3Amain)
[![GitHub Workflow Status (Bun)](https://img.shields.io/github/actions/workflow/status/wellwelwel/lru.min/ci_bun.yml?event=push&label=&branch=main&logo=bun&logoColor=ffffff&color=f368e0)](https://github.com/wellwelwel/lru.min/actions/workflows/ci_bun.yml?query=branch%3Amain)
[![GitHub Workflow Status (Deno)](https://img.shields.io/github/actions/workflow/status/wellwelwel/lru.min/ci_deno.yml?event=push&label=&branch=main&logo=deno&logoColor=ffffff&color=079992)](https://github.com/wellwelwel/lru.min/actions/workflows/ci_deno.yml?query=branch%3Amain)

🔥 An extremely fast and efficient <strong><a href="https://en.m.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29">LRU</a> Cache</strong> for <strong>JavaScript</strong> (<strong>Browser</strong> compatible) — **6.7KB**.

</div>

## Why another LRU?

- 🎖️ **lru.min** is fully compatible with both **Node.js** _(8+)_, **Bun**, **Deno** and, browser environments. All of this, while maintaining the same high performance _(and a little more)_.

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

const LRU = createLRU({ max: 150_000 });
```

Also, you can set a callback for every deletion/eviction:

```ts
const LRU = createLRU({
  max: 150_000,
  onEviction: (key, value) => {
    // do something
  },
});
```

### Set a cache

Adds a key-value pair to the cache. Updates the value if the key already exists

```ts
LRU.set('key', 'value');
```

> `undefined` keys will simply be ignored.

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
LRU.evict(1000);
```

### Resize the cache

Resizes the cache to a new maximum size, evicting items if necessary.

```ts
LRU.resize(50_000);
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
LRU.forEach((value, key) => {
  // do something
});
```

---

### Performance

The benchmark is performed by comparing `1,000,000` runs through a maximum cache limit of `100,000`, getting `333,333` caches and delenting `200,000` keys 10 consecutive times, clearing the cache every run.

> - [**lru-cache**](https://github.com/isaacs/node-lru-cache) `v11.0.0`
> - [**quick-lru**](https://github.com/sindresorhus/quick-lru) `v7.0.0`

```sh
# Time:
  lru.min:    240.45ms
  lru-cache:  258.32ms
  quick-lru:  279.89ms

# CPU:
  lru.min:    275558.30µs
  lru-cache:  306858.30µs
  quick-lru:  401318.80µs
```

- See detailed results and how the tests are run and compared in the [**benchmark**](https://github.com/wellwelwel/lru.min/tree/main/benchmark) directory.

---

## Security Policy

[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/wellwelwel/lru.min/ci_codeql.yml?event=push&label=&branch=main&logo=github&logoColor=white&color=f368e0)](https://github.com/wellwelwel/lru.min/actions/workflows/ci_codeql.yml?query=branch%3Amain)

Please check the [**SECURITY.md**](https://github.com/wellwelwel/lru.min/blob/main/SECURITY.md).

---

## Contributing

See the [**Contributing Guide**](https://github.com/wellwelwel/lru.min/blob/main/CONTRIBUTING.md) and please follow our [**Code of Conduct**](https://github.com/wellwelwel/lru.min/blob/main/CODE_OF_CONDUCT.md) 🚀

---

## Acknowledgements

**lru.min** is based and inspired on the architecture and code of both [**lru-cache**](https://github.com/isaacs/node-lru-cache) and [**quick-lru**](https://github.com/sindresorhus/quick-lru), simplifying their core concepts for enhanced performance and compatibility.

> For more comprehensive features such as **TTL** support, consider using and supporting them 🤝

- The architecture is mostly based on [@isaacs](https://github.com/isaacs) — [**lru-cache**](https://github.com/isaacs/node-lru-cache/blob/8f51d75351cbb4ac819952eb8e9f95eda00ef800/src/index.ts).
- Most of the methods names and its functionalities were inspired by [@sindresorhus](https://github.com/sindresorhus) — [**quick-lru**](https://github.com/sindresorhus/quick-lru/blob/a2262c65e1952539cb4d985a67c46363a780d234/index.js).
- [![Contributors](https://img.shields.io/github/contributors/wellwelwel/lru.min?label=Contributors)](https://github.com/wellwelwel/lru.min/graphs/contributors)

---

## License

**lru.min** is under the [**MIT License**](https://github.com/wellwelwel/lru.min/blob/main/LICENSE).<br />
Copyright © 2024-present [Weslley Araújo](https://github.com/wellwelwel) and **lru.min** [contributors](https://github.com/wellwelwel/lru.min/graphs/contributors).
