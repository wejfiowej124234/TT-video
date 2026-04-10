//! B-086 / **TT-B086-INVESTOR-DISTRIBUTION-ACCRUAL-ROUTE-001**：应计分红分录 — **`POST …/internal/investor-distribution-accrual`** 生成（**`idempotency_key`** 幂等）、**`GET …/governance/investor-distribution-accruals`** 只读（**`distribution_id`** 单条与 **`fetch_distribution_envelope`** 同源）
//! **B-088 / TT-B088-SNAPSHOT-BINDING-ROUTE-001**：**`snapshot_block_number`** 与 **`list_investor_share_transfers_up_to_block`**（含块冻结）+ **`replay_balances_from_transfers`** + **`allocate_pro_rata_accruals`** 同源；**`snapshot_binding_json`** 与 **`db::SNAPSHOT_*` / `B088_*`** SSOT。
//! **B-115-3**：**`POST …/internal/investor-distribution-register-accrual`** — 链下 **`registerAccrual`** 语义（**`distribution_bytes32` + token + holder + amount**），幂等键 **`(distribution_id, holder)`** 经 **`idempotency_keys`**；**不**发链、**不**改 Claim。

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
use crate::u256_hex::{add_assign_be, fmt_word_hex, zero_word};

fn snapshot_binding_json() -> serde_json::Value {
    json!({
        "anchor": db::B088_ANCHOR,
        "snapshot_block_binding": db::SNAPSHOT_BLOCK_BINDING,
        "transfer_replay_order": db::SNAPSHOT_TRANSFER_REPLAY_ORDER,
        "eligibility_projection": db::SNAPSHOT_ELIGIBILITY_PROJECTION,
        "stake_overlay_projection": db::B088_STAKE_PROJECTION_TABLE,
        "stake_overlay_event_source": db::B088_STAKE_EVENT_SOURCE,
        "b088_completion_anchor": db::B088_COMP_ANCHOR,
        "lock_overlay_projection": db::B088_LOCK_PROJECTION_TABLE,
        "lock_overlay_event_source": db::B088_LOCK_EVENT_SOURCE,
        "b088_lock_completion_anchor": db::B088_LOCK_COMP_ANCHOR
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

/// Internal path 片段（须与 **`db::key_hash(..., path, ...)`** 完全一致）
pub const REGISTER_ACCRUAL_INTERNAL_PATH: &str =
    "/api/v1/internal/investor-distribution-register-accrual";
/// **`idempotency_keys.key_scope`**：与 **FeeRouter / RegionVault** 投影无关的独立 scope
pub const REGISTER_ACCRUAL_IDEM_SCOPE: &str = "b115_register_accrual";

#[derive(Debug, Deserialize, serde::Serialize)]
pub struct RegisterAccrualBody {
    pub distribution_id: Uuid,
    pub holder_address: String,
}

/// POST /api/v1/internal/investor-distribution-register-accrual — B-115-3 链下登记（幂等）
pub async fn post_internal_investor_distribution_register_accrual(
    State(state): State<ApiMetaState>,
    Json(body): Json<RegisterAccrualBody>,
) -> impl IntoResponse {
    let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key(
                "database_required_for_investor_distribution_register_accrual",
            )),
        )
            .into_response();
    };

    let holder_n = match normalize_token_addr(&body.holder_address) {
        Ok(h) => h,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_holder_address")),
            )
                .into_response();
        }
    };

    let canonical_idem = format!("{}:{}", body.distribution_id, holder_n);
    let key_hash = db::key_hash(
        "POST",
        REGISTER_ACCRUAL_INTERNAL_PATH,
        &canonical_idem,
    );

    match db::get_cached_response(pool, &key_hash).await {
        Ok(Some((cached_status, cached_body))) => {
            return match serde_json::from_slice::<serde_json::Value>(&cached_body) {
                Ok(v) => (cached_status, Json(v)).into_response(),
                Err(_) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "investor_distribution_register_accrual_cache_corrupt",
                    )),
                )
                    .into_response(),
            };
        }
        Ok(None) => {}
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "register_accrual_idempotency_lookup_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    }

    let header = match db::get_distribution_header(pool, body.distribution_id).await {
        Ok(h) => h,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "register_accrual_distribution_header_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };
    let Some(header) = header else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("distribution_not_found")),
        )
            .into_response();
    };

    let line = match db::get_investor_distribution_accrual_line(
        pool,
        body.distribution_id,
        &holder_n,
    )
    .await
    {
        Ok(l) => l,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "register_accrual_line_lookup_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };
    let Some(line) = line else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("accrual_line_not_found_for_holder")),
        )
            .into_response();
    };

    let distribution_bytes32_hex =
        db::distribution_uuid_to_bytes32_hex_for_claim(body.distribution_id);
    let reg = json!({
        "distribution_id": body.distribution_id.to_string(),
        "distribution_bytes32_hex": distribution_bytes32_hex,
        "token_address": header.token_address,
        "holder_address": line.holder_address,
        "amount_u256_hex": line.accrual_u256_hex,
        "balance_snapshot_u256_hex": line.balance_snapshot_u256_hex,
    });

    let for_cache = json!({
        "status": "ok",
        "anchor": "B-115-3-INVESTOR-DISTRIBUTION-REGISTER-ACCRUAL",
        "idempotent": true,
        "registration": reg.clone()
    });
    let cache_bytes = match serde_json::to_vec(&for_cache) {
        Ok(b) => b,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "register_accrual_cache_serialize_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    if let Err(e) = db::save_cached_response(
        pool,
        &key_hash,
        REGISTER_ACCRUAL_IDEM_SCOPE,
        StatusCode::OK,
        &cache_bytes,
    )
    .await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                "register_accrual_idempotency_save_failed",
                e.to_string(),
            )),
        )
            .into_response();
    }

    let resp_first = json!({
        "status": "ok",
        "anchor": "B-115-3-INVESTOR-DISTRIBUTION-REGISTER-ACCRUAL",
        "idempotent": false,
        "registration": reg
    });
    (StatusCode::OK, Json(resp_first)).into_response()
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

    // B-086 / TT-B086-IDEMPOTENCY-KEY-001：先 **`get_distribution_by_idempotency_key`**；命中则直接 **`fetch_distribution_envelope`**（不重算、不重插）；与 **`UNIQUE(idempotency_key)`** + **`pg_unique_violation`** 竞态回落同源。
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

    let (mut balances, supply_word) = match db::replay_balances_from_transfers(&transfers) {
        Ok(x) => x,
        Err(msg) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail("share_replay_failed", msg)),
            )
                .into_response();
        }
    };

    let staking_opt = state
        .chain_config
        .as_ref()
        .and_then(|c| c.staking_address.as_ref())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    if let Some(ref staking) = staking_opt {
        let stake_rows = match db::list_investor_stake_state_events_up_to_block(
            pool,
            body.chain_id,
            staking,
            body.snapshot_block_number,
        )
        .await
        {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "investor_stake_event_list_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        };
        balances = match db::merge_transfer_balances_with_stake_overlay(
            balances,
            &stake_rows,
            staking,
        ) {
            Ok(b) => b,
            Err(msg) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "b088_stake_overlay_replay_failed",
                        msg,
                    )),
                )
                    .into_response();
            }
        };
        let mut merged_sum = zero_word();
        for w in balances.values() {
            if add_assign_be(&mut merged_sum, w).is_err() {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "b088_stake_overlay_supply_sum_overflow",
                        "holder_sum_u256_overflow",
                    )),
                )
                    .into_response();
            }
        }
        if merged_sum != supply_word {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "b088_stake_overlay_supply_mismatch",
                    format!(
                        "transfer_replay_supply={} overlay_holder_sum={}",
                        fmt_word_hex(&supply_word),
                        fmt_word_hex(&merged_sum)
                    ),
                )),
            )
                .into_response();
        }
    }

    let lock_addrs: Vec<String> = state
        .chain_config
        .as_ref()
        .map(|c| {
            c.investor_lock_contract_addresses
                .iter()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    for lock_raw in &lock_addrs {
        let lock_n = match normalize_token_addr(lock_raw) {
            Ok(t) => t,
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "invalid_lock_contract_address_in_config",
                    )),
                )
                    .into_response();
            }
        };
        let lock_rows = match db::list_investor_lock_state_events_up_to_block(
            pool,
            body.chain_id,
            &lock_n,
            body.snapshot_block_number,
        )
        .await
        {
            Ok(r) => r,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "investor_lock_event_list_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        };
        balances = match db::merge_transfer_balances_with_lock_overlay(
            balances,
            &lock_rows,
            &lock_n,
        ) {
            Ok(b) => b,
            Err(msg) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "b088_lock_overlay_replay_failed",
                        msg,
                    )),
                )
                    .into_response();
            }
        };
        let mut merged_sum = zero_word();
        for w in balances.values() {
            if add_assign_be(&mut merged_sum, w).is_err() {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "b088_lock_overlay_supply_sum_overflow",
                        "holder_sum_u256_overflow",
                    )),
                )
                    .into_response();
            }
        }
        if merged_sum != supply_word {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "b088_lock_overlay_supply_mismatch",
                    format!(
                        "transfer_replay_supply={} overlay_holder_sum={} lock_contract={}",
                        fmt_word_hex(&supply_word),
                        fmt_word_hex(&merged_sum),
                        lock_n
                    ),
                )),
            )
                .into_response();
        }
    }

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

    // B-086 / TT-B086-GET-ACCRUALS-BY-ID-001：与 **`POST …/internal/investor-distribution-accrual`** 成功体 **`distribution`**（幂等返回）同源 **`fetch_distribution_envelope`**。
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
    Router::new()
        .route(
            "/api/v1/internal/investor-distribution-accrual",
            post(post_investor_distribution_accrual),
        )
        .route(
            REGISTER_ACCRUAL_INTERNAL_PATH,
            post(post_internal_investor_distribution_register_accrual),
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
    use axum::Json;
    use http_body_util::BodyExt;

    /// **TT-B086-SNAPSHOT-BINDING-SSOT-001**：**`snapshot_binding_json`** 与 **`db::SNAPSHOT_*` / `B088_*`** 同源，供 GET/POST 响应与 **`pro_rata_share_balance_at_snapshot`** 对读。
    #[test]
    fn b086_snapshot_binding_matches_db_constants() {
        let v = snapshot_binding_json();
        assert_eq!(v["snapshot_block_binding"], json!(db::SNAPSHOT_BLOCK_BINDING));
        assert_eq!(
            v["transfer_replay_order"],
            json!(db::SNAPSHOT_TRANSFER_REPLAY_ORDER)
        );
        assert_eq!(
            v["eligibility_projection"],
            json!(db::SNAPSHOT_ELIGIBILITY_PROJECTION)
        );
        assert_eq!(v["anchor"], json!(db::B088_ANCHOR));
    }

    /// **TT-B088-SNAPSHOT-BINDING-FULL-SSOT-001**：**`snapshot_binding`** 全键与 **`db`** 钉死常量一致（含 **Stake / Lock** 叠加投影，与 POST **`snapshot_binding`** 字段一一对应）。
    #[test]
    fn b088_snapshot_binding_json_matches_all_db_ssot() {
        let v = snapshot_binding_json();
        assert_eq!(v["anchor"], json!(db::B088_ANCHOR));
        assert_eq!(v["snapshot_block_binding"], json!(db::SNAPSHOT_BLOCK_BINDING));
        assert_eq!(
            v["transfer_replay_order"],
            json!(db::SNAPSHOT_TRANSFER_REPLAY_ORDER)
        );
        assert_eq!(
            v["eligibility_projection"],
            json!(db::SNAPSHOT_ELIGIBILITY_PROJECTION)
        );
        assert_eq!(
            v["stake_overlay_projection"],
            json!(db::B088_STAKE_PROJECTION_TABLE)
        );
        assert_eq!(
            v["stake_overlay_event_source"],
            json!(db::B088_STAKE_EVENT_SOURCE)
        );
        assert_eq!(v["b088_completion_anchor"], json!(db::B088_COMP_ANCHOR));
        assert_eq!(
            v["lock_overlay_projection"],
            json!(db::B088_LOCK_PROJECTION_TABLE)
        );
        assert_eq!(
            v["lock_overlay_event_source"],
            json!(db::B088_LOCK_EVENT_SOURCE)
        );
        assert_eq!(
            v["b088_lock_completion_anchor"],
            json!(db::B088_LOCK_COMP_ANCHOR)
        );
        assert_eq!(db::FORMULA, "pro_rata_share_balance_at_snapshot");
    }

    /// **TT-B088-SNAPSHOT-BLOCK-NUMBER-PIPELINE-001**：手工行集 **=** **`list_investor_share_transfers_up_to_block(..., snapshot_block_number=10)`** 可能返回的结果（**已排除** 块 **11** 转让、序同 **`ORDER BY block_number ASC, log_index ASC`**）→ 与宽截止 **`pro_rata`** 行一致；**`snapshot_binding`** SSOT 仍与 **`db`** 对齐。
    #[test]
    fn b088_synthetic_transfers_up_to_snapshot_match_pro_rata_and_binding() {
        let z = "0x0000000000000000000000000000000000000000";
        let a = "0x000000000000000000000000000000000000000a";
        let b = "0x000000000000000000000000000000000000000b";
        let token = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        let mint = db::InvestorShareTransferRow {
            token_address: token.to_string(),
            from_address: z.to_string(),
            to_address: a.to_string(),
            value_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000064"
                    .to_string(),
        };
        let xfer = db::InvestorShareTransferRow {
            token_address: token.to_string(),
            from_address: a.to_string(),
            to_address: b.to_string(),
            value_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000028"
                    .to_string(),
        };
        let snapshot_block_number: i64 = 10;
        let up_to_snapshot: Vec<db::InvestorShareTransferRow> = vec![mint.clone()];
        let up_to_later = vec![mint, xfer];

        let (bal_10, sum_10) = db::replay_balances_from_transfers(&up_to_snapshot).unwrap();
        let (bal_11, sum_11) = db::replay_balances_from_transfers(&up_to_later).unwrap();
        let cash = "0x00000000000000000000000000000000000000000000000000000000000003e8";
        let h10: Vec<_> = bal_10
            .iter()
            .map(|(addr, w)| (addr.clone(), fmt_word_hex(w)))
            .collect();
        let h11: Vec<_> = bal_11
            .iter()
            .map(|(addr, w)| (addr.clone(), fmt_word_hex(w)))
            .collect();
        let (lines10, _, _) = db::allocate_pro_rata_accruals(cash, &h10, &fmt_word_hex(&sum_10))
            .unwrap();
        let (lines11, _, _) = db::allocate_pro_rata_accruals(cash, &h11, &fmt_word_hex(&sum_11))
            .unwrap();

        assert_eq!(snapshot_block_number, 10);
        assert_eq!(lines10.len(), 1);
        assert_eq!(lines10[0].2, cash);
        assert_eq!(lines11.len(), 2);
        assert_eq!(
            lines11[0].2,
            "0x0000000000000000000000000000000000000000000000000000000000000258"
        );
        assert_eq!(
            lines11[1].2,
            "0x0000000000000000000000000000000000000000000000000000000000000190"
        );

        let binding = snapshot_binding_json();
        assert_eq!(binding["snapshot_block_binding"], json!(db::SNAPSHOT_BLOCK_BINDING));
        assert_eq!(
            binding["transfer_replay_order"],
            json!(db::SNAPSHOT_TRANSFER_REPLAY_ORDER)
        );
        assert_eq!(binding["anchor"], json!(db::B088_ANCHOR));
    }

    /// 无 **`db_pool`** 时 handler 先 **`503`**；有池后 **`idempotency_key`** 空/超长 → **`400 invalid_idempotency_key`**（**TT-B086-POST-ACCRUAL-GATE-001**）。
    #[tokio::test]
    async fn b086_post_investor_distribution_accrual_requires_database_first() {
        let res = post_investor_distribution_accrual(
            State(api_meta_state(None)),
            Json(InvestorDistributionAccrualBody {
                chain_id: 1,
                token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
                snapshot_block_number: 1,
                idempotency_key: "any-key".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(
            v["error"].as_str(),
            Some("database_required_for_investor_distribution_accrual")
        );
    }

    /// **TT-B086-GET-INVESTOR-DISTRIBUTION-ACCRUALS-PATH-001**
    #[tokio::test]
    async fn b086_get_governance_investor_distribution_accruals_http_route_placeholder() {
        use axum::body::Body;
        use axum::http::{Request, StatusCode};
        use tower::util::ServiceExt;

        let app = governance_router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/governance/investor-distribution-accruals")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(
            v["anchor"].as_str(),
            Some("B-086-INVESTOR-DISTRIBUTION-ACCRUAL")
        );
    }

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

    /// B-115-3：无 **`db_pool`** → **`503`**。
    #[tokio::test]
    async fn b1153_register_accrual_requires_database() {
        let res = post_internal_investor_distribution_register_accrual(
            State(api_meta_state(None)),
            Json(RegisterAccrualBody {
                distribution_id: Uuid::nil(),
                holder_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    /// B-115-3：登记成功 + **`(distribution_id, holder)`** 幂等（**`idempotency_keys`**）；读回 **`registration`** 与 DB 行一致。
    #[tokio::test]
    async fn b1153_register_accrual_success_and_idempotent_with_pg() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "b1153_register_accrual_success_and_idempotent_with_pg: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        use axum::body::Body;
        use axum::http::{Request, StatusCode};
        use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
        use std::sync::Arc;
        use tokio::sync::RwLock;
        use tower::util::ServiceExt;

        const CHAIN: i64 = 999_991_553;
        const IDEM: &str = "b1153-test-register-accrual-dist-key";
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");

        let _ = sqlx::query("DELETE FROM idempotency_keys WHERE key_scope = $1")
            .bind(REGISTER_ACCRUAL_IDEM_SCOPE)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM investor_distribution_accruals WHERE idempotency_key = $1")
            .bind(IDEM)
            .execute(&pool)
            .await;

        let holder = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
        let amt = "0x0000000000000000000000000000000000000000000000000000000000000001";
        let lines = vec![(holder.clone(), amt.to_string(), amt.to_string())];

        let dist_id = db::insert_distribution_with_lines(
            &pool,
            IDEM,
            CHAIN,
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            42,
            "0x00000000000000000000000000000000000000000000000000000000000003e8",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            amt,
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            &lines,
        )
        .await
        .expect("insert_distribution_with_lines");

        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool.clone()),
        };
        let app = internal_router().with_state(api_meta_state(Some(co)));

        let req_body = RegisterAccrualBody {
            distribution_id: dist_id,
            holder_address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA".to_string(),
        };
        let payload = serde_json::to_vec(&req_body).unwrap();

        let res1 = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(REGISTER_ACCRUAL_INTERNAL_PATH)
                    .header("content-type", "application/json")
                    .body(Body::from(payload.clone()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res1.status(), StatusCode::OK);
        let b1 = res1.into_body().collect().await.unwrap().to_bytes();
        let v1: serde_json::Value = serde_json::from_slice(&b1).unwrap();
        assert_eq!(v1["idempotent"], false);
        let exp_b32 = db::distribution_uuid_to_bytes32_hex_for_claim(dist_id);
        assert_eq!(v1["registration"]["distribution_bytes32_hex"], json!(exp_b32));
        assert_eq!(
            v1["registration"]["holder_address"].as_str(),
            Some(holder.as_str())
        );
        assert_eq!(v1["registration"]["amount_u256_hex"], amt);
        assert_eq!(
            v1["registration"]["token_address"].as_str(),
            Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
        );

        let res2 = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(REGISTER_ACCRUAL_INTERNAL_PATH)
                    .header("content-type", "application/json")
                    .body(Body::from(payload))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res2.status(), StatusCode::OK);
        let b2 = res2.into_body().collect().await.unwrap().to_bytes();
        let v2: serde_json::Value = serde_json::from_slice(&b2).unwrap();
        assert_eq!(v2["idempotent"], true);
        assert_eq!(v2["registration"], v1["registration"]);

        sqlx::query("DELETE FROM idempotency_keys WHERE key_scope = $1")
            .bind(REGISTER_ACCRUAL_IDEM_SCOPE)
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query("DELETE FROM investor_distribution_accruals WHERE id = $1")
            .bind(dist_id)
            .execute(&pool)
            .await
            .unwrap();
    }

    /// **B-115-5**：**`register-accrual`** 幂等 **scope / path** 与 **FeeRouter·RegionVault** 投影及 **`fee-pool-aggregates`** **URI** 正交（防混名）。
    #[test]
    fn b1155_register_accrual_route_orthogonal_to_fee_pool_aggregates() {
        assert!(
            !REGISTER_ACCRUAL_IDEM_SCOPE.contains("fee_router"),
            "idem scope must not alias fee_router"
        );
        assert!(
            !REGISTER_ACCRUAL_IDEM_SCOPE.contains("region_vault"),
            "idem scope must not alias region_vault"
        );
        assert_ne!(
            REGISTER_ACCRUAL_INTERNAL_PATH,
            "/api/v1/governance/fee-pool-aggregates"
        );
    }

    /// **B-115-5**：**重复登记**第二次 **HTTP 200** + **`idempotent: true`**（缓存命中，非链上 Claim；链上 **重复 Claim** 见 **`RegionDistributionClaim`** Foundry 测）。
    #[tokio::test]
    async fn b1155_register_accrual_repeat_is_idempotent_success_not_error() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "b1155_register_accrual_repeat_is_idempotent_success_not_error: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        use axum::body::Body;
        use axum::http::{Request, StatusCode};
        use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
        use std::sync::Arc;
        use tokio::sync::RwLock;
        use tower::util::ServiceExt;

        const CHAIN: i64 = 999_991_629;
        const IDEM: &str = "b1155-test-register-repeat";
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");

        let _ = sqlx::query("DELETE FROM idempotency_keys WHERE key_scope = $1")
            .bind(REGISTER_ACCRUAL_IDEM_SCOPE)
            .execute(&pool)
            .await;
        let _ = sqlx::query("DELETE FROM investor_distribution_accruals WHERE idempotency_key = $1")
            .bind(IDEM)
            .execute(&pool)
            .await;

        let holder = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string();
        let amt = "0x0000000000000000000000000000000000000000000000000000000000000002";
        let lines = vec![(holder.clone(), amt.to_string(), amt.to_string())];
        let dist_id = db::insert_distribution_with_lines(
            &pool,
            IDEM,
            CHAIN,
            "0xcccccccccccccccccccccccccccccccccccccccc",
            99,
            "0x00000000000000000000000000000000000000000000000000000000000003e8",
            "0x0000000000000000000000000000000000000000000000000000000000000002",
            amt,
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            &lines,
        )
        .await
        .expect("insert_distribution_with_lines");

        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool.clone()),
        };
        let app = internal_router().with_state(api_meta_state(Some(co)));
        let req_body = RegisterAccrualBody {
            distribution_id: dist_id,
            holder_address: holder.clone(),
        };
        let payload = serde_json::to_vec(&req_body).unwrap();

        let res1 = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(REGISTER_ACCRUAL_INTERNAL_PATH)
                    .header("content-type", "application/json")
                    .body(Body::from(payload.clone()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res1.status(), StatusCode::OK);
        let res2 = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(REGISTER_ACCRUAL_INTERNAL_PATH)
                    .header("content-type", "application/json")
                    .body(Body::from(payload))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(
            res2.status(),
            StatusCode::OK,
            "B-115-5: duplicate register must not 4xx/5xx when cache hit"
        );
        let b2 = res2.into_body().collect().await.unwrap().to_bytes();
        let v2: serde_json::Value = serde_json::from_slice(&b2).unwrap();
        assert_eq!(v2["idempotent"], true);

        sqlx::query("DELETE FROM idempotency_keys WHERE key_scope = $1")
            .bind(REGISTER_ACCRUAL_IDEM_SCOPE)
            .execute(&pool)
            .await
            .unwrap();
        sqlx::query("DELETE FROM investor_distribution_accruals WHERE id = $1")
            .bind(dist_id)
            .execute(&pool)
            .await
            .unwrap();
    }
}
