//! Playwright trust-gate 全栈 E2E：在 `SEED_TEST_ACCOUNTS=1` 下向 chain_off 内存态注入固定夹具。
//! 重复调用覆盖同 UUID 键。有 `db_pool` 时 **best-effort** 双写 **`users`/`guides`**（并对占用的 `@trustgate-e2e.local` 邮箱做 reclaim 后再插入），以满足 Bearer→`sessions` FK；并对夹具 **`orders`** 行 **`upsert_order`**，以满足 **`evidence_receipts.order_id`** 等 FK；对 **`prefix::is_trust_gate_seeded_order_id`** 关联的 **`disputes`** 行 **`upsert_dispute_chain_off_fixture`**（**`ON CONFLICT (id) DO UPDATE`**），使 **`GET /disputes/:id`** 在有 PG 行时与 **内存 `DisputeRow`** 一致（旧 E2E 已 **resolve** 的 PG 行不再「**DO NOTHING** 卡住」），且 **`append_evidence_hash_to_dispute`** 与夹具可对齐。**非**夹具订单 / 未落 PG 的争议行仍以链下内存为主读路径（`GET /disputes/:id` PG 无行时回退链下）。
//!
//! **维护：** 新增夹具订单须落在 **`prefix::is_trust_gate_seeded_order_id`** 判定内（当前为 **`f0e0c201-0001-4001-8001-`** / **`f0e0e401-0001-4001-8001-`** 前缀），或同步扩展该函数；否则 PG **不会** upsert 该行，**`POST …/evidence`** 仍可能触发 FK 与双写 WARN。与 **`prefix_gate_tests`** · **`auth_trust_gate_e2e_seed_db_api_tests`** 中 **`matrix_93_b_tg_002_*`** / **`matrix_93_b_tg_003_*`** / **`matrix_93_b_tg_004_*`**（**`DATABASE_URL`** PG·IT）对拍。
//!
//! **子模块：** **`ids`**（固定 UUID）、**`prefix`**（密码与前缀门闸）、**`order_fixture`**、**`memory_users_guides`** / **`memory_orders_early`** / **`memory_disputes_tail`** / **`memory`**（内存写入）、**`pg_sync`**（PG）、**`fixture_response`**（JSON）、**`seed`**（编排）。

mod fixture_response;
mod ids;
mod memory;
mod memory_disputes_tail;
mod memory_orders_early;
mod memory_users_guides;
mod order_fixture;
mod pg_sync;
mod prefix;
mod seed;

pub use seed::seed_trust_gate_e2e_fixtures;

#[cfg(test)]
mod prefix_gate_tests;
