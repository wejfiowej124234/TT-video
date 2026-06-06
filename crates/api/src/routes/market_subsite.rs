//! 自由市场子站（94）：**`GET …/market/{provider|acquisition}/listings`** 目录契约。
//! **有 PostgreSQL 池**（`chain_off.db_pool`）时：**`GET …/listings`** 返回 **`status: ok`** 与 **`market_listings`** 行（**`meta.source`****=`postgres_catalog`**，可为空数组）；**`SELECT` 失败** → **503** **`market_listings_catalog_db_read_failed`**（**不**再返回 200 `degraded` 空目录，避免将基础设施故障误认为「无商品」）。**`GET …/listings/:id`** 读已发布行；**`POST …/listings`** 须登录，写入 **`market_listings`**（**`meta.source`****=`postgres_catalog`**）；**`payload`** 须为 JSON **object** 且含与 variant 对齐的 **`kind`**（`merchant_showcase_studio_v1` \| `acquisition_carry_studio_v1`）与非空 **`title`**，否则 **400** **`invalid_market_listing_payload`**。
//! **无 `chain_off`**：**`GET …/listings`** / **`GET …/listings/:id`** → **503** **`chain_off_unavailable`**（与 **`not_impl`** 子路径一致，**不**冒充空目录）。**有 `chain_off` 无 PG 池**：→ **503** **`database_required`**（**不**再 **200 `degraded`+空 `items`**，避免将未配置库误认为「无商品」）。**`POST …/listings`** 与草稿路径同 **503**。
//! **`POST …/listings/drafts`** / **`GET …/drafts/:id`**：仍走 **`market_listing_drafts`**（创作台草稿，非公开目录 SSOT）。**`POST …/drafts`** 须登录并写入 **`owner_user_id`**（与 **`POST …/listings`** 一致），并走 **`ensure_durable_writes_available`**；**`payload`** 若提供则须为 JSON **object**（允许 `{}`），否则 **400** **`invalid_market_listing_payload`**。**`GET …/drafts/:id`** 须登录且**仅**返回 **`owner_user_id`** 与当前会话一致之行（他人 UUID **404** **`listing_draft_not_found`**，防枚举）。
//! **外链**：**`payload`** 内 **`url` / `*_url` / `src` / `href` / `thumbnail` / `media_urls`…** 下的 **`http(s)`** 字符串走与社区发帖相同的 **`TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES`** + **`TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS`** 护栏（**400** **`invalid_market_listing_payload`**，`reason` 与社区同源，如 **`media_url_invalid_scheme`**）。

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use chrono::Utc;
use serde_json::json;
use serde_json::Value;
use uuid::Uuid;

use crate::db;
use crate::routes::acquisition_publish_gate::acquisition_body_agrees_escrow_copy;
use crate::routes::market_merchant_gate::ensure_market_merchant_write_allowed;
use crate::routes::community::common as community_common;
use crate::state::{extract_user_with_session_check, require_session_user, ApiMetaState};

use super::not_impl_json;

use crate::routes::market_subsite_list_query::{filter_and_sort_market_listings, MarketListingsListQuery};

const MARKET_LISTINGS_PAGE_CAP: i64 = 200;

fn invalid_market_listing_payload_response(reason: &'static str) -> axum::response::Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({
            "status": "error",
            "error": "invalid_market_listing_payload",
            "message": "invalid_market_listing_payload",
            "reason": reason,
        })),
    )
        .into_response()
}

/// 草稿 **`payload`**：须为 JSON **object**（允许 `{}`）；**`payload`** 为数组/字符串等 → **400**。
fn market_listing_draft_payload_from_body(body: &Value) -> Result<Value, axum::response::Response> {
    let payload = body.get("payload").cloned().unwrap_or_else(|| json!({}));
    if !payload.is_object() {
        return Err(invalid_market_listing_payload_response(
            "draft_payload_must_be_object",
        ));
    }
    Ok(payload)
}

