//! RegionVault `RegionVaultForwarded`：DB 投影、receipt 解码与收款方 **ERC20 余额差** 闭环（B-082、110、14 §1.1.1）

use sha3::{Digest, Keccak256};
use serde_json::{json, Value};

use crate::chain::ChainConfig;
use crate::chain_off::parse_region_vault_forwarded;
use crate::db::RegionVaultForwardedEventRow;

/// `keccak256("RegionVaultForwarded(address,address,uint256)")` topic0
pub fn region_vault_forwarded_topic0_hex() -> String {
    let h = Keccak256::digest(b"RegionVaultForwarded(address,address,uint256)");
    format!("0x{}", hex::encode(h))
}

fn norm_hex_addr(a: &str) -> String {
    let s = a.trim().to_ascii_lowercase();
    let s = s.strip_prefix("0x").unwrap_or(&s);
    format!("0x{:0>40}", s)
}

fn norm_u256_hex(h: &str) -> String {
    let s = h.trim().to_ascii_lowercase();
    let s = s.strip_prefix("0x").unwrap_or(&s);
    if s.len() > 64 {
        return h.to_string();
    }
    format!("0x{:0>64}", s)
}

fn norm_tx_hash(h: &str) -> String {
    let s = h.trim().to_ascii_lowercase();
    let s = s.strip_prefix("0x").unwrap_or(&s);
    format!("0x{:0>64}", s)
}

fn selector_balance_of() -> [u8; 4] {
    let h = Keccak256::digest(b"balanceOf(address)");
    [h[0], h[1], h[2], h[3]]
}

fn u256_from_hex_32(s: &str) -> Option<[u8; 32]> {
    let s = s.trim().trim_start_matches("0x");
    let v = hex::decode(s).ok()?;
    if v.len() > 32 {
        return None;
    }
    let mut o = [0u8; 32];
    o[32 - v.len()..].copy_from_slice(&v);
    Some(o)
}

fn u256_sub_nonneg(a: [u8; 32], b: [u8; 32]) -> Option<[u8; 32]> {
    let mut out = [0u8; 32];
    let mut borrow: i16 = 0;
    for i in (0..32).rev() {
        let av = a[i] as i16 - borrow;
        let bv = b[i] as i16;
        if av >= bv {
            out[i] = (av - bv) as u8;
            borrow = 0;
        } else {
            out[i] = (av + 256 - bv) as u8;
            borrow = 1;
        }
    }
    if borrow > 0 {
        None
    } else {
        Some(out)
    }
}

async fn get_transaction_receipt(rpc_url: &str, tx_hash: &str) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getTransactionReceipt",
        "params": [tx_hash.trim()],
        "id": 1
    });
    let res: Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    match res.get("result") {
        Some(r) if !r.is_null() => Ok(r.clone()),
        _ => Err(res
            .get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_getTransactionReceipt failed")
            .to_string()),
    }
}

fn receipt_block_number_u64(receipt: &Value) -> Option<u64> {
    receipt
        .get("blockNumber")
        .and_then(|b| b.as_str())
        .and_then(|s| u64::from_str_radix(s.trim_start_matches("0x"), 16).ok())
}

async fn eth_get_block_tx_hashes(rpc_url: &str, block_number: u64) -> Result<Vec<String>, String> {
    let client = reqwest::Client::new();
    let tag = format!("0x{:x}", block_number);
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getBlockByNumber",
        "params": [tag, false],
        "id": 1
    });
    let res: Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let block = res.get("result").ok_or_else(|| {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_getBlockByNumber failed")
            .to_string()
    })?;
    let txs = block
        .get("transactions")
        .and_then(|t| t.as_array())
        .ok_or_else(|| "block.transactions missing".to_string())?;
    Ok(txs
        .iter()
        .filter_map(|x| x.as_str().map(String::from))
        .collect())
}

async fn erc20_balance_of_at_block(
    rpc_url: &str,
    token: &str,
    owner: &str,
    block_number: u64,
) -> Result<[u8; 32], String> {
    let token = token.trim();
    let owner = owner.trim().trim_start_matches("0x");
    if owner.len() != 40 {
        return Err("invalid owner address".to_string());
    }
    let mut data = Vec::with_capacity(4 + 32);
    data.extend_from_slice(&selector_balance_of());
    data.extend_from_slice(&[0u8; 12]);
    data.extend_from_slice(&hex::decode(owner).map_err(|e| e.to_string())?);
    let call_data = format!("0x{}", hex::encode(&data));
    let block_tag = format!("0x{:x}", block_number);
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": token, "data": call_data}, block_tag],
        "id": 1
    });
    let res: Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let hex_result = res.get("result").and_then(|r| r.as_str()).ok_or_else(|| {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_call balanceOf failed")
            .to_string()
    })?;
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("balanceOf result too short".to_string());
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&raw[raw.len() - 32..]);
    Ok(out)
}

