//! **`POST /auth/seed-trust-gate-e2e`**：**`SEED_TEST_ACCOUNTS≠1`** → **403**；**`DATABASE_URL`** 下 **`Router::oneshot`** 须见夹具 **`orders`**/**`disputes`** 落 PG；**`POST …/evidence`** 双写 **`evidence_receipts`** 与 **`append_evidence_hash_to_dispute`**；**`TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE=1`** 下 PG 插入失败 → **503**（与 **TT-96-20 §3.1**、**`trust_gate_e2e_seed::prefix_gate_tests`** 对拍）。
//!
//! **跳过条件**：**`matrix_93_b_tg_002+`** 仅当 **`it_db_pool::connect_migrated_pg_it_pool`** 成功（未设或空 **`DATABASE_URL`** 时 **skip** 打印）。
//!
//! **子模块：** **`helpers`**（路由夹具 / 常量）、**`tg001_*`～`tg005_*`**（各 **`matrix_93_b_tg_*`** 用例）。

mod helpers;
mod tg001_forbidden;
mod tg002_order_pg;
mod tg003_evidence_pg;
mod tg004_strict_503;
mod tg005_dispute_resync;
