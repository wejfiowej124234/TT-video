//! B-084 **`fee-pool-aggregates`** 与 cross_check 旁证（**TT-MOD-B3-05 · `fee_pool_aggregate`**）。

use std::collections::BTreeMap;

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;
use crate::routes::governance_doc_reference;

use super::common::add_placeholder_header;

#[derive(Debug, Default, Deserialize)]
pub struct FeePoolAggregatesQuery {
    /// 可选；不传则聚合全部 `chain_id` 的投影行
    pub chain_id: Option<i64>,
}

/// B-084：**`cross_check`** 旁证由 **84 镜像体**（`doc_version` / `checksums` / `phase1_countries`）派生，与 **`GET /protocol-reference`** 同源切片（**TT-B084-FEE-POOL-CROSS-CHECK-PROTOCOL-REFERENCE-001**）。
///
/// **Σ 累计**仍仅来自投影行；本对象**非**链上真值、**不**读取 **`protocol-reference/pending`**（pending 仅影响待生效预览体）。
pub(crate) fn fee_pool_cross_check_from_pref(pref: &serde_json::Value) -> serde_json::Value {
    let checksums = &pref["checksums"];
    let n_countries = pref["phase1_countries"]
        .as_array()
        .map(std::vec::Vec::len);
    json!({
        "protocol_reference_doc_version": pref["doc_version"],
        "phase1_open_fee_points_sum": checksums["phase1_open_fee_points_sum"],
        "phase1_countries_count": n_countries,
        "fee_router_layer1_country_bucket_percent": checksums["country_bucket_percent"],
        "note": "Cross-check GET /api/v1/governance/protocol-reference (84 open_fee_points checksums); aggregates are Σ projection rows only (B-084)"
    })
}

pub(crate) fn fee_pool_cross_check_json() -> serde_json::Value {
    fee_pool_cross_check_from_pref(&governance_doc_reference::protocol_reference_json())
}

