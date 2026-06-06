//! **F-029 / F-030 · API·IT（PostgreSQL + `Router::oneshot` / handler 直连）** + **93 §4.5.1 / §4.5（ISS-007 窄口径）** + **93 §1 · A-ENV-001**
//!
//! - **F-029**：**`GET /api/v1/internal/indexer-status`**（**`internal::router()`**；与 **110** 探针体字段同源子集）+ **`matrix_93_d_idx_001_f029_internal_indexer_status_ok_and_sqlx_migrations_applied_pg`**（**`_sqlx_migrations`** **COUNT** **>0** **PG 锚**）+ **`matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg`**（**`router::app`**；**v1.4.255**）+ **`POST /api/v1/internal/indexer-reconcile`**（**`indexer_reconcile`**；**`persist:false`**；**`chain_config` + `indexer_state` + `db_pool`**；**110 §3.1.4** 干路径旁证）+ **`matrix_93_d_idx_001e_f029_post_internal_indexer_reconcile_persist_false_app_stack_ok_pg`**（**`router::app`** **全栈**；**v1.4.258**）+ **`matrix_93_d_idx_001f_f029_post_internal_indexer_reconcile_persist_true_app_stack_ok_pg`**（**`persist:true`**·**`reconciliation_reports` 写路径**·**`router::app`**；**v1.4.266**）+ **`matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg`**（**`GET /health`** **`200`** **`ok`** + **`GET /meta`** **`200`** **`build`/`api_version`/`database`**；**`router::app`**；**v1.4.285**）。
//! - **F-030**：**`GET /api/v1/admin/schema/migrations`** + **`Authorization: Bearer bearer_{admin_id}`** + **`chain_off.db_pool`** → **`status=ok`** 与 **`items.*`** PG 读回 + **`matrix_93_d_adm_003_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_pg`**（**`_sqlx_migrations`** **`COUNT(*)>0`** **与** **Admin migrations** **HTTP 200** **同事务锚**）+ **`matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg`**（**`router::app`**；**v1.4.255**）+ **`matrix_93_d_adm_003c_f030_get_admin_migrations_returns_non_empty_migration_histories_app_stack_ok_pg`**（**v1.4.257**；**`migration_histories` 非空** **且** **`len`≤`_sqlx_migrations`**；**v1.4.259**：测内 **`INSERT`/`DELETE`** **`migration_id` LIKE `matrix_93_it_mh_seed_%`** **自包含**，**不**依赖 DB 预填 **`migration_histories`**）+ **`matrix_93_d_adm_004d_f030_get_admin_cross_check_ok_app_stack_ok_pg`**（**`GET …/admin/cross-check`**·**`router::app`**；**v1.4.258**）。
//!
//! **93**：**`matrix_93_d_idx_001_*`** / **`matrix_93_d_idx_001b_f029_*`** / **`matrix_93_d_idx_001e_f029_*`** / **`matrix_93_d_idx_001f_f029_*`** / **`matrix_93_a_env_001b_f029_*`** ↔ **D-IDX-001**/**D-IDX-002**/**D-IDX-003**/**A-ENV-001**/**F-029**；**`matrix_93_d_adm_003_*`** / **`matrix_93_d_adm_003b_f030_*`** / **`matrix_93_d_adm_003c_f030_*`** / **`matrix_93_d_adm_004d_f030_*`** ↔ **D-ADM-003**/**F-030**（**`spec/93-全站功能验证矩阵-域别回归清单.md`**）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（须**已迁移**库）。**TT-MOD**：目录化子模块（**48 v1.91**）；**`routes/mod.rs`** 仍为 **`mod internal_indexer_admin_db_api_tests;`**。

mod f029_reorg_rewind;
mod f029_status_reconcile;
mod internal_secret_gate_app_stack_pg;
mod f030_cross_check_env;
mod f030_migrations;
mod helpers;
