<h1 align="center">lru.min</h1>
<div align="center">

🔥 Extremely fast <strong>LRU Cache</strong> for <strong>JavaScript</strong> (<strong>Browser</strong> compatible) — **6.1KB**.

</div>

## Why

#### 🤝 Compatibility

- **lru.min** ensures is fully compatible with both **Node.js** _(8+)_, **Bun**, **Deno** and, browser environments.<br />

#### 👨🏻‍💻 Features

- 🕢 Smart and dynamic **TTL**.
- 🧹 Efficient **disposal** handling.
- ✅ Truly respects the maximum **cache size**.
- 🔑 Take full caching control _(highly debuggable)_.

#### 🎖️ [Performance](#performance)

- **lru.min** has beaten the two most used and popular **LRU** packages.

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
> - 📘 Complete documentation an public repository coming soon.

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

---

## Performance

In **Bun**, lru.min achieves up to **11** more operations per second than [**lru-cache**](https://github.com/isaacs/node-lru-cache) `v11.x.x` and up to **5** more ops per second than [**quick-lru**](https://github.com/sindresorhus/quick-lru) `v7.x.x` for essential usage (_get_, _set_, _evict_, and _delete_ the cache):

```sh
# Total Number of Cores: 24 (16 performance and 8 efficiency)
# Memory: 64 GB

› Node.js
lru-cache   x 24.42 ops/sec — ±0.76% (45 runs sampled)
quick-lru   x 25.62 ops/sec — ±0.33% (47 runs sampled)
lru.min     x 26.28 ops/sec — ±0.19% (48 runs sampled)

🚀 Fastest is lru.min

› Bun
lru-cache   x 97.75 ops/sec — ±0.32% (85 runs sampled)
quick-lru   x 105.72 ops/sec — ±0.33% (79 runs sampled)
lru.min     x 110.08 ops/sec — ±0.34% (82 runs sampled)

🚀 Fastest is lru.min

› Deno
lru-cache   x 52.79 ops/sec — ±0.38% (70 runs sampled)
quick-lru   x 54.23 ops/sec — ±0.34% (71 runs sampled)
lru.min     x 56.39 ops/sec — ±0.33% (74 runs sampled)

🚀 Fastest is lru.min
```

- You can see how the tests are run and compared in the [benchmark](https://github.com/wellwelwel/lru.min/tree/main/benchmark) directory.
- **lru.min** is [continuously tested](https://github.com/wellwelwel/lru.min/blob/main/.github/workflows/ci_benchmark.yml) to ensure the above expectations.

<!--

---

## Acknowledgements

[![Contributors](https://img.shields.io/github/contributors/wellwelwel/lru.min?label=Contributors)](https://github.com/wellwelwel/lru.min/graphs/contributors)

-->
