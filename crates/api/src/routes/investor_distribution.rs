//! B-086：应计分红分录 — internal POST 生成、governance GET 只读

use axum::extract::{Query, State};
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;
use crate::u256_hex::fmt_word_hex;

fn snapshot_binding_json() -> serde_json::Value {
    json!({
        "anchor": db::B088_ANCHOR,
        "snapshot_block_binding": db::SNAPSHOT_BLOCK_BINDING,
        "transfer_replay_order": db::SNAPSHOT_TRANSFER_REPLAY_ORDER,
        "eligibility_projection": db::SNAPSHOT_ELIGIBILITY_PROJECTION
    })
}

fn normalize_token_addr(a: &str) -> Result<String, &'static str> {
    let s = a.trim().trim_start_matches("0x");
    if s.len() != 40 || !s.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("invalid_token_address");
    }
    Ok(format!("0x{}", s.to_ascii_lowercase()))
}

fn pg_unique_violation(e: &sqlx::Error) -> bool {
    match e {
        sqlx::Error::Database(db) => db.code().map(|c| c == "23505").unwrap_or(false),
        _ => false,
    }
}

#[derive(Debug, Deserialize)]
pub struct InvestorDistributionAccrualBody {
    pub chain_id: i64,
    pub token_address: String,
    pub snapshot_block_number: i64,
    pub idempotency_key: String,
}

/// POST /api/v1/internal/investor-distribution-accrual
pub async fn post_investor_distribution_accrual(
    State(state): State<ApiMetaState>,
    Json(body): Json<InvestorDistributionAccrualBody>,
) -> impl IntoResponse {
    let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key(
                "database_required_for_investor_distribution_accrual",
            )),
        )
            .into_response();
    };

    let key = body.idempotency_key.trim();
    if key.is_empty() || key.len() > 256 {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_idempotency_key")),
        )
            .into_response();
    }
    if body.snapshot_block_number < 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_snapshot_block_number")),
        )
            .into_response();
    }

    let token = match normalize_token_addr(&body.token_address) {
        Ok(t) => t,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_token_address")),
            )
                .into_response();
        }
    };

    let existing_id = match db::get_distribution_by_idempotency_key(pool, key).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "idempotency_lookup_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };
    if let Some(existing_id) = existing_id {
        return match fetch_distribution_envelope(pool, existing_id).await {
            Ok(env) => (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "anchor": "B-086-INVESTOR-DISTRIBUTION-ACCRUAL",
                    "idempotent": true,
                    "distribution": env
                })),
            )
                .into_response(),
            Err((sc, j)) => (sc, Json(j)).into_response(),
        };
    }

    let cash_hex = match db::sum_fee_router_amount_upto_block_hex(
        pool,
        body.chain_id,
        &token,
        body.snapshot_block_number,
    )
    .await
    {
        Ok(h) => h,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "fee_router_sum_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let transfers = match db::list_investor_share_transfers_up_to_block(
        pool,
        body.chain_id,
        &token,
        body.snapshot_block_number,
    )
    .await
    {
        Ok(t) => t,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "investor_transfer_list_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let (balances, supply_word) = match db::replay_balances_from_transfers(&transfers) {
        Ok(x) => x,
        Err(msg) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail("share_replay_failed", msg)),
            )
                .into_response();
        }
    };

    if balances.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("no_holders_at_snapshot")),
        )
            .into_response();
    }

    let supply_hex = fmt_word_hex(&supply_word);
    let holders: Vec<(String, String)> = balances
        .iter()
        .map(|(a, w)| (a.clone(), fmt_word_hex(w)))
        .collect();

    let (lines, distributed_sum_hex, remainder_hex) =
        match db::allocate_pro_rata_accruals(&cash_hex, &holders, &supply_hex) {
            Ok(x) => x,
            Err(msg) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail("pro_rata_allocate_failed", msg)),
                )
                    .into_response();
            }
        };

    match db::insert_distribution_with_lines(
        pool,
        key,
        body.chain_id,
        &token,
        body.snapshot_block_number,
        &cash_hex,
        &supply_hex,
        &distributed_sum_hex,
        &remainder_hex,
        &lines,
    )
    .await
    {
        Ok(id) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "anchor": "B-086-INVESTOR-DISTRIBUTION-ACCRUAL",
                "idempotent": false,
                "distribution_id": id.to_string(),
                "cash_basis": db::CASH_BASIS,
                "formula": db::FORMULA,
                "total_cash_u256_hex": cash_hex,
                "total_supply_u256_hex": supply_hex,
                "distributed_sum_u256_hex": distributed_sum_hex,
                "remainder_u256_hex": remainder_hex,
                "lines_written": lines.len(),
                "snapshot_binding": snapshot_binding_json()
            })),
        )
            .into_response(),
        Err(e) if pg_unique_violation(&e) => {
            if let Ok(Some(existing_id)) = db::get_distribution_by_idempotency_key(pool, key).await
            {
                return match fetch_distribution_envelope(pool, existing_id).await {
                    Ok(env) => (
                        StatusCode::OK,
                        Json(json!({
                            "status": "ok",
                            "anchor": "B-086-INVESTOR-DISTRIBUTION-ACCRUAL",
                            "idempotent": true,
                            "distribution": env
                        })),
                    )
                        .into_response(),
                    Err((sc, j)) => (sc, Json(j)).into_response(),
                };
            }
            (
                StatusCode::CONFLICT,
                Json(crate::api_json::err_key("idempotency_race_retry")),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                "insert_distribution_failed",
                e.to_string(),
            )),
        )
            .into_response(),
    }
}

