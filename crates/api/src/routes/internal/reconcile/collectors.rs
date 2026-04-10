use serde_json::json;
use sqlx::PgPool;

use crate::chain;
use crate::chain_off;
use crate::db;

pub(super) fn terminal_escrow_label_for_reconcile(s: &chain::EscrowChainStatus) -> Option<&'static str> {
    match s {
        chain::EscrowChainStatus::Completed => Some("Completed"),
        chain::EscrowChainStatus::Refunded => Some("Refunded"),
        chain::EscrowChainStatus::Resolved => Some("Resolved"),
        chain::EscrowChainStatus::PartiallyRefunded => Some("PartiallyRefunded"),
        chain::EscrowChainStatus::Slashed => Some("Slashed"),
        _ => None,
    }
}

pub(super) fn escrow_chain_status_label(s: &chain::EscrowChainStatus) -> &'static str {
    match s {
        chain::EscrowChainStatus::None => "None",
        chain::EscrowChainStatus::Created => "Created",
        chain::EscrowChainStatus::Funded => "Funded",
        chain::EscrowChainStatus::Completed => "Completed",
        chain::EscrowChainStatus::Refunded => "Refunded",
        chain::EscrowChainStatus::Disputed => "Disputed",
        chain::EscrowChainStatus::Resolved => "Resolved",
        chain::EscrowChainStatus::PartiallyRefunded => "PartiallyRefunded",
        chain::EscrowChainStatus::Slashed => "Slashed",
    }
}

/// 抽样对 **`orders`（有 escrow 地址）** 调 RPC **`get_escrow_status`**，附 **`chain_escrow`**（如 **Funded**）
/// 与 **`orders.status`** 粗粒度 **`coarse_terminal_aligned`**。与 **`reconcile_orders_projection_vs_orders`**
///（**`orders`↔`orders_projection`** 投影一致性）维度不同；口径见 **110 §3.1.3**。
pub(super) async fn collect_rpc_escrow_reconcile_samples(
    cfg: &chain::ChainConfig,
    pool: &PgPool,
    raw_limit: u8,
) -> Result<Vec<serde_json::Value>, sqlx::Error> {
    let lim = (raw_limit as i64).clamp(1, 10);
    let rows = db::list_orders_with_escrow_id_status_limit(pool, lim).await?;
    let mut out = Vec::new();
    for row in rows {
        let id = row.id;
        let status_str = row.status;
        let bytes = db::order_uuid_to_projection_order_id(id);
        let db_state = chain_off::str_to_order_state(&status_str)
            .unwrap_or(traveltrust_core::OrderState::Created);
        let mut sample = json!({
            "order_id": id.to_string(),
            "orders_status": status_str,
        });
        match chain::get_escrow_status(cfg, bytes).await {
            Ok(Some(st)) => {
                sample["chain_escrow"] = json!(escrow_chain_status_label(&st));
                let cs = terminal_escrow_label_for_reconcile(&st);
                sample["coarse_terminal_aligned"] =
                    json!(chain_off::reconcile_order_chain_vs_db(cs, &db_state).unwrap_or(false));
            }
            Ok(None) => {
                sample["chain_escrow"] = serde_json::Value::Null;
                sample["coarse_terminal_aligned"] =
                    json!(chain_off::reconcile_order_chain_vs_db(None, &db_state).unwrap_or(false));
            }
            Err(e) => {
                sample["rpc_error"] = json!(e);
                sample["coarse_terminal_aligned"] = json!(false);
            }
        }
        out.push(sample);
    }
    Ok(out)
}

