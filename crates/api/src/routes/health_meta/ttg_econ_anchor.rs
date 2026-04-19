//! **`GET /meta`** **`chain.ttg_econ_anchor`**：**TTG** **`totalSupply`** **/** **`balanceOf(TREASURY)`** **与** **N1/N2** **`chain_reads.json`** **同锚点** **（** **`eth_call`** **@** **block** **）**。

use serde::Deserialize;
use serde_json::json;

use crate::chain::balance_read::{
    eth_call_erc20_balance_of_u256_hex_at_block, eth_call_erc20_total_supply_u256_hex_at_block,
    u256_norm_hex_to_decimal_string,
};

/// **`GET /meta?ttg_econ_anchor_block=<N>`** — 与 **`chain_reads.json`** **→ **`block_number`** **对齐** **时** **传** **N**。
#[derive(Debug, Default, Deserialize)]
pub struct MetaQuery {
    #[serde(default)]
    pub ttg_econ_anchor_block: Option<u64>,
}

/// 构建 **`chain.ttg_econ_anchor`** JSON（**`preserve_order`** **下** **键序** **稳定**）。
pub async fn snapshot(state: &crate::state::ApiMetaState, query_block: Option<u64>) -> serde_json::Value {
    let rule = "TTG N2：eth_call totalSupply() 与 balanceOf(TREASURY_ADDRESS) 于锚点块；锚点优先级：GET /meta 查询参数 ttg_econ_anchor_block > 环境变量 TTG_ECON_ANCHOR_BLOCK > indexer checkpoint block_number；须 ChainConfig 含 governance_token_address 与 treasury_address 及 CHAIN_RPC_URL";
    let Some(cfg) = state.chain_config.as_ref() else {
        return json!({
            "available": false,
            "block_number": serde_json::Value::Null,
            "block_tag": serde_json::Value::Null,
            "total_supply": serde_json::Value::Null,
            "treasury_balance": serde_json::Value::Null,
            "error": "chain_config_not_mounted",
            "rule": rule
        });
    };
    let rpc = cfg.rpc_url.trim();
    if rpc.is_empty() {
        return json!({
            "available": false,
            "block_number": serde_json::Value::Null,
            "block_tag": serde_json::Value::Null,
            "total_supply": serde_json::Value::Null,
            "treasury_balance": serde_json::Value::Null,
            "error": "rpc_url_empty",
            "rule": rule
        });
    }
    let tok = cfg.governance_token_address.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let tr = cfg.treasury_address.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let (Some(tok), Some(tr)) = (tok, tr) else {
        return json!({
            "available": false,
            "block_number": serde_json::Value::Null,
            "block_tag": serde_json::Value::Null,
            "total_supply": serde_json::Value::Null,
            "treasury_balance": serde_json::Value::Null,
            "error": "governance_token_or_treasury_unset_in_chain_config",
            "rule": rule
        });
    };

    let env_block = std::env::var("TTG_ECON_ANCHOR_BLOCK")
        .ok()
        .and_then(|s| s.parse::<u64>().ok());
    let (cp_block, _, _) = state.indexer_checkpoint_for_observability().await;
    let block_u64 = query_block
        .or(env_block)
        .unwrap_or(cp_block);
    let block_tag = format!("0x{:x}", block_u64);

    let ts_r = eth_call_erc20_total_supply_u256_hex_at_block(rpc, tok, &block_tag).await;
    let tb_r = eth_call_erc20_balance_of_u256_hex_at_block(rpc, tok, tr, &block_tag).await;
    match (ts_r, tb_r) {
        (Ok(ts_hex), Ok(tb_hex)) => {
            let ts_dec = match u256_norm_hex_to_decimal_string(&ts_hex) {
                Ok(s) => s,
                Err(e) => {
                    return json!({
                        "available": false,
                        "block_number": block_u64,
                        "block_tag": block_tag,
                        "total_supply": serde_json::Value::Null,
                        "treasury_balance": serde_json::Value::Null,
                        "error": format!("total_supply_decode:{e}"),
                        "rule": rule
                    });
                }
            };
            let tb_dec = match u256_norm_hex_to_decimal_string(&tb_hex) {
                Ok(s) => s,
                Err(e) => {
                    return json!({
                        "available": false,
                        "block_number": block_u64,
                        "block_tag": block_tag,
                        "total_supply": ts_dec,
                        "treasury_balance": serde_json::Value::Null,
                        "error": format!("treasury_balance_decode:{e}"),
                        "rule": rule
                    });
                }
            };
            json!({
                "available": true,
                "block_number": block_u64,
                "block_tag": block_tag,
                "total_supply": ts_dec,
                "treasury_balance": tb_dec,
                "error": serde_json::Value::Null,
                "rule": rule
            })
        }
        (Err(e), _) | (_, Err(e)) => json!({
            "available": false,
            "block_number": block_u64,
            "block_tag": block_tag,
            "total_supply": serde_json::Value::Null,
            "treasury_balance": serde_json::Value::Null,
            "error": e,
            "rule": rule
        }),
    }
}
