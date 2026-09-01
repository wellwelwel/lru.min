# Changelog

## [1.1.5](https://github.com/wellwelwel/lru.min/compare/v1.1.4...v1.1.5) (2026-08-25)


### Bug Fixes

* release stale key and value copies left behind by resize ([#69](https://github.com/wellwelwel/lru.min/issues/69)) ([0408402](https://github.com/wellwelwel/lru.min/commit/0408402440c078878871ac0078a42605e48339e1))

## [1.1.4](https://github.com/wellwelwel/lru.min/compare/v1.1.3...v1.1.4) (2026-02-02)


### Bug Fixes

* reset `prev` sentinel unconditionally on eviction ([#61](https://github.com/wellwelwel/lru.min/issues/61)) ([19ddd18](https://github.com/wellwelwel/lru.min/commit/19ddd18809fca44260043c5c575c77d054a6d895))
* traverse linked list from head in `resize` eviction loop ([#59](https://github.com/wellwelwel/lru.min/issues/59)) ([733f281](https://github.com/wellwelwel/lru.min/commit/733f281a4c58d8ff45be795b84026b947fdf7f20))
* traverse linked list from head in resize eviction loop ([733f281](https://github.com/wellwelwel/lru.min/commit/733f281a4c58d8ff45be795b84026b947fdf7f20))
* use structural checks in linked list instead of sentinel comparisons ([#63](https://github.com/wellwelwel/lru.min/issues/63)) ([fd27698](https://github.com/wellwelwel/lru.min/commit/fd27698740eb661395c6b072263044725fc5faba))


### Performance Improvements

* improve `set` to avoid redundant writes ([#65](https://github.com/wellwelwel/lru.min/issues/65)) ([11d81c1](https://github.com/wellwelwel/lru.min/commit/11d81c1cb6f0346882a328730771dd542d34008b))
* reduce `resize` allocations ([#62](https://github.com/wellwelwel/lru.min/issues/62)) ([709f5a9](https://github.com/wellwelwel/lru.min/commit/709f5a96989726a653d6cc8a826a9a455d4b4950))

## [1.1.3](https://github.com/wellwelwel/lru.min/compare/v1.1.2...v1.1.3) (2025-11-13)


### Performance Improvements

* minimize clear method overhead using linked list traversal ([#55](https://github.com/wellwelwel/lru.min/issues/55)) ([76e52cc](https://github.com/wellwelwel/lru.min/commit/76e52ccd75073b8f1514f19c7bd695562cb0641f))

## [1.1.2](https://github.com/wellwelwel/lru.min/compare/v1.1.1...v1.1.2) (2025-03-09)


### Performance Improvements

* improve variable declaration types and its order ([#49](https://github.com/wellwelwel/lru.min/issues/49)) ([4e2ec1c](https://github.com/wellwelwel/lru.min/commit/4e2ec1c9b22b71ed8c356b003a70de96cf8a4e11))

## [1.1.1](https://github.com/wellwelwel/lru.min/compare/v1.1.0...v1.1.1) (2024-09-20)


### Bug Fixes

* improve browser compatibility ([#44](https://github.com/wellwelwel/lru.min/issues/44)) ([a952976](https://github.com/wellwelwel/lru.min/commit/a95297672adbc5dfd4fe1c9d4193229bebb801a8))


### Performance Improvements

* improve `clear` efficiency ([#42](https://github.com/wellwelwel/lru.min/issues/42)) ([e087a57](https://github.com/wellwelwel/lru.min/commit/e087a57a14a8b8903f3a047ee892ddbce11d9b99))

## [1.1.0](https://github.com/wellwelwel/lru.min/compare/v1.0.0...v1.1.0) (2024-08-28)


### Features

* **typings:** expose `CacheOptions` type ([#38](https://github.com/wellwelwel/lru.min/issues/38)) ([47930f4](https://github.com/wellwelwel/lru.min/commit/47930f4dac647820e3ceade7e6b0fdb8520f5ade))

## 1.0.0 (2024-08-27)


### Features

* lru.min's birth ([a2d2b27](https://github.com/wellwelwel/lru.min/commit/a2d2b274575587c9c9583ce3fe65ba9e23356804))