/// **`fee_router_routed_events`** 抽样与 **`eth_getTransactionReceipt`** 解码 **`PlatformFeeRouted`** 逐字段比对（**B-081**）。
pub(super) async fn collect_fee_router_log_verify(
    cfg: &chain::ChainConfig,
    pool: &PgPool,
    chain_id_i64: i64,
    raw_limit: u8,
) -> Result<serde_json::Value, sqlx::Error> {
    let lim_req = raw_limit;
    let lim = (raw_limit as usize).clamp(1, 20);
    let topic0 = chain::fee_router_verify::platform_fee_routed_topic0_hex();
    let router_opt = cfg
        .fee_router_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let Some(ref router) = router_opt else {
        return Ok(json!({
            "anchor": "B-081-FEE-ROUTER-LOG-VERIFY",
            "skipped": "fee_router_address_not_configured",
            "sample_limit_requested": lim_req,
            "sample_limit_applied": lim,
            "samples_returned": 0,
            "samples": [],
        }));
    };

    let (rows, _) =
        db::list_fee_router_routed_events(pool, Some(chain_id_i64), None, None, lim).await?;

    let mut recipients_val = serde_json::Value::Null;
    let mut recipients_err: Option<String> = None;
    match chain::fee_router_verify::read_fee_router_recipients(cfg.rpc_url.trim(), router).await {
        Ok(r) => recipients_val = r,
        Err(e) => recipients_err = Some(e),
    }

    let mut samples: Vec<serde_json::Value> = Vec::new();
    for row in &rows {
        let v = chain::fee_router_verify::verify_fee_router_row_vs_chain(cfg, row, router, &topic0)
            .await;
        samples.push(v);
    }

    let all_ok = !samples.is_empty() && samples.iter().all(|s| s.get("ok") == Some(&json!(true)));
    let mut out = json!({
        "anchor": "B-081-FEE-ROUTER-LOG-VERIFY",
        "sample_limit_requested": lim_req,
        "sample_limit_applied": lim,
        "samples_returned": samples.len(),
        "fee_router_projection_rows_fetched": rows.len(),
        "samples": samples,
        "log_verify_clean": all_ok,
        "fee_router_recipients_on_chain": recipients_val,
    });
    if rows.is_empty() {
        out["log_verify_clean"] = serde_json::Value::Null;
        out["no_fee_router_rows"] = json!(true);
    }
    if let Some(e) = recipients_err {
        out["fee_router_recipients_error"] = json!(e);
    }
    Ok(out)
}

/// **`region_vault_forwarded_events`** 抽样与 receipt **`RegionVaultForwarded`** + 余额闭环（**B-082**）。
pub(super) async fn collect_region_vault_log_verify(
    cfg: &chain::ChainConfig,
    pool: &PgPool,
    chain_id_i64: i64,
    raw_limit: u8,
) -> Result<serde_json::Value, sqlx::Error> {
    let lim_req = raw_limit;
    let lim = (raw_limit as usize).clamp(1, 20);
    let topic0 = chain::region_vault_verify::region_vault_forwarded_topic0_hex();
    let vault_opt = cfg
        .region_vault_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let Some(ref vault) = vault_opt else {
        return Ok(json!({
            "anchor": "B-082-REGION-VAULT-LOG-VERIFY",
            "skipped": "region_vault_address_not_configured",
            "sample_limit_requested": lim_req,
            "sample_limit_applied": lim,
            "samples_returned": 0,
            "samples": [],
        }));
    };

    let (rows, _) =
        db::list_region_vault_forwarded_events(pool, Some(chain_id_i64), None, None, lim).await?;

    let mut samples: Vec<serde_json::Value> = Vec::new();
    for row in &rows {
        let v =
            chain::region_vault_verify::verify_region_vault_row_vs_chain(cfg, row, vault, &topic0)
                .await;
        samples.push(v);
    }

    let all_ok = !samples.is_empty() && samples.iter().all(|s| s.get("ok") == Some(&json!(true)));
    let mut out = json!({
        "anchor": "B-082-REGION-VAULT-LOG-VERIFY",
        "sample_limit_requested": lim_req,
        "sample_limit_applied": lim,
        "samples_returned": samples.len(),
        "region_vault_projection_rows_fetched": rows.len(),
        "samples": samples,
        "log_verify_clean": all_ok,
    });
    if rows.is_empty() {
        out["log_verify_clean"] = serde_json::Value::Null;
        out["no_region_vault_rows"] = json!(true);
    }
    Ok(out)
}