/// 已发布目录：与前端 **`marketStudioDraft`**（`merchant_showcase_studio_v1` / `acquisition_carry_studio_v1`）对齐的最小契约。
fn validate_market_catalog_publish_payload(
    payload: &Value,
    variant: &'static str,
) -> Result<(), &'static str> {
    let obj = payload.as_object().ok_or("payload_must_be_object")?;
    let kind = obj
        .get("kind")
        .and_then(|v| v.as_str())
        .ok_or("kind_required")?;
    match variant {
        "provider" => {
            if kind != "merchant_showcase_studio_v1" {
                return Err("kind_mismatch_provider");
            }
        }
        "acquisition" => {
            if kind != "acquisition_carry_studio_v1" {
                return Err("kind_mismatch_acquisition");
            }
        }
        _ => return Err("invalid_variant"),
    }
    let title_ok = obj
        .get("title")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .is_some();
    if !title_ok {
        return Err("title_required");
    }
    Ok(())
}

fn market_listings_chain_off_unavailable() -> axum::response::Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "error",
            "error": "chain_off_unavailable",
            "message": "chain_off_unavailable",
            "reason": "chain_off is not mounted; market listings catalog unavailable",
        })),
    )
        .into_response()
}

fn market_listings_database_required(variant: &'static str) -> axum::response::Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "error",
            "error": "database_required",
            "message": "database_required",
            "reason": "DATABASE_URL is not configured; market listings catalog unavailable",
            "meta": { "variant": variant, "source": "unavailable" },
        })),
    )
        .into_response()
}

async fn listings_for_variant(
    state: &ApiMetaState,
    variant: &'static str,
    query: &MarketListingsListQuery,
) -> axum::response::Response {
    let Some(co) = state.chain_off.as_ref() else {
        return market_listings_chain_off_unavailable();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        return market_listings_database_required(variant);
    };
    match db::list_market_listings_by_variant(
        pool,
        variant,
        MARKET_LISTINGS_PAGE_CAP,
        false,
    )
    .await {
        Ok(rows) => {
            let rows = filter_and_sort_market_listings(rows, variant, query);
            let store = co.store.read().await;
            let filter_on = crate::chain_off::public_catalog_surface_filter_enabled();
            let items: Vec<Value> = rows
                .iter()
                .filter(|r| {
                    if !filter_on {
                        return true;
                    }
                    let email = store
                        .users
                        .get(&r.owner_user_id)
                        .map(|u| u.email.as_str())
                        .unwrap_or("");
                    !crate::chain_off::is_non_production_market_listing(
                        &r.data_origin,
                        email,
                        &r.payload,
                    )
                })
                .map(|r| {
                    json!({
                        "id": r.id.to_string(),
                        "payload": r.payload,
                        "updated_at": r.updated_at.to_rfc3339(),
                    })
                })
                .collect();
            let count = items.len();
            let has_more = (count as i64) >= MARKET_LISTINGS_PAGE_CAP;
            Json(json!({
                "status": "ok",
                "items": items,
                "meta": {
                    "variant": variant,
                    "source": "postgres_catalog",
                    "count": count,
                    "limit": MARKET_LISTINGS_PAGE_CAP,
                    "has_more": has_more,
                    "next_cursor": null
                }
            }))
            .into_response()
        }
        Err(e) => {
            eprintln!("WARN: market_listings_list_failed variant={variant}: {e}");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "market_listings_catalog_db_read_failed",
                    "message": "market_listings_catalog_db_read_failed",
                    "meta": { "variant": variant, "source": "postgres_catalog" }
                })),
            )
                .into_response()
        }
    }
}

async fn provider_listings(
    State(state): State<ApiMetaState>,
    Query(query): Query<MarketListingsListQuery>,
) -> impl IntoResponse {
    listings_for_variant(&state, "provider", &query).await
}

async fn acquisition_listings(
    State(state): State<ApiMetaState>,
    Query(query): Query<MarketListingsListQuery>,
) -> impl IntoResponse {
    listings_for_variant(&state, "acquisition", &query).await
}