async fn fetch_distribution_envelope(
    pool: &sqlx::postgres::PgPool,
    id: Uuid,
) -> Result<serde_json::Value, (StatusCode, serde_json::Value)> {
    let Some(h) = db::get_distribution_header(pool, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("distribution_header_failed", e.to_string()),
            )
        })?
    else {
        return Err((
            StatusCode::NOT_FOUND,
            crate::api_json::err_key("distribution_not_found"),
        ));
    };
    let lines = db::list_distribution_lines(pool, id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("distribution_lines_failed", e.to_string()),
            )
        })?;
    let line_json: Vec<_> = lines
        .into_iter()
        .map(|r| {
            json!({
                "holder_address": r.holder_address,
                "balance_snapshot_u256_hex": r.balance_snapshot_u256_hex,
                "accrual_u256_hex": r.accrual_u256_hex
            })
        })
        .collect();
    Ok(json!({
        "id": h.id.to_string(),
        "idempotency_key": h.idempotency_key,
        "chain_id": h.chain_id,
        "token_address": h.token_address,
        "snapshot_block_number": h.snapshot_block_number,
        "cash_basis": h.cash_basis,
        "formula": h.formula,
        "total_cash_u256_hex": h.total_cash_u256_hex,
        "total_supply_u256_hex": h.total_supply_u256_hex,
        "distributed_sum_u256_hex": h.distributed_sum_u256_hex,
        "remainder_u256_hex": h.remainder_u256_hex,
        "created_at": h.created_at.to_rfc3339(),
        "snapshot_binding": snapshot_binding_json(),
        "lines": line_json
    }))
}

#[derive(Debug, Deserialize, Default)]
pub struct InvestorDistributionAccrualsQuery {
    #[serde(default)]
    pub chain_id: Option<i64>,
    #[serde(default)]
    pub distribution_id: Option<Uuid>,
    #[serde(default)]
    pub limit: Option<i64>,
}

fn add_placeholder_header(res: &mut axum::response::Response<axum::body::Body>) {
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("placeholder"),
    );
}

/// GET /api/v1/governance/investor-distribution-accruals
pub async fn get_governance_investor_distribution_accruals(
    State(state): State<ApiMetaState>,
    Query(q): Query<InvestorDistributionAccrualsQuery>,
) -> impl IntoResponse {
    const ANCHOR: &str = "B-086-INVESTOR-DISTRIBUTION-ACCRUAL";
    let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        let mut res = Json(json!({
            "status": "ok",
            "anchor": ANCHOR,
            "data_source": "placeholder",
            "items": [],
            "note": "DATABASE_URL required"
        }))
        .into_response();
        add_placeholder_header(&mut res);
        return res;
    };

    if let Some(did) = q.distribution_id {
        return match fetch_distribution_envelope(pool, did).await {
            Ok(env) => Json(json!({
                "status": "ok",
                "anchor": ANCHOR,
                "data_source": "database",
                "items": [env]
            }))
            .into_response(),
            Err((sc, j)) => (sc, Json(j)).into_response(),
        };
    }

    let lim = q.limit.unwrap_or(20).clamp(1, 100);
    let rows = match db::list_recent_distributions(pool, q.chain_id, lim).await {
        Ok(r) => r,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "investor_distribution_list_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let items: Vec<_> = rows
        .into_iter()
        .map(|h| {
            json!({
                "id": h.id.to_string(),
                "idempotency_key": h.idempotency_key,
                "chain_id": h.chain_id,
                "token_address": h.token_address,
                "snapshot_block_number": h.snapshot_block_number,
                "cash_basis": h.cash_basis,
                "formula": h.formula,
                "total_cash_u256_hex": h.total_cash_u256_hex,
                "total_supply_u256_hex": h.total_supply_u256_hex,
                "distributed_sum_u256_hex": h.distributed_sum_u256_hex,
                "remainder_u256_hex": h.remainder_u256_hex,
                "created_at": h.created_at.to_rfc3339(),
                "snapshot_binding": snapshot_binding_json()
            })
        })
        .collect();

    Json(json!({
        "status": "ok",
        "anchor": ANCHOR,
        "data_source": "database",
        "items": items
    }))
    .into_response()
}

pub fn internal_router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/internal/investor-distribution-accrual",
        post(post_investor_distribution_accrual),
    )
}

pub fn governance_router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/governance/investor-distribution-accruals",
        get(get_governance_investor_distribution_accruals),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::test_support::api_meta_state;
    use axum::extract::State;
    use http_body_util::BodyExt;

    #[tokio::test]
    async fn governance_accruals_placeholder_without_db() {
        let res = get_governance_investor_distribution_accruals(
            State(api_meta_state(None)),
            Query(InvestorDistributionAccrualsQuery::default()),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["data_source"], "placeholder");
    }
}
