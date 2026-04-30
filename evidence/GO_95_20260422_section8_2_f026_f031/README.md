# GO_95 · §8.2 · F-026～F-031 审计复跑 · 2026-04-22

对应 **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**、**§8.2**。**不**宣称 **93 PASS** / **E2E 闭证** / **行完成** / **§3.1**（**ISS-007**）。

## 1 · 环境

| **`DATABASE_URL`** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` |

## 2 · 机读命令与结果

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api 'routes::messages::tests::' -- --test-threads=1` | **13 passed**（**F-026**） |
| `cargo test -p traveltrust-api 'routes::orders::tests::suite::' -- --test-threads=1` | **20 passed**（**F-027** 含 **reviews** **503**、**chain_sync** 契约等） |
| `cargo test -p traveltrust-api idempotency_http_contract_tests -- --test-threads=1` | **2 passed**（**F-028**） |
| `cargo test -p traveltrust-api key_hash_tests -- --test-threads=1` | **1 passed**（**F-028**） |
| `cargo test -p traveltrust-api critical_write_path_union_includes_order_and_admin_paths -- --test-threads=1` | **1 passed**（**F-028**） |
| `cargo test -p traveltrust-api idempotency_cache_meta_top_keys_order_and_literals_753 -- --test-threads=1` | **1 passed**（**F-028** `/meta` 机读） |
| `cargo test -p traveltrust-api 'routes::internal::tests::suite_early::' -- --test-threads=1` | **28 passed** |
| `cargo test -p traveltrust-api 'routes::internal::tests::suite_late::' -- --test-threads=1` | **65 passed**（**early+late = 93**，**F-029** **internal** 扇面） |
| `cargo test -p traveltrust-api chain_off:: -- --test-threads=2` | **162 passed, 0 failed**（**F-029** **§11.1 chain_off 扩展面** 同源旁证） |
| `cargo test -p traveltrust-api 'routes::admin::tests::' -- --test-threads=2` | **172 passed**（**F-030**） |
| `cargo test -p traveltrust-api create_post_commerce_parse -- --test-threads=1` | **5 passed**（**F-031**） |
| `cargo test -p traveltrust-api post_community_create_post -- --test-threads=1` | **3 passed**（**F-031** **PG·IT**，无 skip） |

## 3 · 四验诚实结论

- **F-026**：**Router + 内存 chain_off** 下 **happy path 200** 与 **401/403/404/503** 齐全；**`order_messages` PG 二次可读专母** 仍 **§8.2 API·IT `[ ]]`**。
- **F-027**：**suite** 以 **契约/meta/503 负例** 为主；**真实链上评价提交 + PG** 全链仍 **ISS-007**。
- **F-028**：**HTTP 负例** + **key_hash** + **rate_limit 关键写路径** + **`GET /meta` 幂等键序** 机读绿；**幂等 PG 重启抽检** 仍 **§3 PARTIAL** / **行完成 `[ ]]`**。
- **F-029**：**internal 93** + **`chain_off::` 162** 为**工程旁证**；**110 Runbook 人验 / staging 全链** 不并入本包。
- **F-030**：**172** Admin 测（大量 **403/forbidden**、**DB required**、形状对齐）；**≠** **70 全文合规审计** / **93 Admin 抽检归档**。
- **F-031**：**parse 5** + **commerce PG IT 3**；**对客 Tab / IA** 仍 **MANUAL** 口径（**§3 PARTIAL**）。

## 4 · §8.2 五格（与母表一致 · 不升格）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| F-026～030 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-031 | [x] | [x]** | [ ] | [ ] | [x] | [ ] |

**\*\***：**F-015** 与 **F-031** 共享 **`tests_create_post_commerce_db`** 子链；**93·D**/**E2E** 仍 **ISS-007**。

## 5 · §9

不另开 **ISS**（**ISS-007**；**ISS-008** 不覆盖本批主表行）。