async fn listing_detail_for_variant(
    state: &ApiMetaState,
    id: &str,
    variant: &'static str,
) -> axum::response::Response {
    let Some(co) = state.chain_off.as_ref() else {
        return market_listings_chain_off_unavailable();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        return market_listings_database_required(variant);
    };
    let Ok(listing_uuid) = Uuid::parse_str(id.trim()) else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({
                "status": "error",
                "error": "not_found",
                "message": "listing_not_found",
                "id": id
            })),
        )
            .into_response();
    };
    match db::select_market_listing_by_id(pool, listing_uuid, variant).await {
        Ok(Some(row)) => {
            if crate::chain_off::public_catalog_surface_filter_enabled() {
                let store = co.store.read().await;
                let email = store
                    .users
                    .get(&row.owner_user_id)
                    .map(|u| u.email.as_str())
                    .unwrap_or("");
                if crate::chain_off::is_non_production_market_listing(
                    &row.data_origin,
                    email,
                    &row.payload,
                ) {
                    return (
                        StatusCode::NOT_FOUND,
                        Json(json!({
                            "status": "error",
                            "error": "not_found",
                            "message": "listing_not_found",
                            "id": id
                        })),
                    )
                        .into_response();
                }
            }
            (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "listing": {
                        "id": row.id.to_string(),
                        "payload": row.payload,
                        "updated_at": row.updated_at.to_rfc3339(),
                        "owner_user_id": row.owner_user_id.to_string(),
                    },
                    "meta": { "variant": variant, "source": "postgres_catalog" }
                })),
            )
                .into_response()
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({
                "status": "error",
                "error": "not_found",
                "message": "listing_not_found",
                "id": id
            })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("WARN: market_listing_detail_select_failed: {e}");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "market_listing_catalog_db_read_failed",
                    "message": "market_listing_catalog_db_read_failed",
                })),
            )
                .into_response()
        }
    }
}

async fn provider_listing_detail(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    listing_detail_for_variant(&state, &id, "provider").await
}

async fn acquisition_listing_detail(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    listing_detail_for_variant(&state, &id, "acquisition").await
}

fn market_listing_draft_requires_db() -> impl IntoResponse {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "error",
            "error": "database_required",
            "message": "database_required",
            "reason": "DATABASE_URL is not configured; market listing drafts cannot be registered",
        })),
    )
}

fn market_listing_draft_db_persist_failed(reason: &str) -> impl IntoResponse {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "error",
            "error": "market_listing_draft_db_persist_failed",
            "message": "market_listing_draft_db_persist_failed",
            "reason": reason,
        })),
    )
}

fn market_listing_catalog_db_persist_failed(reason: &str) -> impl IntoResponse {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "error",
            "error": "market_listing_catalog_db_persist_failed",
            "message": "market_listing_catalog_db_persist_failed",
            "reason": reason,
        })),
    )
}

async fn get_market_listing_draft_for_variant(
    state: &ApiMetaState,
    headers: &HeaderMap,
    draft_id: &str,
    variant: &'static str,
    _not_impl_path: &'static str,
) -> axum::response::Response {
    let Ok(uid) = Uuid::parse_str(draft_id.trim()) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
        )
            .into_response();
    };
    let Some(co) = state.chain_off.as_ref() else {
        return market_listings_chain_off_unavailable();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        return market_listing_draft_requires_db().into_response();
    };
    let owner_uid =
        match require_session_user(extract_user_with_session_check(state, headers).await) {
            Ok(u) => u,
            Err(e) => return e.into_response(),
        };
    match db::select_market_listing_draft_by_id_for_owner(pool, uid, variant, owner_uid).await {
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({
                "status": "error",
                "error": "listing_draft_not_found",
                "message": "listing_draft_not_found",
                "draft_id": draft_id.trim(),
            })),
        )
            .into_response(),
        Ok(Some(row)) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "draft_id": row.id.to_string(),
                "saved_at": row.saved_at.to_rfc3339(),
                "payload": row.payload,
                "meta": { "variant": variant, "source": "postgres_draft" }
            })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("WARN: market_listing_draft_select_failed: {e}");
            market_listing_draft_db_persist_failed("market_listing_draft_select_failed")
                .into_response()
        }
    }
}

