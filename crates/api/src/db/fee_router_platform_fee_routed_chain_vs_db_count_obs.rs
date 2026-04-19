//! **FeeRouter** **`PlatformFeeRouted`**：**`eth_getLogs`** 条数 vs **`fee_router_routed_events`** 投影行数（**同块窗** **\[min,max\]**）— **母表 B-383** / **TT-B383**。
//!
//! **边界**：不修改 **`GET /api/v1/governance/fee-routes`**；**不**替代 **B-164**（列表游标 vs 聚合 **MAX/MIN**）。

use crate::chain::fee_router_verify::eth_get_logs_count_platform_fee_routed;
use crate::chain::ChainConfig;
use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B383** / **母表 B-383**：机读锚（**`fee_router_platform_fee_routed_log_count_chain_vs_db_observability`**）。
pub const FEE_ROUTER_PLATFORM_FEE_ROUTED_LOG_COUNT_CHAIN_VS_DB_OBS_ANCHOR: &str =
    "383-FEE-ROUTER-PLATFORM-FEE-ROUTED-LOG-COUNT-CHAIN-VS-DB-OBS-V1";

/// **B-383 × B-081**：单笔 receipt 校验与 **同块窗** **`eth_getLogs`** vs **DB** 行数 **并列** 机读锚（写入 **B-383** JSON 子键 **`dual_consistency_with_b081_pin`**）。
pub const FEE_ROUTER_B383_B081_DUAL_CONSISTENCY_ANCHOR: &str = "383-B081-DUAL-CONSISTENCY-V1";

/// **v1**：块窗超过此 **inclusive** 跨度时不对节点发 **`eth_getLogs`**（防超大范围）。
const MAX_BLOCK_SPAN_INCLUSIVE: i64 = 500_000;

/// **`fee_router_routed_stats`** 之 **\[min_block,max_block\]** 窗内：**COUNT(DB)** vs **`eth_getLogs`** **条数**。
pub async fn fee_router_platform_fee_routed_log_count_chain_vs_db_observability(
    pool: &PgPool,
    config: &ChainConfig,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let rpc = config.rpc_url.trim();
    let fee_router = config
        .fee_router_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());

    let mut base = json!({
        "anchor": FEE_ROUTER_PLATFORM_FEE_ROUTED_LOG_COUNT_CHAIN_VS_DB_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "chain_id": expected_chain_id,
        "boundary": "Chain leg: eth_getLogs(FEE_ROUTER_ADDRESS, topic0=PlatformFeeRouted, fromBlock=min_block, toBlock=max_block). DB leg: COUNT(*) FROM fee_router_routed_events WHERE chain_id=:chain AND block_number BETWEEN min AND max (same inclusive window as projection stats min/max).",
        "checks": {
            "chain_config": if config.is_configured() && fee_router.is_some() && !rpc.is_empty() {
                "ready"
            } else {
                "incomplete"
            },
        },
    });

    if !config.is_configured() || fee_router.is_none() || rpc.is_empty() {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("chain_config_incomplete_or_missing_fee_router"),
            );
        return Ok(base);
    }

    let stats = super::fee_router_routed_stats(pool, Some(expected_chain_id)).await?;
    if stats.total == 0 {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("projection_empty_no_fee_router_routed_rows"),
            );
        return Ok(base);
    }

    let (Some(min_b), Some(max_b)) = (stats.min_block_number, stats.max_block_number) else {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("projection_stats_missing_min_or_max_block"),
            );
        return Ok(base);
    };

    if min_b > max_b {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("invalid_min_max_block_in_projection_stats"),
            );
        return Ok(base);
    }

    if max_b - min_b > MAX_BLOCK_SPAN_INCLUSIVE {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!(format!(
                    "block_span_exceeds_v1_cap:{}",
                    MAX_BLOCK_SPAN_INCLUSIVE
                )),
            );
        base.as_object_mut()
            .expect("object")
            .insert(
                "window".into(),
                json!({
                    "min_block_number": min_b,
                    "max_block_number": max_b,
                }),
            );
        return Ok(base);
    }

    let min_u = u64::try_from(min_b).unwrap_or(0);
    let max_u = u64::try_from(max_b).unwrap_or(0);

    let db_count =
        super::fee_router_routed_events_count_in_block_range(pool, expected_chain_id, min_b, max_b)
            .await?;

    base.as_object_mut()
        .expect("object")
        .insert(
            "window".into(),
            json!({
                "min_block_number": min_b,
                "max_block_number": max_b,
            }),
        );
    base.as_object_mut()
        .expect("object")
        .insert(
            "counts".into(),
            json!({
                "db_fee_router_routed_events_rows": db_count,
                "projection_stats_total": stats.total,
            }),
        );

    let fr = fee_router.expect("checked");
    let chain_n = eth_get_logs_count_platform_fee_routed(rpc, fr, min_u, max_u).await;

    let chain_n = match chain_n {
        Ok(n) => n,
        Err(e) => {
            let o = base.as_object_mut().expect("object");
            o.insert("marker".into(), json!("unavailable"));
            o.get_mut("checks")
                .and_then(|c| c.as_object_mut())
                .expect("checks object")
                .insert("eth_get_logs".into(), json!("rpc_failed"));
            o.insert("error".into(), json!(e));
            return Ok(base);
        }
    };

    base.as_object_mut()
        .expect("object")
        .get_mut("counts")
        .and_then(|c| c.as_object_mut())
        .expect("counts object")
        .insert("chain_platform_fee_routed_logs".into(), json!(chain_n));

    let count_check = if db_count as usize == chain_n {
        "aligned"
    } else {
        "drift"
    };
    let marker = if count_check == "aligned" {
        "aligned"
    } else {
        "drift"
    };

    base.as_object_mut()
        .expect("object")
        .get_mut("checks")
        .and_then(|c| c.as_object_mut())
        .expect("checks object")
        .insert("db_rows_vs_chain_log_count".into(), json!(count_check));
    base.as_object_mut()
        .expect("object")
        .insert("marker".into(), json!(marker));

    Ok(base)
}

