//! **F-010 / F-012 / F-013 · API·IT（PostgreSQL + `Router::oneshot`）**
//!
//! - **F-010**：向导接单后，在 **`P3_CHAIN_OFF=1`** 且未启用生产 mock 闸下，**`POST /api/v1/orders/:id/mock-pay`** → **`escrowed`**。
//! - **F-012**：**`POST /api/v1/itineraries`** → **`draft`** 订单 + **`itineraries`** PG 同事务语义（HTTP 层）。
//! - **F-013**：**`POST /api/v1/orders/:id/confirm-final-plan`**（**`expected_version: 1`**）→ **`snapshot_hash`**；**`accepted`** 下 **`POST …/confirm-bilateral`**（**旅客+向导**）→ **`sub_status=confirmed`**（**`matrix_93_b_ord_005c_f013_*`**）。
//!
//! **93**：**`matrix_93_b_esc_001_*`** ↔ **B-ESC-001**/**F-010**（**§2.5 · AUTO-P0**）；**`matrix_93_b_esc_001b_f010_*`** ↔ **B-ESC-001**/**F-010**（**`router::app`**；**v1.4.253**）；**`matrix_93_b_esc_002b_f010_*`** ↔ **B-ESC-002**/**F-010**（**`POST …/confirm-completion`**→**`completed`**；**`router::app`**；**v1.4.283**）；**`matrix_93_b_esc_005d_f010_*`** ↔ **B-ESC-003**/**F-010**（**双 `POST …/confirm-rating`**→**`sub_status=rating_confirmed`**；**`router::app`**；**v1.4.284**）；**`matrix_93_b_esc_004b_f029_*`** ↔ **B-ESC-004**/**F-029**（**`GET …/chain-sync-status`** **`chain_sync.last_event.state`**；**`router::app`**；**v1.4.283**）；**`matrix_93_b_esc_005b_f027_*`** ↔ **B-ESC-003**/**F-027**（**双 `POST …/reviews`** **`GET …/reviews`** **`items.len()==2`**；**`router::app`**；**v1.4.284**）；**`matrix_93_b_ord_005c_f013_*`** ↔ **B-ORD-005**/**F-013**（**`POST …/confirm-bilateral`** **`sub_status=confirmed`**；**`router::app`**；**v1.4.284**）；**`matrix_93_b_trn_003b_f025_*`** ↔ **B-TRN-003**/**F-025**（**`POST …/dispute`→`GET …/orders/:id`** **`disputed`**；**`router::app`**；**v1.4.283**）；**`matrix_93_b_dsp_001_*`** ↔ **B-DSP-001**/**F-025**（**§2.6 · AUTO-P0**；**`POST …/orders/:id/dispute`** → **`GET /api/v1/disputes`**）；**`matrix_93_b_dsp_001b_f025_*`** ↔ **B-DSP-001**/**F-025**（**`router::app`**；**v1.4.254**）；**`matrix_93_b_dsp_003b_f025_*`** ↔ **B-DSP-003**/**F-025**（**§2.6 · MANUAL-P1**；**`P3_SEED_ARBITRATOR_EMAIL`** **命中注册** **`arbitrator`** →**`POST …/disputes/:id/resolve`**→**`disputes.status=resolved` PG**；**`router::app`**；**v1.4.281**）；**`matrix_93_d_itn_001_*`** ↔ **D-ITN-001**/**F-012**（**§4 · MANUAL-P1**，**ISS-007** 单列回填）；**`matrix_93_d_itn_001b_f012_*`** ↔ **D-ITN-001**/**F-012**（**`router::app`**；**v1.4.253**）；**`matrix_93_d_itn_001c_f012_*`** ↔ **D-ITN-001**/**F-012**（**`POST …/itineraries`→`GET …/orders/:id`** **`itinerary.destination`** **主栈**；**`router::app`**；**v1.4.282**）；**`matrix_93_d_itn_001d_f012_*`** ↔ **D-ITN-001**/**F-012**（**`POST …/itineraries`** **draft** → **`PATCH …/orders/:id/itinerary`** → **`GET …/orders/:id`** **`daily_itinerary` 读回**；**`router::app`**；**v1.4.285**）；**`matrix_93_b_ord_005_*`** ↔ **B-ORD-005**/**F-013**（**§2.3 · MANUAL-P1**，**ISS-007** 单列回填）；**`matrix_93_b_ord_005b_f013_*`** ↔ **B-ORD-005**/**F-013**（**`router::app`**；**v1.4.253**）。判据见 **`spec/93-全站功能验证矩阵-域别回归清单.md`**。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`orders_create_list_set_escrow_address_db_api_tests`** 同源）；须指向**已迁移**库。

mod cleanup;
mod flows_esc;
mod flows_itn_ord;
mod support;

mod tests_esc_dsp;
mod tests_itn_esc_stack_a;
mod tests_itn_ord_tail;
mod tests_reviews_rating;
mod tests_trn_sync_itn;
