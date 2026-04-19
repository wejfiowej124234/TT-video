//! **`governance_pool`** 表余额与 **FeeRouter `balanceOf`**（**`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`**）只读对拍（**母表 B-381** / **TT-B381**）。
//!
//! **边界**：不修改 **`GET /api/v1/governance/pool`** 响应；仅观测。

use crate::chain::balance_read;
use crate::chain::ChainConfig;
use crate::db::governance::get_governance_pool;
use crate::state::governance_pool_balance_chain_ssot_enabled;
use crate::u256_hex::parse_u256_word_hex;
use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B381** / **母表 B-381**：机读锚（**`governance_pool_db_vs_chain_balance_drift_observability`**）。
pub const GOVERNANCE_POOL_DB_VS_CHAIN_BALANCE_DRIFT_ANCHOR: &str =
    "381-GOVERNANCE-POOL-DB-VS-CHAIN-BALANCE-DRIFT-OBS-V1";

fn parse_db_balance_word(raw: Option<&str>) -> (&'static str, Option<[u8; 32]>) {
    let Some(s) = raw.map(str::trim).filter(|s| !s.is_empty()) else {
        return ("missing", None);
    };
    if let Some(w) = parse_u256_word_hex(s) {
        return ("parsed", Some(w));
    }
    if let Some(w) = parse_u256_word_hex(&format!("0x{s}")) {
        return ("parsed", Some(w));
    }
    ("unparseable", None)
}

/// **`governance_pool`** 最新行 **`balance`** vs **`ssot_read_fee_router_erc20_balance_hex`**（与 **B110-SSOT-06** **`pool_balance`** 链上腿同源前提）。
pub async fn governance_pool_db_vs_chain_balance_drift_observability(
    pool: &PgPool,
    config: &ChainConfig,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let ssot_env = governance_pool_balance_chain_ssot_enabled();
    let row = get_governance_pool(pool).await?;
    let (db_check, db_word) =
        parse_db_balance_word(row.as_ref().and_then(|r| r.balance.as_deref()));

    let rpc = config.rpc_url.trim();
    let fee_router = config
        .fee_router_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());
    let ssot_token = std::env::var("GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let config_ok = config.is_configured()
        && !rpc.is_empty()
        && fee_router.is_some()
        && ssot_token.is_some();

    let mut base = json!({
        "anchor": GOVERNANCE_POOL_DB_VS_CHAIN_BALANCE_DRIFT_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "chain_id": expected_chain_id,
        "governance_pool_balance_chain_ssot_enabled": ssot_env,
        "boundary_vs_governance_pool_get": "Chain leg: balance_read::ssot_read_fee_router_erc20_balance_hex(rpc, FEE_ROUTER_ADDRESS, GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS). DB leg: SELECT balance FROM governance_pool ORDER BY updated_at DESC LIMIT 1 (same row source as GET /api/v1/governance/pool when data_source=database).",
        "checks": {
            "db_balance": db_check,
            "chain_config": if config_ok { "ready" } else { "incomplete" },
        },
    });

    if !config_ok {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("chain_config_incomplete_or_missing_token"),
            );
        return Ok(base);
    }

    let fr = fee_router.expect("checked");
    let tok = ssot_token.expect("checked");

    let chain_hex =
        balance_read::ssot_read_fee_router_erc20_balance_hex(rpc, fr, tok.as_str()).await;

    let chain_hex = match chain_hex {
        Ok(h) => h,
        Err(e) => {
            let o = base.as_object_mut().expect("object");
            o.insert("marker".into(), json!("unavailable"));
            o.get_mut("checks")
                .and_then(|c| c.as_object_mut())
                .expect("checks object")
                .insert("chain_balance".into(), json!("rpc_failed"));
            o.insert("error".into(), json!(e));
            return Ok(base);
        }
    };

    let Some(chain_word) = parse_u256_word_hex(&chain_hex) else {
        let o = base.as_object_mut().expect("object");
        o.insert("marker".into(), json!("unavailable"));
        o.get_mut("checks")
            .and_then(|c| c.as_object_mut())
            .expect("checks object")
            .insert("chain_balance".into(), json!("parse_failed"));
        o.insert("chain_balance_hex".into(), json!(chain_hex));
        return Ok(base);
    };

    base.as_object_mut()
        .expect("object")
        .insert("chain_balance_hex".into(), json!(chain_hex));
    base.as_object_mut()
        .expect("object")
        .insert("ssot_token_address".into(), json!(tok));

    let Some(db_w) = db_word else {
        let o = base.as_object_mut().expect("object");
        o.insert("marker".into(), json!("incomparable"));
        let note = if db_check == "missing" {
            "db_balance_missing"
        } else {
            "db_balance_unparseable"
        };
        o.insert("observation_note".into(), json!(note));
        return Ok(base);
    };

    let balance_check = if db_w == chain_word {
        "aligned"
    } else {
        "drift"
    };
    let marker = if balance_check == "aligned" {
        "aligned"
    } else {
        "drift"
    };
    base.as_object_mut()
        .expect("object")
        .get_mut("checks")
        .and_then(|c| c.as_object_mut())
        .expect("checks object")
        .insert("balance_word".into(), json!(balance_check));
    base.as_object_mut()
        .expect("object")
        .insert("marker".into(), json!(marker));

    Ok(base)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b381_anchor_constant() {
        assert_eq!(
            GOVERNANCE_POOL_DB_VS_CHAIN_BALANCE_DRIFT_ANCHOR,
            "381-GOVERNANCE-POOL-DB-VS-CHAIN-BALANCE-DRIFT-OBS-V1"
        );
    }
}