async fn get_provider_listing_draft(
    State(state): State<ApiMetaState>,
    Path(draft_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    get_market_listing_draft_for_variant(
        &state,
        &headers,
        &draft_id,
        "provider",
        "GET /api/v1/market/provider/listings/drafts/:draft_id",
    )
    .await
}

async fn get_acquisition_listing_draft(
    State(state): State<ApiMetaState>,
    Path(draft_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    get_market_listing_draft_for_variant(
        &state,
        &headers,
        &draft_id,
        "acquisition",
        "GET /api/v1/market/acquisition/listings/drafts/:draft_id",
    )
    .await
}

async fn post_provider_listing_draft(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    let owner_uid =
        match require_session_user(extract_user_with_session_check(&state, &headers).await) {
            Ok(u) => u,
            Err(e) => return e.into_response(),
        };
    let Some(co) = state.chain_off.as_ref() else {
        return not_impl_json("POST /api/v1/market/provider/listings/drafts").into_response();
    };
    if let Err((code, j)) = crate::chain_off::ensure_durable_writes_available(co) {
        return (code, j).into_response();
    }
    let Some(pool) = co.db_pool.as_ref() else {
        return market_listing_draft_requires_db().into_response();
    };
    let draft_id = Uuid::new_v4();
    let saved_at = Utc::now();
    let payload = match market_listing_draft_payload_from_body(&body) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    if let Err(reason) =
        community_common::validate_market_listing_payload_embedded_http_urls(&payload)
    {
        return invalid_market_listing_payload_response(reason);
    }
    match db::insert_market_listing_draft(pool, draft_id, "provider", owner_uid, &payload, saved_at)
        .await
    {
        Ok(1) => {}
        Ok(n) => {
            eprintln!("WARN: market_provider_listing_draft_insert_unexpected_rows_affected: {n}");
            return market_listing_draft_db_persist_failed(
                "market_provider_listing_draft_insert_unexpected_rows",
            )
            .into_response();
        }
        Err(e) => {
            eprintln!("WARN: market_provider_listing_draft_insert_failed: {e}");
            return market_listing_draft_db_persist_failed(
                "market_provider_listing_draft_insert_failed",
            )
            .into_response();
        }
    }
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "draft_id": draft_id.to_string(),
            "saved_at": saved_at.to_rfc3339(),
            "meta": { "variant": "provider", "source": "postgres_draft" }
        })),
    )
        .into_response()
}

async fn post_acquisition_listing_draft(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    let owner_uid =
        match require_session_user(extract_user_with_session_check(&state, &headers).await) {
            Ok(u) => u,
            Err(e) => return e.into_response(),
        };
    let Some(co) = state.chain_off.as_ref() else {
        return not_impl_json("POST /api/v1/market/acquisition/listings/drafts").into_response();
    };
    if let Err((code, j)) = crate::chain_off::ensure_durable_writes_available(co) {
        return (code, j).into_response();
    }
    let Some(pool) = co.db_pool.as_ref() else {
        return market_listing_draft_requires_db().into_response();
    };
    let draft_id = Uuid::new_v4();
    let saved_at = Utc::now();
    let payload = match market_listing_draft_payload_from_body(&body) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    if let Err(reason) =
        community_common::validate_market_listing_payload_embedded_http_urls(&payload)
    {
        return invalid_market_listing_payload_response(reason);
    }
    match db::insert_market_listing_draft(
        pool,
        draft_id,
        "acquisition",
        owner_uid,
        &payload,
        saved_at,
    )
    .await
    {
        Ok(1) => {}
        Ok(n) => {
            eprintln!(
                "WARN: market_acquisition_listing_draft_insert_unexpected_rows_affected: {n}"
            );
            return market_listing_draft_db_persist_failed(
                "market_acquisition_listing_draft_insert_unexpected_rows",
            )
            .into_response();
        }
        Err(e) => {
            eprintln!("WARN: market_acquisition_listing_draft_insert_failed: {e}");
            return market_listing_draft_db_persist_failed(
                "market_acquisition_listing_draft_insert_failed",
            )
            .into_response();
        }
    }
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "draft_id": draft_id.to_string(),
            "saved_at": saved_at.to_rfc3339(),
            "meta": { "variant": "acquisition", "source": "postgres_draft" }
        })),
    )
        .into_response()
}

fn onboarding_entitlement_required_response(role_target: &'static str) -> axum::response::Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({
            "status": "error",
            "error": "onboarding_entitlement_required",
            "message": "onboarding_entitlement_required",
            "detail": "No paid entitlement for required role.",
            "role_target": role_target,
        })),
    )
        .into_response()
}

fn onboarding_entitlement_lookup_failed_response() -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({
            "status": "error",
            "error": "onboarding_entitlement_lookup_failed",
            "message": "onboarding_entitlement_lookup_failed",
        })),
    )
        .into_response()
}

