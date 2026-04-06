//! GET `/api/v1/governance/investor-share-reconcile`（B-085）：`Transfer` 投影重放 Σ balance 与 `totalSupply()` 对拍

use axum::extract::{Query, State};
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use std::collections::BTreeMap;

use crate::chain;
use crate::db;
use crate::state::ApiMetaState;
use crate::u256_hex::{fmt_word_hex, parse_u256_word_hex};

#[derive(Debug, Deserialize, Default)]
pub struct InvestorShareReconcileQuery {
    #[serde(default)]
    pub chain_id: Option<u64>,
    #[serde(default)]
    pub token_address: Option<String>,
}

fn add_placeholder_header(res: &mut axum::response::Response<axum::body::Body>) {
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("placeholder"),
    );
}

fn norm_token_key(s: &str) -> String {
    format!("0x{}", s.trim_start_matches("0x").to_ascii_lowercase())
}

/// GET /api/v1/governance/investor-share-reconcile
pub async fn get_governance_investor_share_reconcile(
    State(state): State<ApiMetaState>,
    Query(q): Query<InvestorShareReconcileQuery>,
) -> impl IntoResponse {
    const ANCHOR: &str = "B-085-INVESTOR-SHARE-SUPPLY-REBUILD";
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            let mut res = Json(json!({
                "status": "ok",
                "anchor": ANCHOR,
                "data_source": "placeholder",
                "tokens": [],
                "note": "DATABASE_URL / chain_off.db_pool required for projection replay"
            }))
            .into_response();
            add_placeholder_header(&mut res);
            return res;
        }
    };

    let chain_id_i = q.chain_id.map(|c| (c.min(i64::MAX as u64)) as i64);
    let token_l = q
        .token_address
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let rows = match db::list_investor_share_transfers_for_replay(pool, chain_id_i, token_l).await {
        Ok(r) => r,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "investor_share_reconcile_query_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    if rows.is_empty() {
        let mut res = Json(json!({
            "status": "ok",
            "anchor": ANCHOR,
            "data_source": "projection_empty",
            "tokens": [],
            "note": "investor_share_transfer_events has no matching rows; set INVESTOR_SHARE_TOKEN_ADDRESSES and run POST …/internal/indexer-tick"
        }))
        .into_response();
        add_placeholder_header(&mut res);
        return res;
    }

    let mut by_token: BTreeMap<String, Vec<db::InvestorShareTransferRow>> = BTreeMap::new();
    for r in rows {
        let k = norm_token_key(&r.token_address);
        by_token.entry(k).or_default().push(r);
    }

    let compliance_count = match db::investor_share_compliance_wallet_count(pool).await {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "investor_share_compliance_count_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    let cfg = state.chain_config.as_ref();
    let mut tokens_out = Vec::new();

    for (token, evs) in by_token {
        let (balances_map, sum_word) = match db::replay_balances_from_transfers(&evs) {
            Ok(x) => x,
            Err(msg) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "error": "investor_share_replay_failed",
                        "message": msg,
                        "token_address": token,
                        "anchor": ANCHOR,
                    })),
                )
                    .into_response();
            }
        };
        let sum_hex = fmt_word_hex(&sum_word);

        let holders: Vec<_> = balances_map
            .iter()
            .map(|(addr, w)| {
                json!({
                    "address": addr,
                    "balance_u256_hex": fmt_word_hex(w)
                })
            })
            .collect();

        let rpc_total = if let Some(c) = cfg {
            match chain::erc20_total_supply_word_hex(c, &token).await {
                Ok(h) => {
                    let matches = match (
                        parse_u256_word_hex(&h),
                        parse_u256_word_hex(&sum_hex),
                    ) {
                        (Some(a), Some(b)) => a == b,
                        _ => false,
                    };
                    json!({
                        "ok": true,
                        "total_supply_u256_hex": h,
                        "matches_sum_balances": matches
                    })
                }
                Err(e) => json!({ "ok": false, "error": e }),
            }
        } else {
            json!({ "ok": false, "error": "chain_not_configured" })
        };

        let mut invariant_holds = true;
        match rpc_total.get("ok").and_then(|x| x.as_bool()) {
            Some(true) => {
                let m = rpc_total
                    .get("matches_sum_balances")
                    .and_then(|x| x.as_bool())
                    .unwrap_or(false);
                invariant_holds = m;
            }
            Some(false) => {
                let err = rpc_total.get("error").and_then(|x| x.as_str());
                let projection_only = matches!(
                    err,
                    Some("chain_not_configured" | "chain rpc not configured")
                );
                if !projection_only {
                    invariant_holds = false;
                }
            }
            None => {}
        }

        let compliance = if compliance_count > 0 {
            let holders_addrs: Vec<String> = balances_map.keys().cloned().collect();
            let not_in_allowlist = match db::compliance_holders_not_allowlisted(pool, &holders_addrs).await {
                Ok(m) => m,
                Err(e) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key_detail(
                            "investor_share_compliance_check_failed",
                            e.to_string(),
                        )),
                    )
                        .into_response();
                }
            };
            let allowlist_ok = not_in_allowlist.is_empty();
            Some(json!({
                "enabled": true,
                "compliance_wallet_rows": compliance_count,
                "holders_with_balance": holders_addrs.len(),
                "not_in_allowlist": not_in_allowlist,
                "allowlist_ok": allowlist_ok
            }))
        } else {
            None
        };

        tokens_out.push(json!({
            "token_address": token,
            "transfer_events_used": evs.len(),
            "holders": holders,
            "sum_balances_u256_hex": sum_hex,
            "invariant_holds": invariant_holds,
            "rpc_total_supply": rpc_total,
            "compliance": compliance
        }));
    }

    Json(json!({
        "status": "ok",
        "anchor": ANCHOR,
        "data_source": "projection",
        "tokens": tokens_out
    }))
    .into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/governance/investor-share-reconcile",
        get(get_governance_investor_share_reconcile),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::test_support::api_meta_state;
    use axum::extract::State;
    use http_body_util::BodyExt;

    #[tokio::test]
    async fn investor_share_reconcile_placeholder_without_db_pool() {
        let res = get_governance_investor_share_reconcile(
            State(api_meta_state(None)),
            Query(InvestorShareReconcileQuery::default()),
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
        assert_eq!(
            v["anchor"].as_str(),
            Some("B-085-INVESTOR-SHARE-SUPPLY-REBUILD")
        );
    }
}
