# GO_20260423 · close-loop · F-015 / F-016 / F-017（API·IT + E2E + `report.json`）

## 代码修复（ISS-007 旁路：链下读回 **503**）

**根因**：`db::user_liked_post` / `db::user_collected_post` 使用 `query_scalar::<_, i64>` 解码 `SELECT 1`（PG 为 **INT4**），`get_post_detail` 在存在赞/藏时 **`tokio::join!`** 读 `liked_by_me`/`collected_by_me` **解码失败** → **`community_service_unavailable`（503）**。  
**修复**：两函数改为 `query_scalar::<_, i32>`（`crates/api/src/db/community.rs`）。

## 本轮机读链

| 层 | 命令 / 证据 |
|---|----------------|
| **API·IT** | `DATABASE_URL=…` **`cargo test -p traveltrust-api`** **`matrix_93_d_com_002_f015_post_then_get_post_detail_matches_app_stack_ok_pg`** + **`matrix_93_d_com_003_f016_post_like_twice_idempotent_app_stack_ok_pg`** + **`matrix_93_d_com_008_f017_post_collect_twice_idempotent_app_stack_ok_pg`** → **各 1 passed** |
| **E2E** | `cd frontend && … npm run e2e:api-d-com-015-017-local` → **`6 passed`**（`f015-f016-f017-request.spec.ts` · **`api-d-com-015-017-chromium`**） |

## 93 映射（与 spec 脚注一致）

| F | 93（主锚） |
|---|------------|
| **F-015** | **D-COM-002** |
| **F-016** | **D-COM-003** |
| **F-017** | **D-COM-008** |

## 诚实边界

- **`report.json`**：**`local`** · **`PARTIAL_GO`**；**不**闭 **§9 · ISS-007**（staging **`report.json` 全矩阵** / **`build.yml`·`e2e`·`run_id`** 仍开）。
- **§8.2「行完成」**：母表已为 **`[x]`**；本轮为 **R↑（机读 + 生产缺陷修复）**。