async fn user_has_paid_onboarding_entitlement(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    role_target: &str,
) -> Result<bool, sqlx::Error> {
    let n: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM onboarding_entitlements
           WHERE user_id = $1 AND role_target = $2 AND status = 'paid'"#,
    )
    .bind(user_id)
    .bind(role_target)
    .fetch_one(pool)
    .await?;
    Ok(n > 0)
}

async fn ensure_market_write_onboarding_entitlement(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    variant: &'static str,
) -> Result<(), axum::response::Response> {
    let role_target: &'static str = match variant {
        "provider" => "provider",
        "acquisition" => "region_steward",
        _ => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "invalid_variant",
                    "message": "invalid_variant",
                })),
            )
                .into_response());
        }
    };
    match user_has_paid_onboarding_entitlement(pool, user_id, role_target).await {
        Ok(true) => Ok(()),
        Ok(false) => Err(onboarding_entitlement_required_response(role_target)),
        Err(e) => {
            eprintln!("WARN: market onboarding entitlement lookup: {e}");
            Err(onboarding_entitlement_lookup_failed_response())
        }
    }
}

async fn post_listing_publish_for_variant(
    state: &ApiMetaState,
    headers: &HeaderMap,
    body: Value,
    variant: &'static str,
    not_impl_path: &'static str,
) -> axum::response::Response {
    let uid = match require_session_user(extract_user_with_session_check(state, headers).await) {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let Some(co) = state.chain_off.as_ref() else {
        return not_impl_json(not_impl_path).into_response();
    };
    if let Err((code, j)) = crate::chain_off::ensure_durable_writes_available(co) {
        return (code, j).into_response();
    }
    let Some(pool) = co.db_pool.as_ref() else {
        return market_listing_draft_requires_db().into_response();
    };
    if variant == "acquisition" && !acquisition_body_agrees_escrow_copy(&body) {
        return crate::routes::acquisition_publish_gate::acquisition_escrow_ack_required_response();
    }
    if let Err(resp) = ensure_market_merchant_write_allowed(state, pool, uid, variant).await {
        return resp;
    }
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let payload = body.get("payload").cloned().unwrap_or_else(|| json!({}));
    if let Err(reason) = validate_market_catalog_publish_payload(&payload, variant) {
        return invalid_market_listing_payload_response(reason);
    }
    if let Err(reason) =
        community_common::validate_market_listing_payload_embedded_http_urls(&payload)
    {
        return invalid_market_listing_payload_response(reason);
    }
    let data_origin = {
        let store = co.store.read().await;
        let email = store
            .users
            .get(&uid)
            .map(|u| u.email.as_str())
            .unwrap_or("");
        crate::chain_off::infer_market_listing_data_origin(email, &payload)
    };
    match db::insert_market_listing(
        pool,
        listing_id,
        variant,
        uid,
        &payload,
        now,
        &data_origin,
    )
    .await {
        Ok(1) => {}
        Ok(n) => {
            eprintln!("WARN: market_listing_catalog_insert_unexpected_rows_affected: {n}");
            return market_listing_catalog_db_persist_failed(
                "market_listing_catalog_insert_unexpected_rows",
            )
            .into_response();
        }
        Err(e) => {
            eprintln!("WARN: market_listing_catalog_insert_failed: {e}");
            return market_listing_catalog_db_persist_failed(
                "market_listing_catalog_insert_failed",
            )
            .into_response();
        }
    }
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "listing_id": listing_id.to_string(),
            "updated_at": now.to_rfc3339(),
            "meta": { "variant": variant, "source": "postgres_catalog" }
        })),
    )
        .into_response()
}

async fn post_provider_listing(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    post_listing_publish_for_variant(
        &state,
        &headers,
        body,
        "provider",
        "POST /api/v1/market/provider/listings",
    )
    .await
}

async fn post_acquisition_listing(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    post_listing_publish_for_variant(
        &state,
        &headers,
        body,
        "acquisition",
        "POST /api/v1/market/acquisition/listings",
    )
    .await
}

