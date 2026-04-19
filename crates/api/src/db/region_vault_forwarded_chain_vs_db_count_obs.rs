//! **RegionVault** **`RegionVaultForwarded`**：**`eth_getLogs`** 条数 vs **`region_vault_forwarded_events`** 投影行数（**同块窗** **\[min,max\]**）— **母表 B-384** / **TT-B384**。
//!
//! **边界**：不修改 **`GET /api/v1/governance/vault-forwards`**；**不**替代 **B-165**（列表游标 vs 聚合 **MAX/MIN**）。

use crate::chain::region_vault_verify::eth_get_logs_count_region_vault_forwarded;
use crate::chain::ChainConfig;
use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B384** / **母表 B-384**：机读锚（**`region_vault_forwarded_log_count_chain_vs_db_observability`**）。
pub const REGION_VAULT_FORWARDED_LOG_COUNT_CHAIN_VS_DB_OBS_ANCHOR: &str =
    "384-REGION-VAULT-FORWARDED-LOG-COUNT-CHAIN-VS-DB-OBS-V1";

/// **v1**：块窗超过此 **inclusive** 跨度时不对节点发 **`eth_getLogs`**（防超大范围）。
const MAX_BLOCK_SPAN_INCLUSIVE: i64 = 500_000;

/// **`region_vault_forwarded_stats`** 之 **\[min_block,max_block\]** 窗内：**COUNT(DB)** vs **`eth_getLogs`** **条数**。
pub async fn region_vault_forwarded_log_count_chain_vs_db_observability(
    pool: &PgPool,
    config: &ChainConfig,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let rpc = config.rpc_url.trim();
    let region_vault = config
        .region_vault_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());

    let mut base = json!({
        "anchor": REGION_VAULT_FORWARDED_LOG_COUNT_CHAIN_VS_DB_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "chain_id": expected_chain_id,
        "boundary": "Chain leg: eth_getLogs(REGION_VAULT_ADDRESS, topic0=RegionVaultForwarded, fromBlock=min_block, toBlock=max_block). DB leg: COUNT(*) FROM region_vault_forwarded_events WHERE chain_id=:chain AND block_number BETWEEN min AND max (same inclusive window as projection stats min/max).",
        "checks": {
            "chain_config": if config.is_configured() && region_vault.is_some() && !rpc.is_empty() {
                "ready"
            } else {
                "incomplete"
            },
        },
    });

    if !config.is_configured() || region_vault.is_none() || rpc.is_empty() {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("chain_config_incomplete_or_missing_region_vault"),
            );
        return Ok(base);
    }

    let stats = super::region_vault_forwarded_stats(pool, Some(expected_chain_id)).await?;
    if stats.total == 0 {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("projection_empty_no_region_vault_forwarded_rows"),
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

    let db_count = super::region_vault_forwarded_events_count_in_block_range(
        pool,
        expected_chain_id,
        min_b,
        max_b,
    )
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
                "db_region_vault_forwarded_events_rows": db_count,
                "projection_stats_total": stats.total,
            }),
        );

    let rv = region_vault.expect("checked");
    let chain_n = eth_get_logs_count_region_vault_forwarded(rpc, rv, min_u, max_u).await;

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
        .insert("chain_region_vault_forwarded_logs".into(), json!(chain_n));

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b384_anchor_constant() {
        assert_eq!(
            REGION_VAULT_FORWARDED_LOG_COUNT_CHAIN_VS_DB_OBS_ANCHOR,
            "384-REGION-VAULT-FORWARDED-LOG-COUNT-CHAIN-VS-DB-OBS-V1"
        );
    }
}
