//! **F-008 / F-009 / F-011 · API·IT（PostgreSQL + `Router::oneshot`）**：注册 → 向导建档 → **stake 置 `active`** → **`POST /api/v1/orders`**（`orders`+`itineraries` 同事务）→ **`GET /api/v1/orders`** / **`GET /api/v1/orders/:id`** → **`PATCH …/itinerary`**（**未 Escrowed**）→ **`POST …/set-escrow-address`**。
//!
//! **93 §2（B 域）**：**`matrix_93_b_ord_001_*`** ↔ **B-ORD-001**/**F-008**；**`matrix_93_b_ord_001b_*`** ↔ **B-ORD-001**/**F-008**（**`router::app`**；**v1.4.250**）；**`matrix_93_b_ord_001c_*`** ↔ **B-ORD-001**/**F-008**（**`GET …/orders/:id`** **`created`**；**`router::app`**；**v1.4.252**）；**`matrix_93_b_ord_004b_f008_*`** ↔ **B-ORD-004**/**F-008**（**`PATCH …/itinerary`→`GET …/orders/:id`** **`daily_itinerary` 读回**；**`router::app`**；**v1.4.285**）；**`matrix_93_b_trn_001_*`** ↔ **B-TRN-001**/**F-008**；**`matrix_93_b_trn_001b_*`** ↔ **B-TRN-001**/**F-008**（**`router::app`**；**v1.4.251**）；**`matrix_93_b_ord_002_*`** ↔ **B-ORD-002**/**F-009**；**`matrix_93_b_ord_002b_*`** ↔ **B-ORD-002**/**F-009**（**`router::app`**；**v1.4.251**）；**`matrix_93_b_trn_002_f009_*`** ↔ **B-TRN-002**/**F-009**（**AUTO-P0**）；**`matrix_93_b_trn_002b_f009_*`** ↔ **B-TRN-002**/**F-009**（**`router::app`**；**v1.4.252**）；**`matrix_93_b_ord_003_*`** ↔ **B-ORD-003**/**F-009**；**`matrix_93_b_ord_003b_*`** ↔ **B-ORD-003**/**F-009**（**`router::app`**；**v1.4.251**）；**`matrix_93_b_mkt_001b_f009_*`** ↔ **B-MKT-001**/**F-009**（**`GET /api/v1/discover/orders`** **`router::app`** + **`POST /itineraries`** **draft** 入列；**v1.4.261**）；**`matrix_93_b_mkt_001c_f009_*`** ↔ **B-MKT-001**/**F-009**（**`GET …/discover/orders?country=&city=`** **`router::app`**；**v1.4.265**）；**`matrix_93_b_mkt_001d_f009_*`** ↔ **B-MKT-001**/**B-MKT-002**/**F-009**（**`GET …/discover/orders?country=&city=&limit=`** **`page.limit`**；**v1.4.267**）；**`matrix_93_b_mkt_001e_f009_*`** ↔ **B-MKT-002**/**F-009**（**`GET …/discover/orders?limit=`** **无** **country/city** **`page.limit`**；**v1.4.269**）；**`matrix_93_b_mkt_002b_f009_*`** ↔ **B-MKT-002**/**F-009**（**`GET …/discover/orders?city=&limit=`** **`router::app`**；**v1.4.262**）；**`matrix_93_b_mkt_002c_f009_*`** ↔ **B-MKT-002**/**F-009**（**`cursor` 第二页** **`router::app`**；**v1.4.263**）；**`matrix_93_b_mkt_003b_f009_*`** ↔ **B-MKT-003**/**F-009**（**`GET …/discover/orders` 空列表** **`200`** **`router::app`**；**v1.4.263**）；**`matrix_93_b_ord_006_*`** ↔ **B-ORD-006**/**F-011**（**MANUAL-P1**；**`merge(auth|guides|me|orders)`**）；**`matrix_93_b_ord_006b_*`** ↔ **B-ORD-006**/**F-011**（**`router::app`**；**v1.4.252**；**95 · ISS-007** 回填 **§8.2·93**，见 **`spec/93-全站功能验证矩阵-域别回归清单.md`** §2.3）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`auth_register_login_logout_db_api_tests`** 同源）；须指向**已迁移**库。

mod cleanup;
mod ctx;
mod itinerary_draft;
mod support;

mod tests_escrow_f011;
mod tests_happy_path;
mod tests_mkt_cursor_empty;
mod tests_mkt_discover_a;
mod tests_mkt_discover_b;
mod tests_mkt_discover_c;
mod tests_ord_trn_stack_a;
mod tests_ord_trn_stack_b1;
mod tests_ord_trn_stack_b2;
mod tests_ord_trn_stack_c;
