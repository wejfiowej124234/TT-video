//! **F-026 · API·IT（PostgreSQL + `Router::oneshot` + Bearer）** + **93 §2.4 · B-MSG-002（ISS-007 窄口径）**
//!
//! - **`POST /api/v1/orders/:id/messages`** → **`status=ok`** 且消息写入 **`order_messages`**；
//! - **`GET /api/v1/orders/:id/messages`** 返回列表含刚写入内容（**`ORDER-MESSAGES-LIST-DB-SSOT-001`** 路径）。
//! - **v1.4.238**：**`matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`messages::router()`** 子栈互补）。
//! - **v1.4.257**：**`matrix_93_b_msg_002b_f026_post_two_order_messages_then_get_lists_both_app_stack_ok_pg`** — **同线程** **两条** **`POST`** → **`GET`** **列表** **双命中**。
//! - **v1.4.282**：**`matrix_93_b_msg_002c_f026_tourist_posts_guide_reads_messages_app_stack_ok_pg`** — **旅客 `POST`→向导 `GET`** **同线程可读**（**`sessions` 双 Bearer**）。
//!
//! **93**：**`matrix_93_b_msg_002_*`** / **`matrix_93_b_msg_002b_*`** / **`matrix_93_b_msg_002c_f026_*`** ↔ **B-MSG-002**/**F-026**（**`002c`**：**参与方互读** **主栈**）；**v1.4.270**：**`matrix_93_b_msg_001b_f026_*`** ↔ **B-MSG-001**/**F-026**（**`GET`** **Bearer** **空 `items`**·**PG `order_messages`**）；**`matrix_93_b_msg_003b_f026_*`** ↔ **B-MSG-003**/**F-026**（**无身份头** **`router::app`** **401** **`auth_placeholder_layer`** **`unauthorized`**；**裸** **`messages::router()`** 仍 **`login_required`**）（**`spec/93-全站功能验证矩阵-域别回归清单.md`** §2.4）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（须**已迁移**库）。

mod get_auth_edge;
mod helpers;
mod post_get_flow;