/// DB 行与 receipt 中 **`RegionVaultForwarded`** 一致；若区块内 **仅此一笔交易**，则校验 **`to`** 的 token 余额 **块末 − 块前** = **`amount`**。
pub async fn verify_region_vault_row_vs_chain(
    config: &ChainConfig,
    row: &RegionVaultForwardedEventRow,
    expected_vault: &str,
    topic0: &str,
) -> serde_json::Value {
    let want_topic0 = topic0.trim().to_ascii_lowercase();
    let vault_cfg = norm_hex_addr(expected_vault);
    let vault_row = norm_hex_addr(&row.vault_address);

    let receipt = match get_transaction_receipt(&config.rpc_url, &row.tx_hash).await {
        Ok(r) => r,
        Err(e) => {
            return serde_json::json!({
                "ok": false,
                "chain_id": row.chain_id,
                "block_number": row.block_number,
                "log_index": row.log_index,
                "tx_hash": row.tx_hash,
                "error": e,
            });
        }
    };

    let receipt_tx = receipt
        .get("transactionHash")
        .and_then(|h| h.as_str())
        .unwrap_or("");
    if norm_tx_hash(receipt_tx) != norm_tx_hash(&row.tx_hash) {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "receipt_transaction_hash_mismatch",
            "receipt_tx": receipt_tx,
        });
    }

    let bn = match receipt_block_number_u64(&receipt) {
        Some(n) => n,
        None => {
            return serde_json::json!({
                "ok": false,
                "chain_id": row.chain_id,
                "block_number": row.block_number,
                "log_index": row.log_index,
                "tx_hash": row.tx_hash,
                "error": "receipt_block_number_missing",
            });
        }
    };

    if bn as i64 != row.block_number {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "receipt_block_number_mismatch_db",
            "receipt_block_number": bn,
        });
    }

    let logs = match receipt.get("logs").and_then(|l| l.as_array()) {
        Some(l) => l,
        None => {
            return serde_json::json!({
                "ok": false,
                "chain_id": row.chain_id,
                "block_number": row.block_number,
                "log_index": row.log_index,
                "tx_hash": row.tx_hash,
                "error": "receipt_logs_missing",
            });
        }
    };

    let mut found: Option<(String, Vec<String>, Value)> = None;
    for log in logs {
        let li = log
            .get("logIndex")
            .and_then(|x| x.as_str())
            .and_then(|s| u32::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .unwrap_or(0);
        if li != row.log_index as u32 {
            continue;
        }
        let addr = log
            .get("address")
            .and_then(|a| a.as_str())
            .unwrap_or("")
            .to_string();
        let topics: Vec<String> = log
            .get("topics")
            .and_then(|t| t.as_array())
            .map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect())
            .unwrap_or_default();
        let data = log.get("data").cloned().unwrap_or(Value::Null);
        found = Some((addr, topics, data));
        break;
    }

    let Some((log_addr, topics, data)) = found else {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "log_not_found_in_receipt",
        });
    };

    let log_vault = norm_hex_addr(&log_addr);
    if log_vault != vault_row || log_vault != vault_cfg {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "vault_address_mismatch",
            "log_address": log_vault,
            "db_vault_address": vault_row,
            "config_vault_address": vault_cfg,
        });
    }

    let t0 = topics
        .first()
        .map(|s| s.trim().to_ascii_lowercase())
        .unwrap_or_default();
    if t0 != want_topic0 {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "topic0_mismatch",
            "want_topic0": want_topic0,
            "got_topic0": t0,
        });
    }

    let Some((token, to, amount_hex)) = parse_region_vault_forwarded(&topics, &data) else {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "parse_region_vault_forwarded_failed",
        });
    };

    if norm_hex_addr(&token) != norm_hex_addr(&row.token_address) {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "field_mismatch",
            "field": "token_address",
            "chain": token,
            "db": row.token_address,
        });
    }
    if norm_hex_addr(&to) != norm_hex_addr(&row.to_address) {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "field_mismatch",
            "field": "to_address",
            "chain": to,
            "db": row.to_address,
        });
    }
    if norm_u256_hex(&amount_hex) != norm_u256_hex(&row.amount_u256_hex) {
        return serde_json::json!({
            "ok": false,
            "chain_id": row.chain_id,
            "block_number": row.block_number,
            "log_index": row.log_index,
            "tx_hash": row.tx_hash,
            "error": "field_mismatch",
            "field": "amount_u256_hex",
            "chain": amount_hex,
            "db": row.amount_u256_hex,
        });
    }

    // —— B-082：单交易块内，收款地址 token 余额差 = amount ——
    let mut balance_check = serde_json::json!({
        "balance_delta_check": "skipped",
        "note": serde_json::Value::Null,
    });

    if bn == 0 {
        balance_check["balance_delta_check"] = json!("skipped_block_zero");
        balance_check["note"] = json!("no_parent_block_for_balance_of");
    } else {
        match eth_get_block_tx_hashes(&config.rpc_url, bn).await {
            Ok(hashes) => {
                let single = hashes.len() == 1
                    && norm_tx_hash(&hashes[0]) == norm_tx_hash(&row.tx_hash);
                balance_check["block_tx_count"] = json!(hashes.len());
                balance_check["single_tx_block"] = json!(single);

                if !single {
                    balance_check["balance_delta_check"] = json!("skipped_multi_tx_or_hash_mismatch");
                    balance_check["note"] = json!("delta_equals_event_amount_only_when_this_tx_is_the_sole_tx_in_block");
                } else {
                    match (
                        erc20_balance_of_at_block(&config.rpc_url, &token, &to, bn).await,
                        erc20_balance_of_at_block(&config.rpc_url, &token, &to, bn - 1).await,
                    ) {
                        (Ok(after), Ok(before)) => {
                            let delta = match u256_sub_nonneg(after, before) {
                                Some(d) => d,
                                None => {
                                    balance_check["balance_delta_check"] = json!("error");
                                    balance_check["note"] = json!("after_balance_lt_before");
                                    return serde_json::json!({
                                        "ok": false,
                                        "chain_id": row.chain_id,
                                        "block_number": row.block_number,
                                        "log_index": row.log_index,
                                        "tx_hash": row.tx_hash,
                                        "vault_address": log_vault,
                                        "token_address": norm_hex_addr(&token),
                                        "to_address": norm_hex_addr(&to),
                                        "amount_u256_hex": norm_u256_hex(&amount_hex),
                                        "balance_closure": balance_check,
                                        "error": "erc20_balance_delta_underflow",
                                    });
                                }
                            };
                            let want = match u256_from_hex_32(&row.amount_u256_hex) {
                                Some(w) => w,
                                None => {
                                    balance_check["balance_delta_check"] = json!("error");
                                    balance_check["note"] = json!("invalid_amount_hex");
                                    return serde_json::json!({
                                        "ok": false,
                                        "chain_id": row.chain_id,
                                        "block_number": row.block_number,
                                        "log_index": row.log_index,
                                        "tx_hash": row.tx_hash,
                                        "vault_address": log_vault,
                                        "balance_closure": balance_check,
                                        "error": "invalid_amount_hex_for_delta",
                                    });
                                }
                            };
                            let match_delta = delta == want;
                            balance_check["balance_delta_check"] =
                                if match_delta { json!("ok") } else { json!("mismatch") };
                            balance_check["balance_after_block_hex"] =
                                json!(format!("0x{}", hex::encode(after)));
                            balance_check["balance_before_block_hex"] =
                                json!(format!("0x{}", hex::encode(before)));
                            balance_check["balance_delta_hex"] =
                                json!(format!("0x{}", hex::encode(delta)));
                            balance_check["event_amount_hex"] =
                                json!(norm_u256_hex(&row.amount_u256_hex));

                            if !match_delta {
                                return serde_json::json!({
                                    "ok": false,
                                    "chain_id": row.chain_id,
                                    "block_number": row.block_number,
                                    "log_index": row.log_index,
                                    "tx_hash": row.tx_hash,
                                    "vault_address": log_vault,
                                    "token_address": norm_hex_addr(&token),
                                    "to_address": norm_hex_addr(&to),
                                    "amount_u256_hex": norm_u256_hex(&amount_hex),
                                    "balance_closure": balance_check,
                                    "error": "balance_delta_neq_event_amount",
                                });
                            }
                        }
                        (Err(e), _) | (_, Err(e)) => {
                            balance_check["balance_delta_check"] = json!("rpc_error");
                            balance_check["note"] = json!(e);
                            return serde_json::json!({
                                "ok": false,
                                "chain_id": row.chain_id,
                                "block_number": row.block_number,
                                "log_index": row.log_index,
                                "tx_hash": row.tx_hash,
                                "vault_address": log_vault,
                                "balance_closure": balance_check,
                                "error": "erc20_balance_of_at_block_failed",
                            });
                        }
                    }
                }
            }
            Err(e) => {
                balance_check["balance_delta_check"] = json!("rpc_error");
                balance_check["note"] = json!(e);
                return serde_json::json!({
                    "ok": false,
                    "chain_id": row.chain_id,
                    "block_number": row.block_number,
                    "log_index": row.log_index,
                    "tx_hash": row.tx_hash,
                    "vault_address": log_vault,
                    "balance_closure": balance_check,
                    "error": "eth_getBlockByNumber_failed",
                });
            }
        }
    }

    serde_json::json!({
        "ok": true,
        "chain_id": row.chain_id,
        "block_number": row.block_number,
        "log_index": row.log_index,
        "tx_hash": row.tx_hash,
        "vault_address": log_vault,
        "token_address": norm_hex_addr(&token),
        "to_address": norm_hex_addr(&to),
        "amount_u256_hex": norm_u256_hex(&amount_hex),
        "balance_closure": balance_check,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn region_vault_forwarded_topic0_stable() {
        let t = region_vault_forwarded_topic0_hex();
        assert!(t.starts_with("0x"));
        assert_eq!(t.len(), 66);
    }

    #[test]
    fn u256_sub_simple() {
        let a = u256_from_hex_32("0x05").unwrap();
        let b = u256_from_hex_32("0x02").unwrap();
        let d = u256_sub_nonneg(a, b).unwrap();
        assert_eq!(norm_u256_hex(&format!("0x{}", hex::encode(d))), norm_u256_hex("0x3"));
    }
}
