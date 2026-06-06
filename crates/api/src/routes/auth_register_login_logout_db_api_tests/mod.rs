//! **F-001～F-006 · API·IT（PostgreSQL）**：**F-001～003** 注册/登录/登出 **`sessions`** 与 **`GET /me`**；**F-004～006** 见 **`matrix_93_a_me_*` / `matrix_93_a_pwd_*`**（**93 §1**）。
//!
//! **93 §1（A 域）**：**`matrix_93_a_reg_001_*`** ↔ **A-REG-001**/**F-001**；**`matrix_93_a_reg_001b_*`** ↔ **A-REG-001**/**F-001**（**`router::app`**；**v1.4.249**）；**`matrix_93_a_reg_002_*`** ↔ **A-REG-002**/**F-001**；**`matrix_93_a_reg_002b_*`** ↔ **A-REG-002**/**F-001**（**`router::app`**；**v1.4.248**）；**`matrix_93_a_log_001_*`** ↔ **A-LOG-001**/**F-002**；**`matrix_93_a_log_001b_*`** ↔ **A-LOG-001**/**F-002**（**`router::app`**；**v1.4.250**）；**`matrix_93_a_log_002b_f002_*`** ↔ **A-LOG-002**/**F-002**（**连续** **`GET /api/v1/me`** **`router::app`**；**v1.4.262**）；**`matrix_93_a_log_003_*`** ↔ **A-LOG-003**/**F-003**；**`matrix_93_a_log_003b_*`** ↔ **A-LOG-003**/**F-003**（**`router::app`**；**v1.4.249**）；**`matrix_93_a_log_004_*`** ↔ **A-LOG-004**/**F-002**；**`matrix_93_a_log_004b_*`** ↔ **A-LOG-004**/**F-002**（**`router::app`** **主栈**；**v1.4.247**）；**`matrix_93_a_log_005_*`** ↔ **A-LOG-005**/**F-003**；**`matrix_93_a_log_005b_*`** ↔ **A-LOG-005**/**F-003**（**`router::app`**；**v1.4.248**）；**`matrix_93_a_me_001_*`** ↔ **A-ME-001**/**F-004**；**`matrix_93_a_me_001b_*`** ↔ **A-ME-001**/**F-004**（**`router::app`**；**v1.4.247**）；**`matrix_93_a_me_003b_f004_*`** ↔ **A-ME-003**/**F-004**（**`GET /api/v1/me/stats`** **`router::app`**；**v1.4.261**）；**`matrix_93_a_me_003c_f004_*`** ↔ **A-ME-003**/**F-004**（**`GET /api/v1/me/stats`** **无身份头** **`router::app`** **401** **`auth_placeholder_layer`** **`unauthorized`**；**v1.4.270**）；**`matrix_93_a_me_002_*`** ↔ **A-ME-002**/**F-005**（**AUTO-P0**）；**`matrix_93_a_me_002b_*`** ↔ **A-ME-002**/**F-005**（**`router::app`**；**v1.4.247**）；**`matrix_93_a_me_005b_f005_*`** ↔ **A-ME-002**/**F-005**（**`PUT …/me`** **`default_wallet_address`** **`router::app`**；**v1.4.262**）；**`matrix_93_a_pwd_001_*`** ↔ **A-PWD-001**/**F-006**；**`matrix_93_a_pwd_001b_*`** ↔ **A-PWD-001**/**F-006**（**`router::app`**；**v1.4.248**）；**`matrix_93_a_pwd_002_*`** ↔ **A-PWD-002**/**F-006**；**`matrix_93_a_pwd_002b_*`** ↔ **A-PWD-002**/**F-006**（**`router::app`**；**v1.4.249**；**95 · ISS-007** 窄口径：**`DATABASE_URL` + `oneshot`** 回填 **§8.2·93**，**不**升格 **全矩阵 `report.json`**）。判据见 **`spec/93-全站功能验证矩阵-域别回归清单.md`** §1 表。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`routes/community/tests_create_post_commerce_db.rs`** 同源）。已设置时由 **`it_db_pool::connect_migrated_pg_it_pool`** 连接并执行与 **`startup`** 相同的 **SQLx 迁移**（空库亦可）。

mod env_guards;
mod support;
mod tests_pack_00;
mod tests_pack_01;
mod tests_pack_02;
mod tests_pack_03;
mod tests_pack_04;
mod tests_pack_05;
mod tests_pack_06;
mod tests_pack_07;
mod tests_pack_08;
mod tests_pack_09;
mod tests_pack_10;
mod tests_pack_11;
mod tests_pack_12;
mod tests_pack_13;
mod tests_pack_14;
mod tests_pack_15;
mod tests_pack_16;
