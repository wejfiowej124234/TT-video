//! **`GET /api/v1/internal/public-catalog-surface/stats`** — 企业级 **`data_origin`** 分桶（Admin/运维 · ①）。

use axum::extract::State;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::chain_off::public_catalog_surface_filter_enabled;
use crate::db;
use crate::state::ApiMetaState;

/// 读 **`market_listings` / `orders` / `guides`** 的 **`data_origin`** 计数；须 **PG**。
pub async fn get_public_catalog_surface_stats(
    State(state): State<ApiMetaState>,
) -> impl IntoResponse {
    let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        return Json(json!({
            "status": "error",
            "error": "database_required",
            "message": "database_required",
        }))
        .into_response();
    };
    match db::public_catalog_surface_stats(pool).await {
        Ok(counts) => Json(json!({
            "status": "ok",
            "filter_enabled": public_catalog_surface_filter_enabled(),
            "data_origin_counts": counts,
            "note": "production rows appear in public catalog when TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1; test/demo remain in DB for IT and Admin",
        }))
        .into_response(),
        Err(e) => {
            eprintln!("WARN: public_catalog_surface_stats_failed: {e}");
            Json(json!({
                "status": "error",
                "error": "public_catalog_surface_stats_failed",
                "message": "public_catalog_surface_stats_failed",
            }))
            .into_response()
        }
    }
}
