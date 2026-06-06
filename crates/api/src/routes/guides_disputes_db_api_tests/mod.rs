//! **F-023 / F-024 / F-025 · API·IT（PostgreSQL + `Router::oneshot`）** + **93 §2 / §2.2 / §2.6（ISS-007 窄口径）**
//!
//! - **F-023**：**`POST|GET /api/v1/guides`**、**`GET /api/v1/guides/:id`**、**`GET …/availability`**（**`GET /api/v1/guides` 列表**在 **`chain_off` 实现**中**仅** **`status=active`**，须 **`POST …/stake`** 后方入列表 — 见 **`matrix_93_b_gde_003_*`**）；
//! - **F-024**：**`POST /api/v1/guides/:id/stake`** 且 **`guides`** 表 **`stake_amount`/`status`** 与 HTTP 一致；
//! - **F-025**：**`GET /api/v1/disputes`** / **`GET /api/v1/disputes/:id`**（**`list_disputes_public_page`** / **`get_dispute_public_detail`**）；**`POST /api/v1/orders/:id/dispute`→列表** 见 **`orders_accept_mock_pay_itinerary_confirm_db_api_tests`** **`matrix_93_b_dsp_001_*`**（**B-DSP-001**）；**`POST …/disputes/:id/resolve`** **主栈** 见 **同文件** **`matrix_93_b_dsp_003b_f025_*`**（**B-DSP-003**；**v1.4.281**）。
//!
//! **93 矩阵绑定**：**`matrix_93_b_gde_001_*`** ↔ **B-GDE-001**/**F-023**；**`matrix_93_b_gde_002b_f023_*`** ↔ **B-GDE-002**/**F-023**（**`GET …/guides/:id/availability`** **`Authorization: Bearer`** **`router::app`**；**v1.4.261**）；**`matrix_93_b_gde_004_*`** ↔ **B-GDE-001 扩面**/**F-023**（**`router::app`** **`GET /api/v1/guides?city=`** 在 **`stake` 后**含 **`active`** 向导 — 与 **`matrix_93_b_gde_003_*`** 子栈断言同源、**merge 序**主栈收口）；**`matrix_93_b_gde_004b_f023_*`** ↔ **B-GDE-001**/**F-023**（**`router::app`** **`GET …/guides?city=`** **`stake` 前** **不含** **`pending`** 向导 — **v1.4.265**）；**`matrix_93_b_gde_004c_f023_*`** ↔ **B-GDE-001**/**F-023**（**`GET …/guides?city=&languages=`** / **`service_types=`** **筛选** **`router::app`**；**v1.4.268**）；**`matrix_93_b_gde_004e_f023_*`** ↔ **B-GDE-001**/**F-023**（**`GET …/guides?city=&language=`** **单参** **`router::app`**；**v1.4.269**）；**`matrix_93_b_gde_003_*`** ↔ **B-GDE-003**/**F-024**（**MANUAL-P1**；**95 · ISS-007** 允许 **`oneshot`+PG** 回填 **§8.2·93**，**不**类推其它 **MANUAL**）；**`matrix_93_b_gde_003b_f024_*`** ↔ **B-GDE-003**/**F-024**（**`router::app`**；**v1.4.254**）；**`matrix_93_b_gde_003c_f024_*`** ↔ **B-GDE-003**/**F-024**（**`POST …/stake`** **同额二次** **`200`** **`router::app`**；**v1.4.265**）；**`matrix_93_b_gde_003d_f024_*`** ↔ **B-GDE-001**/**B-GDE-003**/**F-024**（**`POST …/stake`** 后 **`GET …/guides?city=`** **公开列表** **`items[]`** **`stake_amount`/`status`** **与质押一致**；**v1.4.268**）；**`matrix_93_b_dsp_002_*`** ↔ **B-DSP-002**/**F-025**；**`matrix_93_b_dsp_002b_f025_*`** ↔ **B-DSP-002**/**F-025**（**`router::app`**；**v1.4.254**）；**`matrix_93_b_dsp_003b_f025_*`** ↔ **B-DSP-003**/**F-025**（**`orders_accept_mock_pay_itinerary_confirm_db_api_tests`**·**`router::app`**；**v1.4.281**）。
//! **v1.4.238**：**`matrix_93_b_gde_001_f023_post_guide_get_detail_app_stack_ok_pg`** — **`router::app`** 主栈 **`POST …/guides`→`GET …/guides/:id`**（与 **`guides::router()`** 子栈互补）。
//! **v1.4.280**：**`matrix_93_b_gde_001c_f023_post_guide_get_detail_bio_matches_app_stack_ok_pg`** — **`POST …/guides`→`GET …/guides/:id`** **`guide.bio`** **与** **`POST` body** **一致**（**B-GDE-001** **扩链**；与 **`001_f023_*`** **`city`** **断言** **互补**）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（须**已迁移**库）。

mod dsp002;
mod gde001;
mod gde002;
mod gde003_ab_f024;
mod gde003_cd_f024;
mod gde004_ab_f023;
mod gde004_ce_f023;
mod helpers;
