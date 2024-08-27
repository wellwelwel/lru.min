# Benchmark

The benchmark is performed by comparing `1,000,000` runs through a maximum cache limit of `100,000`, getting `333,333` caches and delenting `200,000` keys 10 consecutive times, clearing the cache every run.

> - [**lru-cache**](https://github.com/isaacs/node-lru-cache) `v11.0.0`
> - [**quick-lru**](https://github.com/sindresorhus/quick-lru) `v7.0.0`

#### Node.js

- ES Modules

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

- CommonJS

```sh
# Time:
  lru.min:    242.86ms
  lru-cache:  264.30ms
  quick-lru:  not compatible

# CPU:
  lru.min:    280118.00µs
  lru-cache:  310327.20µs
  quick-lru:  not compatible
```

#### Bun

- ES Modules

```sh
# Time:
  lru.min:    298.42ms
  quick-lru:  315.37ms
  lru-cache:  359.23ms

# CPU:
  lru.min:    401869.50µs
  quick-lru:  478517.40µs
  lru-cache:  510357.60µs
```

- CommonJS

```sh
# Time:
  lru.min:    324.41ms
  lru-cache:  370.22ms
  quick-lru:  not compatible

# CPU:
  lru.min:    396790.50µs
  lru-cache:  488574.50µs
  quick-lru:  not compatible
```

#### Deno

- ES Modules

```sh
# Time:
  lru.min:    222.60ms
  lru-cache:  227.80ms
  quick-lru:  253.00ms
```

> **Deno** benchmarks were carried out without an isolated process.

---

## Running

To run the benchmark tests, follow these steps in the `./lru.min` directory:

```sh
npm ci
npm run build
npm run benchmark:esm
npm run benchmark:cjs
```
