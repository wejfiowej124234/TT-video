# GO_95 · §8.2 · F-011～F-015 审计复跑 · 2026-04-22

对应 **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**、**§8.2**。**不**宣称 **93 PASS** / **E2E 闭证** / **行完成** / **§3.1**（**ISS-007**）。

## 1 · 环境

| **`DATABASE_URL`** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` |

## 2 · 机读命令与结果

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api set_order_escrow_address_impl_` | **2 passed** |
| `cargo test -p traveltrust-api itinerary_create_impl_stores_draft_order_and_bundle` | **1 passed** |
| `cargo test -p traveltrust-api itinerary_create_impl_with_guide_id_persists_guide_on_order` | **1 passed** |
| `cargo test -p traveltrust-api itinerary_create_impl_invalid` | **3 passed** |
| `cargo test -p traveltrust-api unknown_guide_id_returns_guide_not_found` | **2 passed**（含 **`itinerary_custom_*`** 子串命中） |
| `cargo test -p traveltrust-api cities_array_non_preset_returns_400` | **1 passed** |
| `cargo test -p traveltrust-api confirm_final_plan_impl_stores_snapshot_hash` | **1 passed** |
| `cargo test -p traveltrust-api confirm_final_plan_version_conflict_returns_409` | **1 passed** |
| `cargo test -p traveltrust-api get_feed_no_db_returns_database_required` | **1 passed** |
| `cargo test -p traveltrust-api post_like_without_session_returns_401` | **1 passed** |
| `cargo test -p traveltrust-api delete_like_without_session_returns_401` | **1 passed** |
| `cargo test -p traveltrust-api create_post_commerce_parse` | **5 passed** |
| `cargo test -p traveltrust-api post_community_create_post` | **3 passed**（**PG** **`tests_create_post_commerce_db`**，无 skip） |

## 3 · 四验诚实结论

- **F-011～F-013**：**`chain_off::tests_events_itinerary`** 中 **`set_order_escrow_*` / `itinerary_create_impl_*` / `confirm_final_plan_*`** 均为 **`ChainOffState { db_pool: None, … }`** — **内存态 impl 单测**，**不**等价于 **strict PG 写 `orders`/`itineraries`** 或 **真 Escrow 链路径**终验；与 **§3 PARTIAL**、**§8.2 API·IT `[ ]`**（F-011～014）一致。
- **F-014**：本轮为 **无 DB → `database_required`** 与 **未登录 like →401** 等 **负例/契约**；**不**覆盖 **93 · D-COM-001** 全量 **200 Feed**。
- **F-015**：**`post_community_create_post_*` 3/3** 为 **Router::oneshot + PG `community_posts` 二次可读**，**API·IT 子链成立**；**93 · D-COM-001/002** 仍归 **ISS-007**。

## 4 · §8.2 五格（与母表一致 · 不升格）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| F-011～014 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-015 | [x] | [x] | [ ] | [ ] | [x] | [ ] |

## 5 · §9

不另开 **ISS**（**ISS-007** 已覆盖 **93/E2E/行完成**）。