async fn post_market_listing_order(
    state: &ApiMetaState,
    headers: &HeaderMap,
    listing_id: String,
    variant: &'static str,
) -> axum::response::Response {
    let uid = match require_session_user(extract_user_with_session_check(state, headers).await) {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let listing_uuid = match Uuid::parse_str(listing_id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "invalid_listing_id",
                    "message": "invalid_listing_id",
                })),
            )
                .into_response()
        }
    };
    let Some(co) = state.chain_off.clone() else {
        return not_impl_json(&format!(
            "POST /api/v1/market/{variant}/listings/:id/orders"
        ))
        .into_response();
    };
    match crate::chain_off::market_listing_order_create_impl(co, uid, variant, listing_uuid).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

async fn post_provider_listing_order(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(listing_id): Path<String>,
) -> impl IntoResponse {
    post_market_listing_order(&state, &headers, listing_id, "provider").await
}

async fn post_acquisition_listing_order(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(listing_id): Path<String>,
) -> impl IntoResponse {
    post_market_listing_order(&state, &headers, listing_id, "acquisition").await
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/market/provider/listings/drafts/:draft_id",
            get(get_provider_listing_draft),
        )
        .route(
            "/api/v1/market/provider/listings/drafts",
            post(post_provider_listing_draft),
        )
        .route(
            "/api/v1/market/provider/listings",
            get(provider_listings).post(post_provider_listing),
        )
        .route(
            "/api/v1/market/provider/listings/:id",
            get(provider_listing_detail),
        )
        .route(
            "/api/v1/market/provider/listings/:id/orders",
            post(post_provider_listing_order),
        )
        .route(
            "/api/v1/market/acquisition/listings/drafts/:draft_id",
            get(get_acquisition_listing_draft),
        )
        .route(
            "/api/v1/market/acquisition/listings/drafts",
            post(post_acquisition_listing_draft),
        )
        .route(
            "/api/v1/market/acquisition/listings",
            get(acquisition_listings).post(post_acquisition_listing),
        )
        .route(
            "/api/v1/market/acquisition/listings/:id",
            get(acquisition_listing_detail),
        )
        .route(
            "/api/v1/market/acquisition/listings/:id/orders",
            post(post_acquisition_listing_order),
        )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::test_support::api_meta_state;
    use axum::body::Body;
    use axum::http::Request;
    use http_body_util::BodyExt;
    use serde_json::{json, Value};
    use tower::ServiceExt;

    #[tokio::test]
    async fn market_provider_listings_without_chain_off_is_503_chain_off_unavailable() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/market/provider/listings")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "chain_off_unavailable");
    }

    #[tokio::test]
    async fn market_provider_detail_without_chain_off_is_503_chain_off_unavailable() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/market/provider/listings/unknown-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "chain_off_unavailable");
    }

    #[tokio::test]
    async fn market_provider_draft_post_requires_login() {
        let app = router().with_state(api_meta_state(None));
        let body = json!({"payload": {"title": "t1"}});
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/market/provider/listings/drafts")
                    .header("content-type", "application/json")
                    .body(Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        let status = res.status();
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(status, StatusCode::UNAUTHORIZED);
        assert_eq!(v["error"], "login_required");
    }

    #[tokio::test]
    async fn market_provider_listing_post_requires_auth() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/market/provider/listings")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"payload":{"kind":"merchant_showcase_studio_v1"}}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn market_acquisition_draft_post_requires_login() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/market/acquisition/listings/drafts")
                    .header("content-type", "application/json")
                    .body(Body::from("{}"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn market_provider_draft_get_invalid_uuid_is_400() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/market/provider/listings/drafts/not-a-uuid")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn market_provider_draft_get_without_chain_off_is_503_chain_off_unavailable() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/market/provider/listings/drafts/00000000-0000-4000-8000-000000000001")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "chain_off_unavailable");
    }

    #[tokio::test]
    async fn market_acquisition_draft_get_without_chain_off_is_503() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/market/acquisition/listings/drafts/00000000-0000-4000-8000-000000000002")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn market_acquisition_listings_without_chain_off_is_503_chain_off_unavailable() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/market/acquisition/listings")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "chain_off_unavailable");
    }

    #[tokio::test]
    async fn market_acquisition_detail_without_chain_off_is_503_chain_off_unavailable() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/market/acquisition/listings/any-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "chain_off_unavailable");
    }
}
