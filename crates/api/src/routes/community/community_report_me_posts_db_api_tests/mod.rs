//! **F-018 / F-019 · API·IT（PostgreSQL + `Router::oneshot` + Bearer）**
//!
//! - **F-018**：**`POST /api/v1/community/reports`** 在目标帖存在时返回 **`status=ok`** 与 **`id`**。
//! - **F-019**：**`GET /api/v1/community/me/posts`** 在库内存在本人帖时返回 **`status=ok`** 且列表含该帖 **`id`**。
//! - **v1.4.241**：**`matrix_93_d_com_010_f018_post_report_persists_pg_row_app_stack_ok_pg`** / **`matrix_93_d_com_009_f019_get_me_posts_lists_own_post_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`community::router()`** **`app_with_pool`** **互补**）。
//! - **v1.4.272**：**`matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg`** — **`POST …/reports`** 后 **无身份头** **`GET …/posts/:id`** **公开读**（**`router::app`**）。
//!
//! **93 §4.1**：**`matrix_93_d_com_010_*`** ↔ **D-COM-010**/**F-018**；**`matrix_93_d_com_009_*`** ↔ **D-COM-009**/**F-019**；**v1.4.270**：**`matrix_93_d_com_009f_f019_*`** ↔ **D-COM-009**/**F-019**（**`GET …/community/me/posts`** **无身份头** **`router::app`** **401** **`auth_placeholder_layer`** **`unauthorized`**；**勿与** **`community_feed_like_collect_db_api_tests`** **`009b_*`** **`me/collects`** **前缀撞车**）（**`spec/93-全站功能验证矩阵-域别回归清单.md`** **v1.4.51** §4.1）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（须**已迁移**库）。

mod app_stack;
mod helpers;
mod router_smoke;