/// 将 **B-081** **`fee_router_log_verify`**（须含 **`pin_tx_hash`**）并入 **B-383** 观测 JSON，给出 **全局窗**（**`marker`** / **`eth_getLogs`** vs **DB**）与 **单笔 receipt** 的 **并列** 证明。
///
/// - 无 **`pin_tx_hash`** 或 **`fee_router_log_verify`** 缺省时 **原样返回** **`b383`**（不增键）。
/// - **`pin_tx_hash`** 存在时写入 **`dual_consistency_with_b081_pin`**；**`GET …/admin/observability/overview`** 与 **`persist` `summary`** 须与 **`POST …/indexer-reconcile`** 同源（同一次合并结果）。
pub fn overlay_b081_pin_dual_consistency_on_b383(
    mut b383: Value,
    fee_router_log_verify: Option<&Value>,
) -> Value {
    let Some(frv) = fee_router_log_verify else {
        return b383;
    };
    if frv.get("pin_tx_hash").is_none() {
        return b383;
    }

    let global_marker = b383.get("marker").and_then(|x| x.as_str()).unwrap_or("");
    let window_min = b383.pointer("/window/min_block_number").and_then(|x| x.as_i64());
    let window_max = b383.pointer("/window/max_block_number").and_then(|x| x.as_i64());

    let mut pin_block: Option<i64> = None;
    if let Some(samples) = frv.get("samples").and_then(|s| s.as_array()) {
        if let Some(first) = samples.first() {
            pin_block = first.get("block_number").and_then(|x| x.as_i64());
        }
    }

    let pinned_in_window = match (window_min, window_max, pin_block) {
        (Some(lo), Some(hi), Some(b)) => b >= lo && b <= hi,
        _ => false,
    };

    let b081_clean = frv.get("log_verify_clean") == Some(&json!(true));
    let pin_err = frv.get("pin_error").and_then(|x| x.as_str());
    let global_aligned = global_marker == "aligned";

    let dual = pin_err.is_none() && b081_clean && pinned_in_window && global_aligned;

    let note = if pin_err.is_some() {
        "pin_error_or_ambiguous"
    } else if !b081_clean {
        "b081_receipt_not_clean"
    } else if !global_aligned {
        "b383_global_window_not_aligned"
    } else if !pinned_in_window && pin_block.is_some() {
        "pinned_block_outside_b383_min_max_window"
    } else {
        "ok"
    };

    let proof = json!({
        "anchor": FEE_ROUTER_B383_B081_DUAL_CONSISTENCY_ANCHOR,
        "boundary": "Combines B-383 window count (eth_getLogs PlatformFeeRouted vs fee_router_routed_events in [min_block,max_block]) with B-081 receipt decode vs DB row for a pinned tx (pin_tx_hash). dual_consistency_aligned requires: B-383 marker aligned, B-081 log_verify_clean true, no pin_error, pinned event block inside B-383 window.",
        "participates": true,
        "pinned_tx_hash": frv.get("pin_tx_hash"),
        "pinned_log_index": frv.get("pin_log_index"),
        "pinned_block_number": pin_block,
        "pinned_event_in_b383_window": pinned_in_window,
        "b081_receipt_log_verify_clean": b081_clean,
        "b383_global_marker": global_marker,
        "dual_consistency_aligned": dual,
        "observation_note": note,
    });

    if let Some(obj) = b383.as_object_mut() {
        obj.insert("dual_consistency_with_b081_pin".to_string(), proof);
    }
    b383
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b383_anchor_constant() {
        assert_eq!(
            FEE_ROUTER_PLATFORM_FEE_ROUTED_LOG_COUNT_CHAIN_VS_DB_OBS_ANCHOR,
            "383-FEE-ROUTER-PLATFORM-FEE-ROUTED-LOG-COUNT-CHAIN-VS-DB-OBS-V1"
        );
    }

    #[test]
    fn overlay_no_pin_leaves_b383_unchanged() {
        let b383 = json!({"marker": "aligned", "anchor": FEE_ROUTER_PLATFORM_FEE_ROUTED_LOG_COUNT_CHAIN_VS_DB_OBS_ANCHOR});
        let frv = json!({"log_verify_clean": true, "samples": []});
        let out = overlay_b081_pin_dual_consistency_on_b383(b383.clone(), Some(&frv));
        assert_eq!(out, b383);
    }

    #[test]
    fn overlay_dual_ok_when_aligned_and_in_window() {
        let b383 = json!({
            "marker": "aligned",
            "window": {"min_block_number": 10, "max_block_number": 100}
        });
        let frv = json!({
            "pin_tx_hash": "0xab",
            "log_verify_clean": true,
            "samples": [{"ok": true, "block_number": 50}]
        });
        let out = overlay_b081_pin_dual_consistency_on_b383(b383, Some(&frv));
        assert_eq!(
            out["dual_consistency_with_b081_pin"]["dual_consistency_aligned"],
            json!(true)
        );
        assert_eq!(
            out["dual_consistency_with_b081_pin"]["pinned_event_in_b383_window"],
            json!(true)
        );
    }
}
