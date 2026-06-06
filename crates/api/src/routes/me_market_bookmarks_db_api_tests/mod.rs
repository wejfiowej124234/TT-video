//! **F-020 · API·IT（PostgreSQL + `Router::oneshot` + Bearer）**
//!
//! - **`POST /api/v1/me/market-bookmarks`**（**`target_type=order`**）→ **`status=ok`**；
//! - **`GET /api/v1/me/market-bookmarks`** → **`order_ids`** 含已存在 **`orders.id`**。
//! - **93 §2.1 B-MKT-004**：`matrix_93_b_mkt_004_*` 与 `run_b_mkt_004_me_market_bookmark_flow` 同源（`spec/93-全站功能验证矩阵-域别回归清单.md`）。
//! - **v1.4.238**：**`matrix_93_b_mkt_004_f020_post_get_market_bookmarks_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`me::router()`** 子栈互补）。
//! - **v1.4.263**：**`matrix_93_b_mkt_003b_f020_get_market_bookmarks_empty_order_ids_ok_app_stack_ok_pg`** — **B-MKT-003** 子证 · **`GET …/me/market-bookmarks`** **无星标** **`order_ids`** **空数组** **`router::app`**。
//! - **v1.4.264**：**`matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg`** — **`POST`→`GET`→`DELETE …/order/:id`→`GET`** **`order_ids`** **不再含** **`orders.id`** **`router::app`**（**B-MKT-004** 扩链）。
//! - **v1.4.268**：**`matrix_93_b_mkt_004d_f020_post_guide_bookmark_then_get_guide_ids_app_stack_ok_pg`** — **`POST …/market-bookmarks`** **`target_type=guide`**→**`GET`** **`guide_ids`** **含** **`guides.id`**（**B-MKT-013**/**F-020**）。
//! - **v1.4.269**：**`matrix_93_b_mkt_004e_f020_post_guide_bookmark_delete_get_guide_ids_absent_app_stack_ok_pg`** — **`POST|GET|DELETE|GET …/me/market-bookmarks/guide/:id`** **`guide_ids`** **不含**（**B-MKT-013**/**F-020**）。
//! - **v1.4.273**：**`matrix_93_b_mkt_004f_f020_post_order_then_guide_bookmarks_get_lists_both_app_stack_ok_pg`** — **同一 Bearer** **`POST` order** **再** **`POST` guide`**→**`GET …/me/market-bookmarks`** **`order_ids`** **与** **`guide_ids`** **同时命中**（**B-MKT-004**/**B-MKT-013**/**F-020**）。
//! - **v1.4.274**：**`matrix_93_b_mkt_004g_f020_post_order_guide_bookmarks_delete_both_then_lists_absent_app_stack_ok_pg`** — **`DELETE …/order/:id`** **+** **`DELETE …/guide/:id`** **后** **`GET`** **`order_ids`/`guide_ids`** **均不含**（**B-MKT-004**/**B-MKT-013**/**F-020**）。
//! - **v1.4.275**：**`matrix_93_b_mkt_004h_f020_post_order_bookmark_invalid_target_type_then_get_preserves_order_app_stack_ok_pg`** — **`POST …/market-bookmarks`** **`target_type=listing`** **400** **`invalid_target_type`** **后** **`GET`** **`order_ids`** **仍含** **已星标** **`orders.id`**（**B-MKT-004**/**F-020**）。
//! - **v1.4.276**：**`matrix_93_b_mkt_004i_f020_post_order_guide_bookmarks_invalid_listing_then_get_preserves_both_app_stack_ok_pg`** — **order+guide 双星标** **后** **`listing`→400** **再** **`GET`** **`order_ids`/`guide_ids`** **均保持**（**B-MKT-004**/**B-MKT-013**/**F-020**）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（须**已迁移**库）。

mod flow_basic;
mod flow_dual;
mod flow_invalid;
mod helpers;
mod mkt003_empty;
