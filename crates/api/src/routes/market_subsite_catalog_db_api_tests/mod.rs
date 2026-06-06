//! **F-021 / F-022 · API·IT（PostgreSQL + `Router::oneshot`）**
//!
//! - **F-021**：**`GET /api/v1/market/provider/listings`** 在 **`market_listings`** 存在 **`variant=provider`** **`published`** 行时返回 **`status=ok`** 且 **`items`** 含该行 **`id`**（**93 §2.1 B-MKT-005**；`matrix_93_b_mkt_005_*`）；**`POST …/market/provider/listings`** **Bearer** 发布后 **`GET`** 目录含该 **`listing_id`**（**B-MKT-007**；**`matrix_93_b_mkt_007_*`**）。
//! - **F-022**：**`GET /api/v1/market/acquisition/listings`** 同理 **`variant=acquisition`**（**93 §2.1 B-MKT-006**；`matrix_93_b_mkt_006_*`）；**`POST …/market/acquisition/listings`**（**B-MKT-008**；**`matrix_93_b_mkt_008_*`**）。
//! - **v1.4.239**：**`matrix_93_b_mkt_005_f021_get_provider_listings_app_stack_ok_pg`** / **`matrix_93_b_mkt_006_f022_get_acquisition_listings_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`market_subsite::router()`** 子栈互补）。
//! - **v1.4.264**：**`matrix_93_b_mkt_009_f021_get_provider_listing_detail_app_stack_ok_pg`** / **`matrix_93_b_mkt_010_f022_get_acquisition_listing_detail_app_stack_ok_pg`** — **`GET …/listings/:id`** **`listing.id`** **`router::app`**（**B-MKT-009 / B-MKT-010**）。
//! - **v1.4.267**：**`matrix_93_b_mkt_007b_f021_post_provider_draft_then_get_app_stack_ok_pg`** / **`matrix_93_b_mkt_008b_f022_post_acquisition_draft_then_get_app_stack_ok_pg`** — **`POST|GET …/listings/drafts*`** **`payload` PG 读回**（**B-MKT-011 / B-MKT-012**）。
//! - **`market_listing_draft_payload_from_body`**：**`POST …/listings/drafts`** 根体**无 **`payload`** 键**（例 **`{}`**）→ **`GET …/drafts/:id`** **`payload`** **读回 **`{}`**（**`matrix_93_b_mkt_007d_f021_post_provider_draft_empty_body_then_get_payload_empty_object_pg`**）。
//! - **v1.4.280**：**`matrix_93_b_mkt_007c_f021_post_provider_listing_then_get_detail_payload_title_app_stack_ok_pg`** / **`matrix_93_b_mkt_008c_f022_post_acquisition_listing_then_get_detail_payload_title_app_stack_ok_pg`** — **`POST` 已发布 listing** → **`GET …/listings/:id`** **`listing.payload.title`** **与** **`POST` 入参** **一致**（**B-MKT-007+009 / B-MKT-008+010** **链式主栈**；与 **单测种子** **`009`/`010`** **互补**）。
//! - **96-18 强闸**：**`POST …/listings`** 与 **`POST …/listings/drafts`** 须 **`onboarding_entitlements`** **`paid`**（**provider** / **region_steward**）；**`matrix_93_b_mkt_007e_*`** 无资格 → **400** **`onboarding_entitlement_required`**。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（须**已迁移**库）。**TT-MOD**：目录化子模块（**48 v1.91**）；**`routes/mod.rs`** 仍为 **`mod market_subsite_catalog_db_api_tests;`**。

mod helpers;
mod catalog_listings;
mod catalog_public_surface;
mod mkt_drafts;
mod mkt_provider_publish;
// PD-009 / acquisition IT
mod acquisition_detail_get;
mod acquisition_pd009_full_flow;
mod acquisition_pd009_l5_closure;
mod acquisition_pd009_gates;
mod acquisition_pd009_trust_parity;
mod listing_orders;