pub(crate) fn build_fee_pool_aggregate_body(
    chain_id_filter: Option<i64>,
    fr: Vec<db::FeeRouterAggregateSourceRow>,
    rv: Vec<db::RegionVaultAggregateSourceRow>,
) -> Result<serde_json::Value, &'static str> {
    use crate::u256_hex::{add_assign_be, fmt_word_hex, parse_u256_word_hex, zero_word};

    #[derive(Default)]
    struct FrAcc {
        allocatable_platform_fee_total: [u8; 32],
        country_bucket: [u8; 32],
        global_stakers: [u8; 32],
        global_reserve: [u8; 32],
        global_ops: [u8; 32],
        rows: u64,
    }

    let mut fr_map: BTreeMap<String, FrAcc> = BTreeMap::new();
    for row in fr {
        let tok = row.token_address.trim().to_ascii_lowercase();
        let ent = fr_map.entry(tok).or_default();
        let w0 = parse_u256_word_hex(&row.amount_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w1 = parse_u256_word_hex(&row.to_country_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w2 = parse_u256_word_hex(&row.to_stakers_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w3 = parse_u256_word_hex(&row.to_reserve_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w4 = parse_u256_word_hex(&row.to_ops_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        add_assign_be(&mut ent.allocatable_platform_fee_total, &w0)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.country_bucket, &w1)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_stakers, &w2)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_reserve, &w3)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_ops, &w4)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        ent.rows += 1;
    }

    let fr_items: Vec<_> = fr_map
        .into_iter()
        .map(|(token_address, a)| {
            json!({
                "token_address": token_address,
                "event_row_count": a.rows,
                "pools": {
                    "allocatable_platform_fee_total_u256_hex": fmt_word_hex(&a.allocatable_platform_fee_total),
                    "country_bucket_u256_hex": fmt_word_hex(&a.country_bucket),
                    "global_stakers_u256_hex": fmt_word_hex(&a.global_stakers),
                    "global_reserve_u256_hex": fmt_word_hex(&a.global_reserve),
                    "global_ops_u256_hex": fmt_word_hex(&a.global_ops)
                },
                "pool_id_legend": "84: country_bucket = PlatformFeeRouted data word[1]; global_stakers/reserve/ops = words[2..5] (ttg_stakers / reserve / operations)"
            })
        })
        .collect();

    #[derive(Default)]
    struct VTok {
        total: [u8; 32],
        by_to: BTreeMap<String, [u8; 32]>,
        rows: u64,
    }
    let mut v_map: BTreeMap<String, VTok> = BTreeMap::new();
    for row in rv {
        let tok = row.token_address.trim().to_ascii_lowercase();
        let to_a = row.to_address.trim().to_ascii_lowercase();
        let amt = parse_u256_word_hex(&row.amount_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let ent = v_map.entry(tok).or_default();
        add_assign_be(&mut ent.total, &amt).map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        let slot = ent.by_to.entry(to_a).or_insert_with(zero_word);
        add_assign_be(slot, &amt).map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        ent.rows += 1;
    }

    let rv_items: Vec<_> = v_map
        .into_iter()
        .map(|(token_address, a)| {
            let by_recipient: Vec<_> = a
                .by_to
                .into_iter()
                .map(|(to_address, w)| {
                    json!({
                        "to_address": to_address,
                        "amount_u256_hex": fmt_word_hex(&w),
                    })
                })
                .collect();
            json!({
                "token_address": token_address,
                "event_row_count": a.rows,
                "total_forwarded_u256_hex": fmt_word_hex(&a.total),
                "by_recipient": by_recipient
            })
        })
        .collect();

    Ok(json!({
        "status": "ok",
        "data_source": "projection",
        "ssot": "fee_router_routed_events+region_vault_forwarded_events",
        "chain_id_filter": chain_id_filter,
        "fee_router": {
            "by_token": fr_items,
            "note": "Per-token Σ over indexed PlatformFeeRouted projection rows; uint256 big-endian 0x-hex"
        },
        "region_vault": {
            "by_token": rv_items,
            "note": "Per-token Σ RegionVaultForwarded amount; by_recipient sub-aggregates for downstream pool routing checks"
        },
        "cross_check": fee_pool_cross_check_json(),
        "rule_version": "fee_pool_aggregates_projection_v1",
        "anchor": "B-084-FEE-POOL-AGGREGATES-PROJECTION"
    }))
}

/// GET /api/v1/governance/fee-pool-aggregates — 按 **token** / **pool_id** 的投影累计入量（B-084）
pub async fn get_governance_fee_pool_aggregates(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeePoolAggregatesQuery>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        let mut res = Json(json!({
            "status": "ok",
            "data_source": "placeholder",
            "ssot": "fee_router_routed_events+region_vault_forwarded_events",
            "chain_id_filter": q.chain_id,
            "fee_router": { "by_token": [] },
            "region_vault": { "by_token": [] },
            "cross_check": fee_pool_cross_check_json(),
            "rule_version": "fee_pool_aggregates_projection_v1",
            "anchor": "B-084-FEE-POOL-AGGREGATES-PROJECTION",
            "note": "49 G 占位：无 PostgreSQL 或未配置 chain_off DB 时无聚合源；见 internal/indexer-tick + FEE_ROUTER_ADDRESS / REGION_VAULT_ADDRESS"
        }))
        .into_response();
        add_placeholder_header(&mut res);
        return res;
    };

    let (fr, rv) = match tokio::try_join!(
        db::fetch_fee_router_for_aggregate(pool, q.chain_id),
        db::fetch_region_vault_for_aggregate(pool, q.chain_id),
    ) {
        Ok(x) => x,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "fee_pool_aggregates_query_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    match build_fee_pool_aggregate_body(q.chain_id, fr, rv) {
        Ok(v) => {
            #[cfg(debug_assertions)]
            {
                db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
                db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
            }
            Json(v).into_response()
        }
        Err(key) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                key,
                "u256 parse failed, add overflow, or malformed projection hex; fix DB projection rows",
            )),
        )
            .into_response(),
    }
}
