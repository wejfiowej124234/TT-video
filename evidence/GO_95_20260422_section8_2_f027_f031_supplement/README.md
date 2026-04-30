# GO_95 · §8.2 · F-027～F-033 扇面机读复验（补充 · 2026-04-22）

## 1. 目的

在 **《95》§8.2** 脚注 **F-027～031（v1.4.46）** / **v1.4.75** **`…f027_f031/README.md` §4** / **v1.4.77** **`…f028/README.md` §4** 已落盘的前提下，于本机 **复跑同一 Rust 过滤串**（**不**改 **§8.2** 母表 **`93`/`E2E`/`行完成`** **`[ ]]`**；**不**闭 **ISS-002**/**ISS-007**）。

## 2. 环境注记

- 证据采集 shell：**未** `export DATABASE_URL`（`DATABASE_URL unset`）。
- **闭证**仍以 **§8.2** 五格 + **§9** 为准；本包仅 **UT/负例/503 门** 子集复验。

## 3. 命令与结果（仓库根）

```bash
bash scripts/check-07-version-triple.sh
# → OK: 07 version triple aligned (1.0.858).

bash scripts/run-check-04-routes.sh
# → exit 0

cargo test -p traveltrust-api orders::tests::suite
# → 20 passed

cargo test -p traveltrust-api idempotency_http_contract_tests
# → 2 passed

cargo test -p traveltrust-api key_hash_tests
# → 1 passed

cargo test -p traveltrust-api middleware::rate_limit::tests
# → 4 passed

cargo test -p traveltrust-api health_meta::tests::idempotency_cache_meta_top_keys_order_and_literals_753
# → 1 passed

cargo test -p traveltrust-api internal::tests
# → 93 passed

cargo test -p traveltrust-api routes::admin::tests
# → 172 passed

cargo test -p traveltrust-api create_post_commerce_parse_tests
# → 5 passed

cargo test -p traveltrust-api tests_create_post_commerce
# → 3 passed

cargo test -p traveltrust-api trust_growth_api_tests
# → 6 passed

cargo test -p traveltrust-api trust_growth_autopilot
# → 2 passed

cargo test -p traveltrust-api itinerary_custom_draft
# → 8 passed
```

## 4. 主叙事 SSOT（并列）

- **`evidence/GO_95_20260421_section8_2_f027_f031/README.md`** — **F-027～031** 四验 §4 母证。
- **`evidence/GO_95_20260421_section8_2_f028/README.md`** — **F-028** 负例 HTTP 四验 / **v1.4.77** 扩展机读。
- **`evidence/GO_95_20260421_section8_2_f032/README.md`** / **`…f033/README.md`** — **F-032**/**F-033** 并入脚注（本补充 **含** **`trust_growth_*`/`itinerary_custom_draft`** 复跑）。

## 5. 诚实边界

- **不**将本包 **UT 子集绿** 误读为 **§8.2** **`93`/`E2E`/`行完成`** 已 **`[x]`**（**ISS-007** 仍开）。
- **F-028～031** **API·IT** 母表 **`[ ]]`** 与 **v1.4.173** **§8.2·F-027～031** 脚注对齐；**F-027** **API·IT** **`[x]`** 以 **v1.4.172** 专测为准，**本包未**重跑 **`review_submit_db_pool_idempotent_contract`**（**非**回归缺证；仅 **扇面补充**）。
