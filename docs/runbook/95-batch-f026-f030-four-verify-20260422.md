# 95 · §3 批次 F-026～F-030 · 四验 + §8.2 对齐（2026-04-22）

> **不含 F-031**（社区帖子 **IA/commerce** 机读见 **`docs/runbook/95-batch-f011-f015-four-verify-20260422.md`** **`create_post_commerce_parse`/`tests_create_post_commerce`**）。**不**宣称 **93 PASS** / **行完成** / **§3.1 `[x]`**（**ISS-007**）。

## 1. 环境

- **`DATABASE_URL`**：`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`（**`orders`/`internal`/`admin`** 子集；**`idempotency_http_contract_tests`**/**`key_hash_tests`**/**`idempotency_cache_meta…`** 本批亦绿 **未**显式依赖 export，与 **§8.2** 脚注一致）

## 2. 路由验证

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
bash scripts/run-check-04-routes.sh
```

**结果**：**exit 0**（**178** 路径）。

## 3. 机读命令与结果

| 过滤串 | passed | failed |
|--------|--------|--------|
| `routes::messages::tests` | 13 | 0 |
| `orders::tests::suite` | 20 | 0 |
| `idempotency_http_contract_tests` | 2 | 0 |
| `key_hash_tests` | 1 | 0 |
| `critical_write_path_union_includes_order_and_admin_paths` | 1 | 0 |
| `idempotency_cache_meta_top_keys_order_and_literals_753` | 1 | 0 |
| `internal::tests` | 93 | 0 |
| `routes::admin::tests` | 172 | 0 |

## 4. 分 F 映射（§3）

| F | 主证据 |
|---|--------|
| **F-026** 订单消息 | **`routes::messages::tests`** **13** |
| **F-027** 评价 / 订单域 UT | **`orders::tests::suite`** **20**（**含** **`reviews_*`/`review_submit_*`** **503** 等；**§8.2·F-027·API·IT `[x]`** 仍以 **v1.4.172** **`review_submit_db_pool_*`** 专测为准；**本批未**重跑 **`review_submit_db_pool_idempotent_contract`**/**`b447_*`**） |
| **F-028** 幂等 | **`idempotency_http_contract_tests` 2** + **`key_hash_tests` 1** + **`rate_limit`** **关键写路径 1** + **`health_meta` `idempotency_cache_meta…` 1** |
| **F-029** 索引器 / internal | **`internal::tests`** **93** |
| **F-030** Admin | **`routes::admin::tests`** **172** |

## 5. §8.2 / §9

- **行完成**/**§3.1**/**93**/**E2E**：仍 **`[ ]`**（**ISS-007**）。
- **§9**：**不**新增 **ISS**。
